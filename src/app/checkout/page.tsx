"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCart, CartContextType, CartItem } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Lock, Loader2, Truck, RotateCcw, Tag } from 'lucide-react';
import styles from './Checkout.module.css';

// Dynamic PayPal Client ID fetched from API
let PAYPAL_CLIENT_ID = ''; 

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
    const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
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
    const [cardFieldsReady, setCardFieldsReady] = useState(false);

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
    const getVal = (str?: string) => {
        if (!str) return 0;
        const normalized = str.replace(/[^0-9.]/g, '');
        const val = parseFloat(normalized || '0');
        // If the string already contains a decimal point, assume it's NOT in minor units
        if (normalized.includes('.')) return val * factor;
        return val;
    };
    const minorUnit = wcCart?.totals?.currency_minor_unit || 2;
    const factor = Math.pow(10, minorUnit);
    
    // Use backend totals when item counts match, OR when a coupon is applied (WC owns the authoritative discount total)
    const wcSubtotal = wcCart ? getVal(wcCart.totals.total_items) / factor : 0;
    const itemCountMatch = wcCart?.items?.length === cart.length;
    const hasCoupon = (wcCart?.coupons?.length ?? 0) > 0;
    const wcSynced = wcSubtotal > 0 && (itemCountMatch || hasCoupon);
    
    const subtotal = wcSynced ? wcSubtotal : cartTotal;
    const wcShipping = wcSynced ? getVal(wcCart!.totals.total_shipping) / factor : 0;
    const localShipping = subtotal > 59.99 ? 0 : 5.99;
    const shipping = wcSynced ? wcShipping : localShipping;
    const tax = wcSynced ? getVal(wcCart!.totals.total_tax) / factor : 0;
    const discount = wcCart?.totals?.total_discount ? getVal(wcCart.totals.total_discount) / factor : 0;
    const total = wcSynced ? getVal(wcCart!.totals.total_price) / factor : (subtotal + shipping - discount);
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

    // Render PayPal & Card Buttons
    useEffect(() => {
        if (!paypalLoaded) return;
        
        const paypal = (window as any).paypal;
        if (!paypal?.Buttons) return;

        // Cleanup existing buttons if any to ensure fresh start
        if (paypalBtnsRef.current) { 
            try { paypalBtnsRef.current.close(); } catch(e) {} 
            paypalBtnsRef.current = null; 
        }
        if (cardBtnsRef.current) { 
            try { cardBtnsRef.current.close(); } catch(e) {} 
            cardBtnsRef.current = null; 
        }

        // Explicitly clear field containers to prevent duplicate injections
        const containers = [
            'card-name-field-container',
            'card-number-field-container',
            'card-expiry-field-container',
            'card-cvv-field-container'
        ];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });

        const startProcessing = () => {
            setIsProcessing(true);
            // Safety timeout: if still processing after 45s, reset it
            const timer = setTimeout(() => {
                setIsProcessing(false);
                setError('Payment is taking longer than expected. Please check your connection or try a different method.');
            }, 45000);
            setProcessingTimeout(timer);
        };

        const stopProcessing = () => {
            setIsProcessing(false);
            if (processingTimeout) {
                clearTimeout(processingTimeout);
                setProcessingTimeout(null);
            }
        };

        // Common config factory
        const getConfig = (type: 'paypal' | 'card') => ({ 
            fundingSource: type === 'paypal' ? paypal.FUNDING.PAYPAL : paypal.FUNDING.CARD,
            style: { 
                layout: 'vertical', 
                color: type === 'paypal' ? 'gold' : 'black', 
                shape: 'rect', 
                label: 'checkout',
                height: 48 
            }, 
            onClick: (data: any, actions: any) => {
                // Validate before opening the PayPal/Card popup
                if (validateForm()) {
                    return actions.resolve();
                } else {
                    return actions.reject();
                }
            },
            createOrder: async (data: any, actions: any) => {
                setError(null);
                
                if (!validateForm()) {
                    return actions.reject();
                }

                startProcessing();
                try {
                    return actions.order.create({
                        purchase_units: [{
                            description: 'Jersey Perfume Order',
                            amount: {
                                currency_code: 'USD',
                                value: totalRef.current.toFixed(2),
                                breakdown: {
                                    item_total: { currency_code: 'USD', value: subtotalRef.current.toFixed(2) },
                                    shipping: { currency_code: 'USD', value: shippingRef.current.toFixed(2) },
                                    tax_total: { currency_code: 'USD', value: taxRef.current.toFixed(2) },
                                    discount: { currency_code: 'USD', value: discountRef.current.toFixed(2) }
                                }
                            }
                        }]
                    });
                } catch (err: any) {
                    stopProcessing();
                    setError(err.message || 'Payment initialization failed.');
                    return Promise.reject(err);
                }
            },
            onApprove: async (data: any, actions: any) => {
                try {
                    // Capture the PayPal payment before creating the WC order
                    const captureResult = await actions.order.capture();
                    const transactionId = captureResult?.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';

                    const res = await fetch('/api/paypal/complete-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paypalOrderId: data.orderID,
                            paypalTransactionId: transactionId,
                            cartItems: cartRef.current,
                            formData: formRef.current,
                            createAccount: createAccountRef.current,
                            accountPassword: accountPasswordRef.current
                        })
                    });
                    const result = await res.json();
                    if (result.orderId) {
                        clearCart();
                        router.push(`/order-success?id=${result.orderId}`);
                    } else {
                        throw new Error(result.error || 'Order creation failed. Please contact info@jerseyperfume.com.');
                    }
                } catch (err: any) {
                    console.error('Order completion error:', err);
                    stopProcessing();
                    setError(err.message || 'Payment captured but order could not be placed. Please contact info@jerseyperfume.com.');
                }
            },
            onCancel: () => { stopProcessing(); },
            onError: (err: any) => {
                console.error('PayPal Interface Error:', err);
                stopProcessing();
                // If there's already a specific validation error (like terms), don't overwrite it
                setError(prev => {
                    if (prev && (prev.includes('terms') || prev.includes('required') || prev.includes('highlighted'))) return prev;
                    return 'Payment error. Please check your credit card details and try again.';
                });
            }
        });

        // 1. PayPal Button
        if (paypalContainerRef.current) {
            paypalBtnsRef.current = paypal.Buttons(getConfig('paypal'));
            paypalBtnsRef.current.render(paypalContainerRef.current).catch(() => {});
        }

        // 2. Card Button — opens PayPal's hosted card payment page (no special account permission needed)
        if (cardContainerRef.current) {
            cardBtnsRef.current = paypal.Buttons(getConfig('card'));
            cardBtnsRef.current.render(cardContainerRef.current).catch(() => {});
        }
        
        return () => {
            if (paypalBtnsRef.current) { try { paypalBtnsRef.current.close(); } catch(e) {} }
            if (cardBtnsRef.current) { try { cardBtnsRef.current.close(); } catch(e) {} }
        };
    }, [paypalLoaded, selectedGateway, fetchedClientId]);





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

    if (!cartInitialized) {
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
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email for order tracking" className={fieldErrors.email ? styles.errorInput : ''} />
                                {fieldErrors.email && <span className={styles.errorText}>{fieldErrors.email}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone Number *</label>
                                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Mobile number" className={fieldErrors.phone ? styles.errorInput : ''} />
                                {fieldErrors.phone && <span className={styles.errorText}>{fieldErrors.phone}</span>}
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <h2 className={styles.sectionTitle}>Billing / Shipping Address</h2>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>First Name *</label>
                                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={fieldErrors.firstName ? styles.errorInput : ''} />
                                {fieldErrors.firstName && <span className={styles.errorText}>{fieldErrors.firstName}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Last Name *</label>
                                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={fieldErrors.lastName ? styles.errorInput : ''} />
                                {fieldErrors.lastName && <span className={styles.errorText}>{fieldErrors.lastName}</span>}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Company Name (optional)</label>
                            <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Company (optional)" />
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
                            <input required type="text" name="address" value={formData.address} onChange={handleChange} placeholder="House number and street name" className={fieldErrors.address ? styles.errorInput : ''} />
                            {fieldErrors.address && <span className={styles.errorText}>{fieldErrors.address}</span>}
                        </div>
                        <div className={styles.formGroup}>
                            <input type="text" name="address2" value={formData.address2} onChange={handleChange} placeholder="Apartment, suite, unit, etc. (optional)" />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Town / City *</label>
                                <input required type="text" name="city" value={formData.city} onChange={handleChange} className={fieldErrors.city ? styles.errorInput : ''} />
                                {fieldErrors.city && <span className={styles.errorText}>{fieldErrors.city}</span>}
                            </div>
                            <div className={styles.formGroup} style={{ flex: '0 0 120px' }}>
                                <label>State *</label>
                                <input required type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" className={fieldErrors.state ? styles.errorInput : ''} />
                                {fieldErrors.state && <span className={styles.errorText}>{fieldErrors.state}</span>}
                            </div>
                            <div className={styles.formGroup} style={{ flex: '0 0 140px' }}>
                                <label>ZIP Code *</label>
                                <input required type="text" name="zip" value={formData.zip} onChange={handleChange} className={fieldErrors.zip ? styles.errorInput : ''} />
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
                            {cart.map((item: CartItem) => (
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
                                            ${((parseInt(item.product.prices.price) / Math.pow(10, item.product.prices.currency_minor_unit || 2)) * item.quantity).toFixed(2)}
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
                                        <div key={c.code} className={styles.appliedCouponTag}>
                                            <Tag size={12} />
                                            <span>{c.code.toUpperCase()}</span>
                                            {discount === 0 && (
                                                <span style={{ fontSize: '0.7rem', opacity: 0.65, marginLeft: 2 }}>(free shipping)</span>
                                            )}
                                            <button type="button" onClick={() => handleRemoveCoupon(c.code)} className={styles.removeCouponBtn}>✕</button>
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
                                    {/* PayPal Option */}
                                    <label className={`${styles.paymentRadio} ${selectedGateway === 'paypal' ? styles.activeRadio : ''}`}>
                                        <div className={styles.radioLeft}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                checked={selectedGateway === 'paypal'}
                                                onChange={() => setSelectedGateway('paypal')}
                                            />
                                            <div>
                                                <div className={styles.gatewayTitle}>PayPal</div>
                                                <div className={styles.gatewayDesc}>Pay via PayPal.</div>
                                            </div>
                                        </div>
                                    </label>

                                    {/* Credit Card Option — specifically handled for ppcp-gateway */}
                                    <label className={`${styles.paymentRadio} ${selectedGateway === 'paypal-credit' ? styles.activeRadio : ''}`}>
                                        <div className={styles.radioLeft}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                checked={selectedGateway === 'paypal-credit'}
                                                onChange={() => setSelectedGateway('paypal-credit')}
                                            />
                                            <div>
                                                <div className={styles.gatewayTitle}>Debit & Credit Cards</div>
                                                <div className={styles.gatewayDesc}>Encrypted & secure.</div>
                                            </div>
                                        </div>
                                        <div className={styles.cardIcons}>
                                            <span className={styles.cardIcon}>VISA</span>
                                            <span className={styles.cardIcon} style={{ background: '#eb001b', color: '#fff', border: 'none' }}>MC</span>
                                            <span className={styles.cardIcon} style={{ background: '#0070d1', color: '#fff', border: 'none' }}>AMEX</span>
                                            <span className={styles.cardIcon} style={{ background: '#f68121', color: '#fff', border: 'none' }}>DISC</span>
                                        </div>
                                    </label>

                                    {selectedGateway === 'paypal-credit' && (
                                        <p style={{ fontSize: '0.82rem', color: '#555', margin: '0.5rem 0 0', padding: '0 0.25rem' }}>
                                            Click the button below to enter your card details securely on PayPal&apos;s encrypted page. No PayPal account required.
                                        </p>
                                    )}
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
                                
                                {/* PayPal Button Container */}
                                <div
                                    ref={paypalContainerRef}
                                    id="paypal-button-container"
                                    style={{ display: (isProcessing || selectedGateway !== 'paypal') ? 'none' : 'block' }}
                                />

                                {/* Card Button Container */}
                                <div
                                    ref={cardContainerRef}
                                    id="paypal-card-container"
                                    style={{ display: (isProcessing || selectedGateway !== 'paypal-credit') ? 'none' : 'block' }}
                                />
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
