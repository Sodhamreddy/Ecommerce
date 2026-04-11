"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Lock, Loader2, Truck, RotateCcw, Tag } from 'lucide-react';
import { submitCheckout, getPaymentGateways, PaymentGateway, CheckoutData } from '@/lib/woocommerce';
import styles from './Checkout.module.css';

export default function CheckoutPage() {
    const { cart, clearCart, cartTotal, wcCart, applyCouponToCart, removeCouponFromCart, updateCustomerAddress } = useCart();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponMsg, setCouponMsg] = useState<{text: string, type: 'error' | 'success'} | null>(null);
    const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
    const [loadingGateways, setLoadingGateways] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        orderNotes: '',
        paymentMethod: '',
    });
    const [createAccount, setCreateAccount] = useState(false);
    const [accountPassword, setAccountPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Auto-fill form from logged-in user account data
    useEffect(() => {
        const savedUser = localStorage.getItem('jp_user');
        if (!savedUser) return;
        try {
            const user = JSON.parse(savedUser);
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
        } catch {}
    }, []);

    // Fetch available payment gateways from WooCommerce
    useEffect(() => {
        const loadGateways = async () => {
            setLoadingGateways(true);
            try {
                const gateways = await getPaymentGateways();
                setPaymentGateways(gateways);
                if (gateways.length > 0) {
                    setFormData(prev => ({ ...prev, paymentMethod: gateways[0].id }));
                }
            } catch (e) {
                console.error('Failed to load payment gateways:', e);
                setPaymentGateways([
                    { id: 'paypal', title: 'PayPal', description: 'Pay via PayPal.', order: 1 }
                ]);
                setFormData(prev => ({ ...prev, paymentMethod: 'paypal' }));
            } finally {
                setLoadingGateways(false);
            }
        };
        loadGateways();
    }, []);

    // Recalculate tax/shipping when address changes (debounced 800ms)
    useEffect(() => {
        const { country, state, zip, city } = formData;
        if (!country) return;
        const timer = setTimeout(() => {
            if (zip.length >= 5 || state) {
                updateCustomerAddress({ country, state, postcode: zip, city });
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [formData.country, formData.state, formData.zip, formData.city]);

    // Calculate totals — prefer wcCart when synced (non-zero)
    const getVal = (str?: string) => parseInt(str || '0', 10);
    const minorUnit = wcCart?.totals?.currency_minor_unit || 2;
    const factor = Math.pow(10, minorUnit);
    const wcSubtotal = wcCart ? getVal(wcCart.totals.total_items) / factor : 0;
    const wcSynced = wcSubtotal > 0;

    const subtotal = wcSynced ? wcSubtotal : cartTotal;
    const wcShipping = wcSynced ? getVal(wcCart!.totals.total_shipping) / factor : 0;
    const localShipping = subtotal > 59.99 ? 0 : 5.99;
    const shipping = wcSynced ? wcShipping : localShipping;
    const tax = wcSynced ? getVal(wcCart!.totals.total_tax) / factor : 0;
    const discount = wcSynced && wcCart!.totals.total_discount ? getVal(wcCart!.totals.total_discount) / factor : 0;
    const total = wcSynced ? getVal(wcCart!.totals.total_price) / factor : (subtotal + shipping - discount);

    const appliedCoupons = wcCart?.coupons || [];

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
            setCouponMsg({ text: 'Failed to remove.', type: 'error' });
        }
        setCouponLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        setError(null);

        if (cart.length === 0) { setError("Your cart is empty!"); return; }
        if (!agreedToTerms) { setError("Please agree to the website terms and conditions to proceed."); return; }

        setIsProcessing(true);

        try {
            // Basic field validation
            const requiredFields: Record<string, string> = {
                email: 'Email',
                phone: 'Phone',
                firstName: 'First Name',
                lastName: 'Last Name',
                address: 'Address',
                city: 'City',
                state: 'State',
                zip: 'ZIP Code',
                paymentMethod: 'Payment Method'
            };

            for (const [key, label] of Object.entries(requiredFields)) {
                if (!formData[key as keyof typeof formData]) {
                    setError(`${label} is required.`);
                    setIsProcessing(false);
                    return;
                }
            }

            const checkoutData: CheckoutData = {
                billing_address: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    company: formData.company || "",
                    address_1: formData.address,
                    address_2: formData.address2,
                    city: formData.city,
                    state: formData.state,
                    postcode: formData.zip,
                    country: formData.country,
                    email: formData.email,
                    phone: formData.phone,
                },
                shipping_address: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    company: "",
                    address_1: formData.address,
                    address_2: formData.address2,
                    city: formData.city,
                    state: formData.state,
                    postcode: formData.zip,
                    country: formData.country,
                    phone: formData.phone,
                },
                payment_method: formData.paymentMethod,
                customer_note: formData.orderNotes,
                create_account: !isLoggedIn && createAccount,
                ...(createAccount && accountPassword ? { payment_data: [{ key: 'account_password', value: accountPassword }] } : {}),
            };

            const result = await submitCheckout(checkoutData);

            if (result.payment_result?.redirect_url) {
                window.location.href = result.payment_result.redirect_url;
                return;
            }

            clearCart();
            router.push(`/order-success?id=${result.order_id}&key=${result.order_key}`);

        } catch (err: any) {
            console.error('Checkout error:', err);
            // If it's the proxy error object, it might have message or error property
            const errMsg = err.message || err.error || "Payment failed. Please try again.";
            setError(errMsg);
            setIsProcessing(false);
        }
    };

    if (cart.length === 0 && !isProcessing) {
        return (
            <div className={styles.emptyContainer}>
                <h2>Your Cart is Empty</h2>
                <p>Add some luxury fragrances to proceed to checkout.</p>
                <button onClick={() => router.push('/shop')} className={styles.shoppingBtn}>Continue Shopping</button>
            </div>
        );
    }

    const isPayPal = formData.paymentMethod === 'paypal';

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
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email for order tracking" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone Number *</label>
                                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Mobile number" />
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <h2 className={styles.sectionTitle}>Billing / Shipping Address</h2>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>First Name *</label>
                                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Last Name *</label>
                                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
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
                            <input required type="text" name="address" value={formData.address} onChange={handleChange} placeholder="House number and street name" />
                        </div>
                        <div className={styles.formGroup}>
                            <input type="text" name="address2" value={formData.address2} onChange={handleChange} placeholder="Apartment, suite, unit, etc. (optional)" />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Town / City *</label>
                                <input required type="text" name="city" value={formData.city} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup} style={{ flex: '0 0 120px' }}>
                                <label>State *</label>
                                <input required type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" />
                            </div>
                            <div className={styles.formGroup} style={{ flex: '0 0 140px' }}>
                                <label>ZIP Code *</label>
                                <input required type="text" name="zip" value={formData.zip} onChange={handleChange} />
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
                            {cart.map((item) => (
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

                        {/* Payment Methods */}
                        <div className={styles.paymentSection}>
                            {loadingGateways ? (
                                <div className={styles.gatewayLoader}>
                                    <Loader2 size={18} className={styles.spinIcon} />
                                    Loading payment options...
                                </div>
                            ) : (
                                <div className={styles.paymentMethods}>
                                    {paymentGateways.map(gateway => (
                                        <label
                                            key={gateway.id}
                                            className={`${styles.paymentRadio} ${formData.paymentMethod === gateway.id ? styles.activeRadio : ''}`}
                                        >
                                            <div className={styles.radioLeft}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value={gateway.id}
                                                    checked={formData.paymentMethod === gateway.id}
                                                    onChange={handleChange}
                                                />
                                                <div>
                                                    <div className={styles.gatewayTitle}>{gateway.title}</div>
                                                    {gateway.description && (
                                                        <div className={styles.gatewayDesc}>{gateway.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Card icons for Stripe / credit card methods */}
                                            {(gateway.id === 'stripe' || gateway.id === 'woocommerce_payments' || gateway.id === 'wc_stripe' || gateway.id.includes('card') || gateway.id.includes('credit')) && (
                                                <div className={styles.cardIcons}>
                                                    <span className={styles.cardIcon}>VISA</span>
                                                    <span className={styles.cardIcon}>MC</span>
                                                    <span className={styles.cardIcon}>AMEX</span>
                                                    <span className={styles.cardIcon}>DISC</span>
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            )}
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

                        {/* Place Order Button */}
                        <button
                            type="button"
                            onClick={handleCheckout}
                            className={isPayPal ? styles.paypalBtn : styles.payBtn}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={20} className={styles.spinIcon} />
                                    Processing Payment...
                                </>
                            ) : isPayPal ? (
                                <span className={styles.paypalBtnInner}>
                                    Pay with <span className={styles.paypalWordmark}>PayPal</span>
                                </span>
                            ) : (
                                `Place Order • $${total.toFixed(2)}`
                            )}
                        </button>

                        <div className={styles.trustSignals}>
                            <div><ShieldCheck size={16} /> 100% Secure Transaction</div>
                            <div><Truck size={16} /> Free shipping over $59.99</div>
                            <div><RotateCcw size={16} /> 14-day return policy</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
