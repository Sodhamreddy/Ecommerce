"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Lock } from 'lucide-react';
import styles from './Checkout.module.css';

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        paymentMethod: 'credit_card'
    });

    const subtotal = cart.reduce((sum, item) => sum + (parseInt(item.product.prices.price) / Math.pow(10, item.product.prices.currency_minor_unit || 2)) * item.quantity, 0);
    const shipping = subtotal > 59 ? 0 : 15;
    const total = subtotal + shipping;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        setIsProcessing(true);

        try {
            // Simulate Payment Gateway delay
            await new Promise(resolve => setTimeout(resolve, 2500));

            // In a real production app, this would securely POST to Stripe and then to the WooCommerce REST API to generate the final order ID.
            const simulatedOrderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

            clearCart();
            // Redirect to a success page with the simulated ID
            router.push(`/order-success?id=${simulatedOrderId}`);

        } catch (error) {
            alert("Payment failed. Please try again.");
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

    return (
        <div className={styles.container}>
            <div className={styles.checkoutHeader}>
                <h1>Secure Checkout</h1>
                <p><Lock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> Encrypted via 256-bit SSL</p>
            </div>

            <form onSubmit={handleCheckout} className={styles.checkoutGrid}>

                {/* Billing / Shipping Form */}
                <div className={styles.leftCol}>
                    <div className={styles.sectionBlock}>
                        <h2 className={styles.sectionTitle}>1. Contact Information</h2>
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
                        <h2 className={styles.sectionTitle}>2. Shipping Address</h2>
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
                            <label>Street Address *</label>
                            <input required type="text" name="address" value={formData.address} onChange={handleChange} placeholder="123 Luxury Ave" />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>City *</label>
                                <input required type="text" name="city" value={formData.city} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup} style={{ flex: '0 0 100px' }}>
                                <label>State *</label>
                                <input required type="text" name="state" value={formData.state} onChange={handleChange} placeholder="NY" />
                            </div>
                            <div className={styles.formGroup} style={{ flex: '0 0 150px' }}>
                                <label>ZIP Code *</label>
                                <input required type="text" name="zip" value={formData.zip} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <h2 className={styles.sectionTitle}>3. Payment Method</h2>
                        <div className={styles.paymentMethods}>
                            <label className={`${styles.paymentRadio} ${formData.paymentMethod === 'credit_card' ? styles.activeRadio : ''}`}>
                                <input type="radio" name="paymentMethod" value="credit_card" checked={formData.paymentMethod === 'credit_card'} onChange={handleChange} />
                                Credit Card
                                <div className={styles.cardIcons}>
                                    💳 Visa/MC/Amex
                                </div>
                            </label>
                            <label className={`${styles.paymentRadio} ${formData.paymentMethod === 'paypal' ? styles.activeRadio : ''}`}>
                                <input type="radio" name="paymentMethod" value="paypal" checked={formData.paymentMethod === 'paypal'} onChange={handleChange} />
                                PayPal
                            </label>
                        </div>

                        {formData.paymentMethod === 'credit_card' && (
                            <div className={styles.creditCardBox}>
                                <div className={styles.formGroup}>
                                    <label>Card Number</label>
                                    <input required type="text" placeholder="0000 0000 0000 0000" maxLength={19} />
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Expiry Date</label>
                                        <input required type="text" placeholder="MM/YY" maxLength={5} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>CVC / Security Code</label>
                                        <input required type="text" placeholder="123" maxLength={4} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Summary Sidebar */}
                <div className={styles.rightCol}>
                    <div className={styles.summaryBlock}>
                        <h2 className={styles.summaryTitle}>Order Summary</h2>

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

                        <div className={styles.summaryTotals}>
                            <div className={styles.totalRow}>
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className={styles.totalRow}>
                                <span>Shipping</span>
                                <span>{shipping === 0 ? <span style={{ color: '#388e3c' }}>Free</span> : `$${shipping.toFixed(2)}`}</span>
                            </div>
                            <div className={styles.totalRow} style={{ borderBottom: 'none', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.payBtn}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing Payment...' : `Complete Order • $${total.toFixed(2)}`}
                        </button>

                        <div className={styles.trustSignals}>
                            <div><ShieldCheck size={18} /> 100% Secure Transaction</div>
                            <div>Return policy: 14 days full refund</div>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}
