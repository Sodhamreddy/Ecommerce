"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCart, CartContextType, CartItem } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Lock, Loader2, Truck, RotateCcw, Tag } from 'lucide-react';
import styles from './Checkout.module.css';

// Dynamic PayPal Client ID fetched from API is now handled via state

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
    });
    const [createAccount, setCreateAccount] = useState(false);
    const [accountPassword, setAccountPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // UI state
    const [isProcessing, setIsProcessing] = useState(false);
    const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [couponCode, setCouponCode] = useState('');
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
    const [mounted, setMounted] = useState(false);

    // Refs for stable closures in PayPal callbacks
    const paypalContainerRef = useRef<HTMLDivElement>(null);
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const paypalBtnsRef = useRef<any>(null);
    const cardBtnsRef = useRef<any>(null);
    const cardFieldsRef = useRef<any>(null);
    const cardFieldsInstanceRef = useRef<any>(null);
    const formRef = useRef(formData);
    const agreedRef = useRef(agreedToTerms);
    const cartRef = useRef(cart);
    const createAccountRef = useRef(createAccount);
    const accountPasswordRef = useRef(accountPassword);
    const totalRef = useRef(0);
    const subtotalRef = useRef(0);
    const shippingRef = useRef(0);
    const taxRef = useRef(0);
    const discountRef = useRef(0);

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
    
    // Use backend totals when item counts match, OR when a coupon is applied (WC owns the authoritative discount total)
    const wcSubtotal = wcCart?.totals?.total_items ? getVal(wcCart.totals.total_items) / factor : 0;
    const itemCountMatch = wcCart?.items?.length === cart.length;
    const hasCoupon = (wcCart?.coupons?.length ?? 0) > 0;
    // Use WC totals if we have a coupon (WC owns the logic) OR if item counts match perfectly.
    // This prevents showing local totals when WC has authoritative discount/tax data.
    const wcSynced = wcSubtotal > 0 && (itemCountMatch || hasCoupon);

    const subtotal = wcSynced ? wcSubtotal : cartTotal;
    const wcShipping = wcSynced && wcCart?.totals?.total_shipping ? getVal(wcCart.totals.total_shipping) / factor : 0;
    const localShipping = subtotal > 59.99 ? 0 : 5.99;
    const shipping = wcSynced ? wcShipping : localShipping;
    const tax = wcSynced && wcCart?.totals?.total_tax ? getVal(wcCart.totals.total_tax) / factor : 0;
    const discount = wcCart?.totals?.total_discount ? getVal(wcCart.totals.total_discount) / factor : 0;
    const total = wcSynced && wcCart?.totals?.total_price ? getVal(wcCart.totals.total_price) / factor : (subtotal + shipping - discount);
    const appliedCoupons = wcCart?.coupons || [];
    totalRef.current = total;
    subtotalRef.current = subtotal;
    shippingRef.current = shipping;
    taxRef.current = tax;
    discountRef.current = discount;

    // Keep refs in sync with state
    useEffect(() => { formRef.current = formData; }, [formData]);
    useEffect(() => { agreedRef.current = agreedToTerms; }, [agreedToTerms]);
    useEffect(() => { cartRef.current = cart; }, [cart]);
    useEffect(() => { createAccountRef.current = createAccount; }, [createAccount]);
    useEffect(() => { accountPasswordRef.current = accountPassword; }, [accountPassword]);

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
                const res = await fetch('/api/wc/payment-gateways');
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

    // Load PayPal SDK Script
    useEffect(() => {
        if (!fetchedClientId || paypalLoaded) return;
        const s = document.createElement('script');
        s.src = `https://www.paypal.com/sdk/js?client-id=${fetchedClientId}&components=buttons,funding-eligibility`;
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
    }, [fetchedClientId]);

    // Render PayPal & Card Buttons — runs once when SDK loads, never on gateway tab switch.
    // Switching tabs only toggles CSS visibility; tearing down PayPal iframes causes the
    // "No ack for postMessage" timeout error.
    useEffect(() => {
        if (!paypalLoaded) return;

        const paypal = (window as any).paypal;
        if (!paypal) return;

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

        const makeConfig = (fundingSource?: any) => ({
            fundingSource,
            style: {
                layout: 'vertical',
                color: fundingSource === paypal.FUNDING.PAYPAL ? 'gold' : 'black',
                shape: 'rect',
                label: 'checkout',
                height: 50
            },
            onClick: (data: any, actions: any) => {
                if (!validateForm()) {
                    return actions.reject();
                }
                return actions.resolve();
            },
            createOrder: async () => {
                try {
                    startProcessing();
                    const res = await fetch('/api/paypal/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: totalRef.current.toFixed(2) }),
                    });
                    const data = await res.json();
                    if (data.id) return data.id;
                    throw new Error(data.error || 'Failed to create PayPal order');
                } catch (err: any) {
                    console.error('PayPal Order Creation Error:', err);
                    stopProcessing();
                    setError(err.message || 'Payment system unavailable. Please try again.');
                    throw err;
                }
            },
            onApprove: async (data: any, actions: any) => {
                try {
                    const capture = await actions.order.capture();
                    const transactionId = capture.id;

                    const res = await fetch('/api/paypal/complete-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paypalOrderId: data.orderID,
                            paypalTransactionId: transactionId,
                            formData: formRef.current,
                            cartItems: cartRef.current,
                            createAccount: createAccountRef.current,
                            accountPassword: accountPasswordRef.current,
                        }),
                    });

                    const result = await res.json();
                    stopProcessing();

                    if (result.success) {
                        clearCart();
                        router.push(`/order-confirmation?id=${result.orderId}&key=${result.orderKey}`);
                    } else {
                        throw new Error(result.error || 'Failed to complete order');
                    }
                } catch (err: any) {
                    console.error('Order completion error:', err);
                    stopProcessing();
                    setError(err.message || 'Payment captured but order could not be placed. Please contact info@jerseyperfume.com.');
                }
            },
            onCancel: () => { stopProcessing(); },
            onError: (err: any) => {
                console.error('PayPal Error:', err);
                stopProcessing();
                setError(prev => {
                    if (prev && (prev.includes('terms') || prev.includes('required') || prev.includes('highlighted'))) return prev;
                    return 'Payment error. Please check your card details and try again.';
                });
            }
        });

        // PayPal Yellow Button
        if (paypalContainerRef.current && !paypalBtnsRef.current) {
            try {
                const btns = paypal.Buttons(makeConfig(paypal.FUNDING.PAYPAL));
                if (btns.isEligible()) {
                    paypalBtnsRef.current = btns;
                    btns.render(paypalContainerRef.current).catch((err: any) => {
                        console.error('[PayPal] Yellow Button Render Error:', err);
                    });
                }
            } catch (err) {
                console.error('[PayPal] Yellow Button Init Error:', err);
            }
        }

        // Standard Black Card Button
        const cardBtnContainer = document.getElementById('paypal-card-container');
        if (cardBtnContainer && cardBtnContainer.children.length === 0) {
            try {
                const cardBtn = paypal.Buttons(makeConfig(paypal.FUNDING.CARD));
                if (cardBtn.isEligible()) {
                    cardBtn.render('#paypal-card-container').catch((err: any) => {
                        console.error('[PayPal] Black Button Render Error:', err);
                    });
                }
            } catch (err) {
                console.error('[PayPal] Black Button Init Error:', err);
            }
        }

        return () => {
            if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
            if (paypalBtnsRef.current) { 
                try { 
                    paypalBtnsRef.current.close(); 
                    paypalBtnsRef.current = null;
                } catch (_) {} 
            }
        };
    }, [paypalLoaded, mounted]);


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
                            {tax > 0 && (
                                <div className={styles.totalRow}>
                                    <span>Tax</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                            )}
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

                                <div className={styles.cardForm} style={{ display: selectedGateway === 'paypal-credit' ? 'block' : 'none', marginTop: '1rem' }}>
                                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                        <p className={styles.gatewayDesc} style={{ marginBottom: '1.5rem' }}>
                                            Pay securely with your Debit or Credit card via PayPal. No account required.
                                        </p>
                                        <div id="paypal-card-container" />
                                    </div>
                                </div>
                                </div>
              )}

                            <div style={{ marginTop: '1.5rem' }}>
                                {isProcessing ? (
                                    <div className={styles.gatewayLoader}>
                                        <Loader2 size={20} className={styles.spinIcon} />
                                        Processing your order...
                                    </div>
                                ) : !paypalLoaded ? (
                                    <div className={styles.gatewayLoader}>
                                        <Loader2 size={18} className={styles.spinIcon} />
                                        Finalizing...
                                    </div>
                                ) : null}

                            </div>
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
