"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCart, CartContextType, CartItem } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Lock, Loader2, Truck, RotateCcw, Tag } from 'lucide-react';
import styles from './Checkout.module.css';

// Dynamic PayPal Client ID fetched from API is now handled via state
type CouponDefinition = {
    code: string;
    amount: string;
    discount_type: string;
    minimum_amount?: string;
    maximum_amount?: string;
};

export default function CheckoutPage() {
    const {
        cart, clearCart, cartTotal, wcCart, cartInitialized,
        applyCouponToCart, removeCouponFromCart, updateCustomerAddress
    } = useCart() as CartContextType;
    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', company: '', email: '', phone: '',
        address: '', address2: '', city: '', state: '', zip: '',
        country: 'US', orderNotes: '',
        checkoutStartedAt: Date.now(),
        companyWebsite: '',
    });
    const [createAccount, setCreateAccount] = useState(false);
    const [accountPassword, setAccountPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // UI state
    const [isProcessing, setIsProcessing] = useState(false);
    const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponDefinitions, setCouponDefinitions] = useState<Record<string, CouponDefinition>>({});
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponMsg, setCouponMsg] = useState<{text: string, type: 'error' | 'success'} | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [paypalLoaded, setPaypalLoaded] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState('paypal');
    const [gateways, setGateways] = useState<any[]>([]);
    const [gatewaysLoading, setGatewaysLoading] = useState(true);
    const [fetchedClientId, setFetchedClientId] = useState<string | null>(null);
    const [paypalClientToken, setPaypalClientToken] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [cardFieldsReady, setCardFieldsReady] = useState(false);
    const [cardFieldsFailed, setCardFieldsFailed] = useState(false);
    const [cardFormValid, setCardFormValid] = useState(false);
    const [cardFormTouched, setCardFormTouched] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    // Refs for stable closures in PayPal callbacks
    const paypalContainerRef = useRef<HTMLDivElement>(null);
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const paypalBtnsRef = useRef<any>(null);
    const cardBtnsRef = useRef<any>(null);
    const cardFieldsInstanceRef = useRef<any>(null);
    const cardFieldRefs = useRef<Record<string, any>>({});

    const formRef = useRef(formData);
    const agreedRef = useRef(agreedToTerms);
    const cartRef = useRef(cart);
    const createAccountRef = useRef(createAccount);
    const accountPasswordRef = useRef(accountPassword);
    const customerIdRef = useRef<number | null>(null);
    const checkoutProtectionRef = useRef({
        checkoutStartedAt: formData.checkoutStartedAt,
        companyWebsite: formData.companyWebsite,
    });
    const totalRef = useRef(0);
    const subtotalRef = useRef(0);
    const shippingRef = useRef(0);
    const taxRef = useRef(0);
    const discountRef = useRef(0);
    const couponsRef = useRef<string[]>([]);

    // Calculate totals
    const getVal = (str?: any) => {
        if (!str || typeof str !== 'string') return 0;
        const normalized = str.replace(/[^0-9.]/g, '');
        const val = parseFloat(normalized || '0');
        if (isNaN(val)) return 0;
        // If the string already contains a decimal point, assume it's NOT in minor units
        if (normalized.includes('.')) return val * factor;
        return val;
    };
    const minorUnit = wcCart?.totals?.currency_minor_unit || 2;
    const factor = Math.pow(10, minorUnit);
    
    const wcSubtotal = wcCart?.totals?.total_items ? getVal(wcCart.totals.total_items) / factor : 0;
    const localItemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const wcItemQuantityCount = Number(wcCart?.items_count || wcCart?.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0);
    const wcItemsMatchLocalCart = wcCart?.items?.length === cart.length && cart.every((cartItem) => {
        const wcItem = wcCart?.items?.find((item) => item.id === cartItem.product.id);
        return wcItem && Number(wcItem.quantity) === Number(cartItem.quantity);
    });
    const wcQuantityMatchesLocalCart = localItemCount > 0 && wcItemQuantityCount === localItemCount;
    // Only trust WC subtotal when item counts match — coupon alone is not enough
    // because WC cart may only have a subset of local cart items synced.
    const wcSynced = wcSubtotal > 0 && (wcItemsMatchLocalCart || wcQuantityMatchesLocalCart);

    // Always use local cartTotal as subtotal — it is derived from localStorage and is always complete.
    // wcSubtotal can be wrong when WC cart is partially synced (fewer items than local cart).
    const subtotal = cartTotal;
    const localShipping = subtotal > 59.99 ? 0 : 5.99;
    const tax = wcSynced && wcCart?.totals?.total_tax ? getVal(wcCart.totals.total_tax) / factor : 0;
    const appliedCoupons = wcCart?.coupons || [];
    const couponCodes = appliedCoupons
        .map((coupon: any) => String(coupon?.code || '').trim())
        .filter(Boolean);
    const couponDiscount = appliedCoupons.reduce((sum: number, coupon: any) => {
        const totals = coupon?.totals || {};
        return sum + (totals.total_discount ? getVal(totals.total_discount) / factor : 0);
    }, 0);
    const rawDiscount = Math.max(
        wcCart?.totals?.total_discount ? getVal(wcCart.totals.total_discount) / factor : 0,
        couponDiscount
    );
    const apiPercentDiscount = couponCodes.reduce((sum, code) => {
        const definition = couponDefinitions[code.toUpperCase()];
        if (!definition || definition.discount_type !== 'percent') return sum;

        const percent = Number(definition.amount || 0);
        const minimum = Number(definition.minimum_amount || 0);
        const maximum = Number(definition.maximum_amount || 0);
        if (!Number.isFinite(percent) || percent <= 0) return sum;
        if (minimum > 0 && subtotal < minimum) return sum;

        const amount = subtotal * (percent / 100);
        return sum + (maximum > 0 ? Math.min(amount, maximum) : amount);
    }, 0);
    const discount = Math.min(
        subtotal,
        Math.max(rawDiscount, apiPercentDiscount)
    );

    let shipping: number;
    if (subtotal > 59.99) {
        shipping = 0;
    } else if (wcCart?.totals?.total_shipping != null && wcSynced) {
        shipping = getVal(wcCart.totals.total_shipping) / factor;
    } else {
        shipping = localShipping;
    }

    // Always compute total from local subtotal to avoid WC partial-sync errors.
    const total = subtotal + shipping + tax - discount;
    const freeShippingThreshold = 59.99;
    const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);
    totalRef.current = total;
    subtotalRef.current = subtotal;
    shippingRef.current = shipping;
    taxRef.current = tax;
    discountRef.current = discount;
    couponsRef.current = couponCodes;

    const getCheckoutTotalsPayload = () => ({
        subtotal: Number(subtotalRef.current.toFixed(2)),
        shipping: Number(shippingRef.current.toFixed(2)),
        tax: Number(taxRef.current.toFixed(2)),
        discount: Number(discountRef.current.toFixed(2)),
        total: Number(totalRef.current.toFixed(2)),
        coupons: couponsRef.current,
    });

    // Keep refs in sync with state
    useEffect(() => { formRef.current = formData; }, [formData]);
    useEffect(() => {
        checkoutProtectionRef.current = {
            checkoutStartedAt: formData.checkoutStartedAt,
            companyWebsite: formData.companyWebsite,
        };
    }, [formData.checkoutStartedAt, formData.companyWebsite]);
    useEffect(() => { agreedRef.current = agreedToTerms; }, [agreedToTerms]);
    useEffect(() => { cartRef.current = cart; }, [cart]);
    useEffect(() => { createAccountRef.current = createAccount; }, [createAccount]);
    useEffect(() => { accountPasswordRef.current = accountPassword; }, [accountPassword]);

    useEffect(() => {
        const missingCodes = couponCodes
            .map((code) => code.toUpperCase())
            .filter((code) => !couponDefinitions[code]);
        if (missingCodes.length === 0) return;

        let cancelled = false;
        Promise.all(missingCodes.map(async (code) => {
            const res = await fetch(`/api/wc/coupons/?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
            if (!res.ok) return null;
            return await res.json() as CouponDefinition;
        })).then((definitions) => {
            if (cancelled) return;
            setCouponDefinitions(prev => {
                const next = { ...prev };
                definitions.filter(Boolean).forEach((definition) => {
                    next[String(definition!.code).toUpperCase()] = definition!;
                });
                return next;
            });
        }).catch(() => {});

        return () => { cancelled = true; };
    }, [couponCodes, couponDefinitions]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-fill form from logged-in user
    useEffect(() => {
        const savedUser = localStorage.getItem('jp_user');
        if (!savedUser) return;
        try {
            const user = JSON.parse(savedUser);
            if (user && typeof user === 'object') {
                setIsLoggedIn(true);
                customerIdRef.current = typeof user.id === 'number' ? user.id : null;
                const b = user.billing;
                if (b) {
                    setFormData(prev => ({
                        ...prev,
                        firstName: b.first_name || prev.firstName,
                        lastName: b.last_name || prev.lastName,
                        email: b.email || user.user_email || prev.email,
                        phone: b.phone || prev.phone,
                        address: b.address_1 || prev.address,
                        address2: b.address_2 || prev.address2,
                        city: b.city || prev.city,
                        state: b.state || prev.state,
                        zip: b.postcode || prev.zip,
                        country: b.country || prev.country,
                    }));
                } else if (user.user_email) {
                    setFormData(prev => ({ ...prev, email: user.user_email }));
                }
            }
        } catch (e) {
            console.error('Failed to parse saved user:', e);
        }
    }, []);

    // Recalculate tax/shipping when address changes (debounced 800ms)
    useEffect(() => {
        const { country, state, zip, city } = formData;
        if (!country) return;
        const timer = setTimeout(() => {
            if (zip.length >= 5 || state || city) {
                updateCustomerAddress({ country, state, postcode: zip, city });
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [formData.country, formData.state, formData.zip, formData.city]);

    const validateForm = () => {
        // Sync DOM values first — browser autofill populates inputs without firing React onChange
        const fieldNames = ['email', 'phone', 'firstName', 'lastName', 'address', 'address2', 'city', 'state', 'zip', 'country', 'company', 'orderNotes'] as const;
        const synced = { ...formRef.current };
        fieldNames.forEach(name => {
            const el = document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
            if (el && el.value) synced[name] = el.value;
        });
        formRef.current = synced;

        const data = synced;
        const newErrors: Record<string, string> = {};
        if (!data.email) newErrors.email = 'Email is required';
        if (!data.phone) newErrors.phone = 'Phone number is required';
        if (!data.firstName) newErrors.firstName = 'First name is required';
        if (!data.lastName) newErrors.lastName = 'Last name is required';
        if (!data.address) newErrors.address = 'Street address is required';
        if (!data.city) newErrors.city = 'Town / City is required';
        if (!data.state) newErrors.state = 'State is required';
        if (!data.zip) newErrors.zip = 'ZIP code is required';

        setFieldErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            setError('Please fill in all required fields highlighted below.');
            return false;
        }

        if (!agreedRef.current) {
            const termsMsg = 'Please check the box to agree to the website terms and conditions.';
            setError(termsMsg);
            setFieldErrors(prev => ({ ...prev, terms: 'required' }));
            alert(termsMsg); // Explicit alert as requested
            return false;
        }

        setError(null);
        return true;
    };

    // Fetch available gateways and Client ID
    useEffect(() => {
        const fetchGateways = async () => {
            try {
                const res = await fetch('/api/wc/payment-gateways/');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setGateways(data);
                    const ppcp = data.find((g: any) => g.id === 'ppcp-gateway');
                    if (ppcp?.clientId) {
                        setFetchedClientId(ppcp.clientId);
                    } else {
                        // No client ID returned from API
                        console.error('[Checkout] No PayPal Client ID in gateway response:', data);
                        setError('Payment system configuration error. Please contact support or try again later.');
                        setGatewaysLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch gateways:', err);
                setError('Unable to load payment options. Please refresh the page and try again.');
            } finally {
                setGatewaysLoading(false);
            }
        };
        fetchGateways();
    }, []);

    useEffect(() => {
        if (!fetchedClientId || paypalClientToken) return;
        const fetchClientToken = async () => {
            try {
                const res = await fetch('/api/paypal/client-token/', { cache: 'no-store' });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.clientToken) {
                    setPaypalClientToken(data.clientToken);
                } else {
                    console.error('[Checkout] PayPal client token missing:', data);
                    setCardFieldsFailed(true);
                }
            } catch (err) {
                console.error('[Checkout] Failed to fetch PayPal client token:', err);
                setCardFieldsFailed(true);
            }
        };
        fetchClientToken();
    }, [fetchedClientId, paypalClientToken]);

    // Load PayPal SDK Script
    useEffect(() => {
        if (!fetchedClientId || !paypalClientToken || paypalLoaded) return;
        const s = document.createElement('script');
        s.src = `https://www.paypal.com/sdk/js?client-id=${fetchedClientId}&components=buttons,funding-eligibility,card-fields&currency=USD&intent=capture&commit=false&vault=false`;
        s.setAttribute('data-client-token', paypalClientToken);
        s.async = true;
        s.onload = () => setPaypalLoaded(true);
        s.onerror = () => {
            console.error('PayPal SDK failed to load.');
            setError('Failed to load payment system. Please refresh the page or contact support.');
        };
        document.body.appendChild(s);

        // Fail gracefully if SDK doesn't load within 20 seconds
        const timeout = setTimeout(() => {
            if (!(window as any).paypal) {
                console.error('[Checkout] PayPal SDK load timeout');
                setError('Payment system is taking too long to load. Please refresh the page and try again.');
            }
        }, 20000);

        return () => clearTimeout(timeout);
    }, [fetchedClientId, paypalClientToken, paypalLoaded]);

    const startProcessing = () => {
        setIsProcessing(true);
        setError(null);
        if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = setTimeout(() => {
            setIsProcessing(false);
            processingTimeoutRef.current = null;
            setError('Payment is taking longer than expected. Please refresh and try again, or contact info@jerseyperfume.com.');
        }, 120000);
    };

    const stopProcessing = () => {
        setIsProcessing(false);
        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
        }
    };

    const getCardErrorMessage = (errors?: string[]) => {
        if (!errors || errors.length === 0) return 'Please enter valid card details.';
        if (errors.includes('INVALID_NUMBER')) return 'Please enter a valid card number.';
        if (errors.includes('INVALID_EXPIRY')) return 'Please enter a valid expiry date.';
        if (errors.includes('INVALID_CVV')) return 'Please enter a valid CVV.';
        if (errors.includes('INVALID_NAME')) return 'Please enter the cardholder name.';
        if (errors.some(err => err.includes('EMPTY') || err.includes('MISSING'))) return 'Please complete all card fields.';
        return 'Please check the card details and try again.';
    };

    const getPaymentErrorMessage = (err: any) => {
        const msg = String(err?.message || err?.details?.[0]?.description || '');
        const issue = String(err?.details?.[0]?.issue || '');
        if (msg.includes('UNPROCESSABLE_ENTITY') || msg.includes('422') || issue.includes('UNPROCESSABLE_ENTITY')) {
            return 'Your card could not be verified. Please check the card details or try another card.';
        }
        return msg || 'Card payment failed. Please check your card details and try again.';
    };

    const isExpectedPayPalCardDecline = (err: any) => {
        const text = typeof err === 'string' ? err : JSON.stringify(err || {});
        return text.includes('confirm-payment-source') || text.includes('UNPROCESSABLE_ENTITY') || text.includes('status 422');
    };

    useEffect(() => {
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
            if (args.some(isExpectedPayPalCardDecline)) return;
            originalConsoleError(...args);
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            if (isExpectedPayPalCardDecline(event.reason)) {
                event.preventDefault();
                setCardError('Your card could not be verified. Please check the card details or try another card.');
            }
        };

        window.addEventListener('unhandledrejection', handleRejection);
        return () => {
            console.error = originalConsoleError;
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    // Render PayPal & Card Buttons — runs once when SDK loads, never on gateway tab switch.
    useEffect(() => {
        if (!paypalLoaded) return;

        const paypal = (window as any).paypal;
        if (!paypal) return;

        const createOrderForPayPal = async () => {
            const res = await fetch('/api/paypal/create-order/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalRef.current.toFixed(2),
                    cartItems: cartRef.current,
                    checkoutTotals: getCheckoutTotalsPayload(),
                    checkoutProtection: checkoutProtectionRef.current,
                }),
            });
            const data = await res.json();
            if (!data.id) throw new Error(data.error || 'Failed to create PayPal order');
            return data.id;
        };

        const completeOrder = async (paypalOrderId: string, transactionId: string) => {
            const res = await fetch('/api/paypal/complete-order/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paypalOrderId,
                    paypalTransactionId: transactionId,
                    formData: formRef.current,
                    cartItems: cartRef.current,
                    checkoutTotals: getCheckoutTotalsPayload(),
                    customerId: customerIdRef.current,
                    checkoutProtection: checkoutProtectionRef.current,
                    createAccount: createAccountRef.current,
                    accountPassword: accountPasswordRef.current,
                }),
            });
            return res.json();
        };

        // PayPal Yellow Button (no startProcessing in createOrder — only in onApprove)
        if (paypalContainerRef.current && !paypalBtnsRef.current) {
            try {
                const btns = paypal.Buttons({
                    fundingSource: paypal.FUNDING.PAYPAL,
                    style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'checkout', height: 50 },
                    onClick: (_d: any, actions: any) => validateForm() ? actions.resolve() : actions.reject(),
                    createOrder: createOrderForPayPal,
                    onApprove: async (data: any, actions: any) => {
                        startProcessing();
                        try {
                            const capture = await actions.order.capture();
                            const result = await completeOrder(data.orderID, capture.id);
                            stopProcessing();
                            if (result.success) { clearCart(); router.push(`/order-success/?id=${result.orderId}&key=${result.orderKey}`); }
                            else throw new Error(result.error || 'Failed to complete order');
                        } catch (err: any) {
                            stopProcessing();
                            setError(err.message || 'Order could not be placed. Please contact info@jerseyperfume.com.');
                        }
                    },
                    onCancel: () => stopProcessing(),
                    onError: (err: any) => {
                        console.error('[PayPal]', err);
                        stopProcessing();
                        setError(prev => (prev && prev.includes('terms')) ? prev : 'Payment error. Please try again.');
                    },
                });
                if (btns.isEligible()) {
                    paypalBtnsRef.current = btns;
                    btns.render(paypalContainerRef.current).catch(() => {});
                }
            } catch (err) { console.error('[PayPal] Button init error:', err); }
        }

        return () => {
            if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
            if (paypalBtnsRef.current) { try { paypalBtnsRef.current.close(); paypalBtnsRef.current = null; } catch (_) {} }
        };
    }, [paypalLoaded, mounted]);

    // Lazy CardFields init — fires when card tab is selected so containers are visible in DOM.
    // Uses paypal.CardFields (newer API matching the live WooCommerce backend).
    useEffect(() => {
        if (selectedGateway !== 'paypal-credit') return;
        if (!paypalLoaded) return;
        if (cardFieldsInstanceRef.current || cardFieldsFailed) return;

        const paypal = (window as any).paypal;
        if (!paypal?.CardFields) { setCardFieldsFailed(true); return; }

        const cardFields = paypal.CardFields({
            inputEvents: {
                onChange: (data: any) => {
                    setCardFormTouched(true);
                    setCardFormValid(Boolean(data.isFormValid));
                    setCardError(data.isFormValid ? null : getCardErrorMessage(data.errors));
                },
                onInputSubmitRequest: (data: any) => {
                    setCardFormTouched(true);
                    if (data.isFormValid) {
                        handleCardSubmit();
                    } else {
                        setCardError(getCardErrorMessage(data.errors));
                    }
                },
            },
            createOrder: async () => {
                const res = await fetch('/api/paypal/create-order/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: totalRef.current.toFixed(2),
                        paymentSource: 'card',
                        cartItems: cartRef.current,
                        checkoutTotals: getCheckoutTotalsPayload(),
                        checkoutProtection: checkoutProtectionRef.current,
                    }),
                });
                const d = await res.json();
                if (!d.id) throw new Error(d.error || 'Failed to create order');
                return d.id;
            },
            onApprove: async (data: { orderID: string }) => {
                try {
                    const result = await fetch('/api/paypal/complete-order/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paypalOrderId: data.orderID,
                            shouldCapture: true,
                            formData: formRef.current,
                            cartItems: cartRef.current,
                            checkoutTotals: getCheckoutTotalsPayload(),
                            customerId: customerIdRef.current,
                            checkoutProtection: checkoutProtectionRef.current,
                            createAccount: createAccountRef.current,
                            accountPassword: accountPasswordRef.current,
                        }),
                    }).then(r => r.json());
                    stopProcessing();
                    if (result.success) { clearCart(); router.push(`/order-success/?id=${result.orderId}&key=${result.orderKey}`); }
                    else throw new Error(result.error || 'Order failed. Please contact info@jerseyperfume.com.');
                } catch (err: any) {
                    stopProcessing();
                    setError(err.message || 'Order failed. Please contact info@jerseyperfume.com.');
                }
            },
            onError: (err: any) => {
                if (!isExpectedPayPalCardDecline(err)) console.error('[CardFields]', err);
                stopProcessing();
                setCardError(getPaymentErrorMessage(err));
                setError(getPaymentErrorMessage(err));
            },
            style: {
                input: {
                    'font-size': '16px',
                    'color': '#333',
                    'font-family': 'inherit',
                    'height': '44px',
                    'line-height': '44px',
                    'padding': '0 14px',
                    'border': 'none',
                    'box-shadow': 'none',
                    'outline': 'none',
                },
                ':focus': { 'color': '#111' },
                '.valid': { 'color': '#2e7d32' },
                '.invalid': { 'color': '#c62828' },
            },
        });

        if (!cardFields.isEligible()) {
            setCardFieldsFailed(true);
            return;
        }

        try {
            const nameField = cardFields.NameField({ placeholder: 'Name on card' });
            const numberField = cardFields.NumberField({ placeholder: 'Card number' });
            const expiryField = cardFields.ExpiryField({ placeholder: 'MM / YY' });
            const cvvField = cardFields.CVVField({ placeholder: 'CVV' });
            const renders = [
                nameField.render('#cf-card-name'),
                numberField.render('#cf-card-number'),
                expiryField.render('#cf-card-expiry'),
                cvvField.render('#cf-card-cvv'),
            ];
            Promise.all(renders).then(() => {
                cardFieldsInstanceRef.current = cardFields;
                cardFieldRefs.current = {
                    name: nameField,
                    number: numberField,
                    expiry: expiryField,
                    cvv: cvvField,
                };
                setCardFieldsReady(true);
            }).catch((err: any) => {
                console.error('[CardFields] render failed:', err);
                setCardFieldsFailed(true);
            });
        } catch (err) {
            console.error('[CardFields] init error:', err);
            setCardFieldsFailed(true);
        }
    }, [selectedGateway, paypalLoaded, cardFieldsFailed]);

    // Fallback card button for accounts/browsers where hosted fields are not eligible.
    useEffect(() => {
        if (selectedGateway !== 'paypal-credit') return;
        if (!paypalLoaded || !cardFieldsFailed) return;
        if (!cardContainerRef.current || cardBtnsRef.current) return;

        const paypal = (window as any).paypal;
        if (!paypal?.Buttons || !paypal?.FUNDING?.CARD) return;

        try {
            const cardBtns = paypal.Buttons({
                fundingSource: paypal.FUNDING.CARD,
                style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay', height: 50 },
                onClick: (_d: any, actions: any) => validateForm() ? actions.resolve() : actions.reject(),
                createOrder: async () => {
                    const res = await fetch('/api/paypal/create-order/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: totalRef.current.toFixed(2),
                            paymentSource: 'card',
                            cartItems: cartRef.current,
                            checkoutTotals: getCheckoutTotalsPayload(),
                            checkoutProtection: checkoutProtectionRef.current,
                        }),
                    });
                    const data = await res.json();
                    if (!data.id) throw new Error(data.error || 'Failed to create PayPal order');
                    return data.id;
                },
                onApprove: async (data: any, actions: any) => {
                    startProcessing();
                    try {
                        const capture = await actions.order.capture();
                        const result = await fetch('/api/paypal/complete-order/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                paypalOrderId: data.orderID,
                                paypalTransactionId: capture.id,
                                formData: formRef.current,
                                cartItems: cartRef.current,
                                checkoutTotals: getCheckoutTotalsPayload(),
                                customerId: customerIdRef.current,
                                checkoutProtection: checkoutProtectionRef.current,
                                createAccount: createAccountRef.current,
                                accountPassword: accountPasswordRef.current,
                            }),
                        }).then(r => r.json());
                        stopProcessing();
                        if (result.success) { clearCart(); router.push(`/order-success/?id=${result.orderId}&key=${result.orderKey}`); }
                        else throw new Error(result.error || 'Failed to complete order');
                } catch (err: any) {
                    stopProcessing();
                    setError(getPaymentErrorMessage(err));
                }
            },
            onCancel: () => stopProcessing(),
            onError: (err: any) => {
                    if (!isExpectedPayPalCardDecline(err)) console.error('[Card Button]', err);
                    stopProcessing();
                    setError(getPaymentErrorMessage(err));
                },
            });

            if (cardBtns.isEligible()) {
                cardBtnsRef.current = cardBtns;
                cardBtns.render(cardContainerRef.current).catch((err: any) => {
                    console.error('[Card Button] render failed:', err);
                    setError('Card payment is unavailable. Please use PayPal or try again later.');
                });
            } else {
                setError('Card payment is unavailable. Please use PayPal or try again later.');
            }
        } catch (err) {
            console.error('[Card Button] init error:', err);
            setError('Card payment is unavailable. Please use PayPal or try again later.');
        }

        return () => {
            if (cardBtnsRef.current) {
                try { cardBtnsRef.current.close(); } catch (_) {}
                cardBtnsRef.current = null;
            }
        };
    }, [selectedGateway, paypalLoaded, cardFieldsFailed]);

    const handleCardSubmit = async () => {
        if (!validateForm()) return;
        if (!cardFieldsInstanceRef.current) { setError('Card form not ready. Please refresh the page.'); return; }
        setCardFormTouched(true);
        setCardError(null);
            const state = await Promise.resolve(cardFieldsInstanceRef.current.getState?.());
        if (state && !state.isFormValid) {
            setCardError(getCardErrorMessage(state.errors));
            return;
        }
        startProcessing();
        try {
            await cardFieldsInstanceRef.current.submit({
                billingAddress: {
                    addressLine1: formRef.current.address,
                    addressLine2: formRef.current.address2 || '',
                    adminArea1: formRef.current.state,
                    adminArea2: formRef.current.city,
                    postalCode: formRef.current.zip,
                    countryCode: formRef.current.country,
                },
            });
            // onApprove callback handles order completion and navigation
        } catch (err: any) {
            if (!isExpectedPayPalCardDecline(err)) console.error('[CardFields submit]', err);
            stopProcessing();
            const message = getPaymentErrorMessage(err);
            setCardError(message);
            setError(message);
        }
    };

    const handleApplyCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponMsg(null);
        const res = await applyCouponToCart(couponCode.trim());
        if (res.success) {
            setCouponMsg({ text: 'Coupon applied!', type: 'success' });
            setCouponCode('');
        } else {
            setCouponMsg({ text: res.message || 'Invalid coupon', type: 'error' });
        }
        setCouponLoading(false);
    };

    const handleRemoveCoupon = async (code: string) => {
        setCouponLoading(true);
        setCouponMsg(null);
        const res = await removeCouponFromCart(code);
        if (res.success) {
            setCouponMsg({ text: 'Coupon removed.', type: 'success' });
        } else {
            setCouponMsg({ text: res.message || 'Failed to remove coupon. Please refresh and try again.', type: 'error' });
        }
        setCouponLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    if (!mounted || !cartInitialized) {
        return (
            <div className={styles.emptyContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <Loader2 size={20} className={styles.spinIcon} />
                <span>Loading checkout...</span>
            </div>
        );
    }

    if (cart.length === 0 && !isProcessing) {
        return (
            <div className={styles.emptyContainer}>
                <h2>Your Cart is Empty</h2>
                <p>Add some luxury fragrances to proceed to checkout.</p>
                <button onClick={() => router.push('/shop')} className={styles.shoppingBtn}>Continue Shopping</button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.checkoutHeader}>
                <h1>Checkout</h1>
                <p><Lock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> Encrypted via 256-bit SSL</p>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.checkoutGrid}>

                {/* LEFT — Billing / Shipping Form */}
                <div className={styles.leftCol}>
                    <input
                        type="text"
                        name="companyWebsite"
                        value={formData.companyWebsite}
                        onChange={handleChange}
                        autoComplete="off"
                        tabIndex={-1}
                        aria-hidden="true"
                        style={{ display: 'none' }}
                    />
                    <div className={styles.sectionBlock}>
                        <h2 className={styles.sectionTitle}>Contact Information</h2>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Email Address *</label>
                                <input required type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} placeholder="Email for order tracking" className={fieldErrors.email ? styles.errorInput : ''} />
                                {fieldErrors.email && <span className={styles.errorText}>{fieldErrors.email}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone Number *</label>
                                <input required type="tel" name="phone" autoComplete="tel" value={formData.phone} onChange={handleChange} placeholder="Mobile number" className={fieldErrors.phone ? styles.errorInput : ''} />
                                {fieldErrors.phone && <span className={styles.errorText}>{fieldErrors.phone}</span>}
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <h2 className={styles.sectionTitle}>Billing / Shipping Address</h2>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>First Name *</label>
                                <input required type="text" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleChange} className={fieldErrors.firstName ? styles.errorInput : ''} />
                                {fieldErrors.firstName && <span className={styles.errorText}>{fieldErrors.firstName}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Last Name *</label>
                                <input required type="text" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleChange} className={fieldErrors.lastName ? styles.errorInput : ''} />
                                {fieldErrors.lastName && <span className={styles.errorText}>{fieldErrors.lastName}</span>}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Company Name (optional)</label>
                            <input type="text" name="company" autoComplete="organization" value={formData.company} onChange={handleChange} placeholder="Company (optional)" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Country / Region *</label>
                            <select required name="country" value={formData.country} onChange={handleChange} className={styles.selectInput}>
                                <option value="US">United States (US)</option>
                                <option value="GB">United Kingdom</option>
                                <option value="CA">Canada</option>
                                <option value="AU">Australia</option>
                                <option value="AE">United Arab Emirates</option>
                                <option value="SA">Saudi Arabia</option>
                                <option value="IN">India</option>
                                <option value="PK">Pakistan</option>
                                <option value="NG">Nigeria</option>
                                <option value="GH">Ghana</option>
                                <option value="DE">Germany</option>
                                <option value="FR">France</option>
                                <option value="NL">Netherlands</option>
                                <option value="SE">Sweden</option>
                                <option value="NO">Norway</option>
                                <option value="DK">Denmark</option>
                                <option value="SG">Singapore</option>
                                <option value="MY">Malaysia</option>
                                <option value="JP">Japan</option>
                                <option value="KR">South Korea</option>
                                <option value="BR">Brazil</option>
                                <option value="MX">Mexico</option>
                                <option value="ZA">South Africa</option>
                                <option value="NZ">New Zealand</option>
                                <option value="IE">Ireland</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Street Address *</label>
                            <input required type="text" name="address" autoComplete="address-line1" value={formData.address} onChange={handleChange} placeholder="House number and street name" className={fieldErrors.address ? styles.errorInput : ''} />
                            {fieldErrors.address && <span className={styles.errorText}>{fieldErrors.address}</span>}
                        </div>
                        <div className={styles.formGroup}>
                            <input type="text" name="address2" autoComplete="address-line2" value={formData.address2} onChange={handleChange} placeholder="Apartment, suite, unit, etc. (optional)" />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Town / City *</label>
                                <input required type="text" name="city" autoComplete="address-level2" value={formData.city} onChange={handleChange} className={fieldErrors.city ? styles.errorInput : ''} />
                                {fieldErrors.city && <span className={styles.errorText}>{fieldErrors.city}</span>}
                            </div>
                            <div className={styles.formGroup} style={{ flex: '0 0 120px' }}>
                                <label>State *</label>
                                <input required type="text" name="state" autoComplete="address-level1" value={formData.state} onChange={handleChange} placeholder="State" className={fieldErrors.state ? styles.errorInput : ''} />
                                {fieldErrors.state && <span className={styles.errorText}>{fieldErrors.state}</span>}
                            </div>
                            <div className={styles.formGroup} style={{ flex: '0 0 140px' }}>
                                <label>ZIP Code *</label>
                                <input required type="text" name="zip" autoComplete="postal-code" value={formData.zip} onChange={handleChange} className={fieldErrors.zip ? styles.errorInput : ''} />
                                {fieldErrors.zip && <span className={styles.errorText}>{fieldErrors.zip}</span>}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Order Notes (optional)</label>
                            <textarea
                                name="orderNotes"
                                value={formData.orderNotes}
                                onChange={handleChange}
                                placeholder="Any special instructions for your order"
                                rows={3}
                                className={styles.textarea}
                            />
                        </div>
                    </div>

                    {/* Create Account Option — guests only */}
                    {!isLoggedIn && (
                        <div className={styles.sectionBlock}>
                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={createAccount}
                                    onChange={e => setCreateAccount(e.target.checked)}
                                    className={styles.checkboxInput}
                                />
                                Create an account with this order
                            </label>
                            {createAccount && (
                                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                    <label>Account Password *</label>
                                    <input
                                        type="password"
                                        required={createAccount}
                                        value={accountPassword}
                                        onChange={e => setAccountPassword(e.target.value)}
                                        placeholder="Create a password"
                                        minLength={6}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT — Order Summary Sidebar */}
                <div className={styles.rightCol}>
                    <div className={styles.summaryBlock}>

                        {/* Items */}
                        <div className={styles.summaryItems}>
                            {cart.filter(item => item?.product?.id).map((item: CartItem) => (
                                <div key={item.product.id} className={styles.summaryItem}>
                                    <div className={styles.itemImgWrapper}>
                                        {item.product.images?.[0]?.src && (
                                            <Image
                                                src={item.product.images[0].src}
                                                alt={item.product.name}
                                                width={60}
                                                height={60}
                                                style={{ objectFit: 'contain' }}
                                            />
                                        )}
                                        <span className={styles.itemBadge}>{item.quantity}</span>
                                    </div>
                                    <div className={styles.itemInfo}>
                                        <div className={styles.itemName}>{item.product.name}</div>
                                        <div className={styles.itemPrice}>
                                            ${((parseInt(item.product.prices?.price || '0') / Math.pow(10, item.product.prices?.currency_minor_unit || 2)) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Coupon */}
                        <div className={styles.couponSection}>
                            <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                                <div className={styles.couponInputWrapper}>
                                    <Tag size={16} className={styles.couponIcon} />
                                    <input
                                        type="text"
                                        placeholder="Discount code or gift card"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className={styles.couponInput}
                                    />
                                </div>
                                <button type="submit" disabled={couponLoading || !couponCode.trim()} className={styles.couponBtn}>
                                    {couponLoading ? <Loader2 size={16} className={styles.spinIcon} /> : 'Apply'}
                                </button>
                            </form>
                            {couponMsg && (
                                <div className={couponMsg.type === 'error' ? styles.couponError : styles.couponSuccess}>
                                    {couponMsg.text}
                                </div>
                            )}
                            {appliedCoupons.length > 0 && (
                                <div className={styles.appliedCoupons}>
                                    {appliedCoupons.map((c: any) => (
                                        <div key={c.code || Math.random().toString()} className={styles.appliedCouponTag}>
                                            <Tag size={12} />
                                            <span>{(c.code || 'COUPON').toUpperCase()}</span>
                                            {discount === 0 && (
                                                <span style={{ fontSize: '0.7rem', opacity: 0.65, marginLeft: 2 }}>(free shipping)</span>
                                            )}
                                            <button type="button" onClick={() => handleRemoveCoupon(c.code || '')} className={styles.removeCouponBtn}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={freeShippingRemaining > 0 ? styles.freeShippingNotice : styles.freeShippingUnlocked}>
                            <Truck size={16} />
                            <span>
                                {freeShippingRemaining > 0
                                    ? `Add $${freeShippingRemaining.toFixed(2)} more to qualify for free shipping.`
                                    : 'Free shipping unlocked for this order.'}
                            </span>
                        </div>

                        {/* Totals */}
                        <div className={styles.summaryTotals}>
                            <div className={styles.totalRow}>
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className={styles.totalRow}>
                                <span>Shipment</span>
                                <span>{shipping === 0 ? <span style={{ color: '#388e3c' }}>Free</span> : `$${shipping.toFixed(2)}`}</span>
                            </div>
                            <div className={styles.totalRow}>
                                <span>Tax</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className={styles.totalRow} style={{ color: '#d32f2f' }}>
                                    <span>Discount</span>
                                    <span>-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className={styles.totalRowBold}>
                                <span>TOTAL</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Privacy note */}
                        <p className={styles.privacyNote}>
                            Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{' '}
                            <a href="/info/privacy-policy-2" className={styles.privacyLink}>privacy policy</a>.
                        </p>

                        {/* Terms & Conditions */}
                        <label className={styles.termsRow}>
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={e => setAgreedToTerms(e.target.checked)}
                                className={styles.checkboxInput}
                            />
                            <span>
                                I have read and agree to the website{' '}
                                <a href="/info/terms-of-service" className={styles.privacyLink}>terms and conditions</a> *
                            </span>
                        </label>

                        {/* Payment Selection UI */}
                        <div className={styles.paymentSection}>
                            <div className={styles.sectionTitle} style={{ borderBottom: 'none', marginBottom: '1rem', border: 'none', padding: 0 }}>Payment Method</div>
                            
                            {gatewaysLoading ? (
                                <div className={styles.gatewayLoader}>
                                    <Loader2 size={16} className={styles.spinIcon} />
                                    <span>Fetching secure methods...</span>
                                </div>
                            ) : (
                                <div className={styles.paymentMethods}>
                                    {gateways.map((gw) => (
                                        <div key={gw.id}>
                                            <div
                                                className={`${styles.paymentRadio} ${selectedGateway === (gw.id === 'ppcp-gateway' ? 'paypal' : gw.id) ? styles.activeRadio : ''}`}
                                                onClick={() => setSelectedGateway(gw.id === 'ppcp-gateway' ? 'paypal' : gw.id)}
                                            >
                                                <div className={styles.radioLeft}>
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        checked={selectedGateway === (gw.id === 'ppcp-gateway' ? 'paypal' : gw.id)}
                                                        onChange={() => setSelectedGateway(gw.id === 'ppcp-gateway' ? 'paypal' : gw.id)}
                                                    />
                                                    <div>
                                                        <div className={styles.gatewayTitle}>{gw.title}</div>
                                                        <div className={styles.gatewayDesc}>{gw.description}</div>
                                                    </div>
                                                </div>
                                                {gw.id === 'ppcp-gateway' && (
                                                <Image 
                                                    src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" 
                                                    alt="PayPal" 
                                                    width={70} 
                                                    height={18} 
                                                    style={{ objectFit: 'contain', opacity: 0.9 }} 
                                                />
                                            )}
                                            </div>

                                            {/* PayPal Button Container (Always in DOM) */}
                                            {gw.id === 'ppcp-gateway' && (
                                                <div
                                                    ref={paypalContainerRef}
                                                    id="paypal-button-container"
                                                    style={{ display: selectedGateway === 'paypal' && !isProcessing ? 'block' : 'none', marginTop: '1rem' }}
                                                />
                                            )}
                                        </div>
                                    ))}

                                    {/* Debit & Credit Cards Option */}
                                    <div
                                        className={`${styles.paymentRadio} ${selectedGateway === 'paypal-credit' ? styles.activeRadio : ''}`}
                                        onClick={() => setSelectedGateway('paypal-credit')}
                                        style={{ marginTop: '0.7rem' }}
                                    >
                                        <div className={styles.radioLeft}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                checked={selectedGateway === 'paypal-credit'}
                                                onChange={() => setSelectedGateway('paypal-credit')}
                                            />
                                            <div>
                                                <div className={styles.gatewayTitle}>Debit & Credit Cards</div>
                                                <div className={styles.gatewayDesc}>Pay securely with your card via PayPal.</div>
                                            </div>
                                        </div>
                                        <div className={styles.cardIcons}>
                                            <span className={styles.cardIcon}>VISA</span>
                                            <span className={styles.cardIcon}>MC</span>
                                            <span className={styles.cardIcon}>AMEX</span>
                                            <span className={styles.cardIcon}>DISC</span>
                                        </div>
                                    </div>

                                {/* Card form — CSS show/hide only; never unmount after first render so iframes stay alive */}
                                <div
                                    className={styles.cardForm}
                                    aria-invalid={cardFormTouched && !cardFormValid}
                                    style={{ display: selectedGateway === 'paypal-credit' && !isProcessing ? 'block' : 'none' }}
                                >
                                    {!cardFieldsFailed && (
                                        <>
                                            <div className={styles.formGroup}>
                                                <label style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.35rem', display: 'block' }}>Name on Card</label>
                                                <div
                                                    id="cf-card-name"
                                                    className={styles.cardFieldContainer}
                                                    onClick={() => cardFieldRefs.current.name?.focus?.()}
                                                />
                                            </div>
                                            <div className={styles.formGroup} style={{ marginTop: '0.75rem' }}>
                                                <label style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.35rem', display: 'block' }}>Card Number *</label>
                                                <div
                                                    id="cf-card-number"
                                                    className={styles.cardFieldContainer}
                                                    onClick={() => cardFieldRefs.current.number?.focus?.()}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.35rem', display: 'block' }}>Expiry (MM/YY) *</label>
                                                    <div
                                                        id="cf-card-expiry"
                                                        className={styles.cardFieldContainer}
                                                        onClick={() => cardFieldRefs.current.expiry?.focus?.()}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.35rem', display: 'block' }}>CVV *</label>
                                                    <div
                                                        id="cf-card-cvv"
                                                        className={styles.cardFieldContainer}
                                                        onClick={() => cardFieldRefs.current.cvv?.focus?.()}
                                                    />
                                                </div>
                                            </div>
                                            {cardError && (
                                                <div className={styles.cardError}>{cardError}</div>
                                            )}
                                            {!cardFieldsReady && (
                                                <div className={styles.gatewayLoader} style={{ margin: '0.75rem 0' }}>
                                                    <Loader2 size={14} className={styles.spinIcon} />
                                                    <span style={{ fontSize: '0.82rem' }}>Loading secure card form...</span>
                                                </div>
                                            )}
                                            {cardFieldsReady && (
                                                <button
                                                    type="button"
                                                    onClick={handleCardSubmit}
                                                    disabled={isProcessing}
                                                    className={styles.placeOrderBtn}
                                                    style={{ marginTop: '1rem' }}
                                                >
                                                    {isProcessing
                                                        ? <><Loader2 size={16} className={styles.spinIcon} style={{ marginRight: '0.5rem' }} />Processing...</>
                                                        : 'PLACE ORDER'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {/* Fallback: FUNDING.CARD popup button when hosted fields not supported */}
                                    <div ref={cardContainerRef} id="paypal-card-container" style={{ display: cardFieldsFailed ? 'block' : 'none' }} />
                                </div>
                                </div>
              )}

                            {isProcessing && (
                                <div className={styles.gatewayLoader} style={{ marginTop: '1rem' }}>
                                    <Loader2 size={20} className={styles.spinIcon} />
                                    Processing your order...
                                </div>
                            )}
                        </div>

                        <div className={styles.trustSignals}>
                            <div><ShieldCheck size={16} /> 100% Secure Transaction</div>
                            <div><Truck size={16} /> Free shipping over $59.99</div>
                            <div><RotateCcw size={16} /> 30-day return policy</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
