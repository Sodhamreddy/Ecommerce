"use client";

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft, Loader2 } from 'lucide-react';
import styles from './CartPage.module.css';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal, wcCart, cartInitialized } = useCart();

    // During SSR / hydration, cart hasn't loaded from localStorage yet — show a loader
    // instead of the "empty cart" page so the user doesn't see a false empty state.
    if (!cartInitialized) {
        return (
            <div className={styles.emptyCart} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading your bag...</span>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className={styles.emptyCart}>
                <h1 className={styles.title}>Your Bag is Empty</h1>
                <p>Looking for a new signature scent?</p>
                <Link href="/shop" className={styles.shopBtn}>
                    CONTINUE SHOPPING
                </Link>
            </div>
        );
    }

    // Compute discount from WC cart if a coupon is applied
    const minorUnit = wcCart?.totals?.currency_minor_unit || 2;
    const factor = Math.pow(10, minorUnit);
    const getVal = (str?: string) => {
        if (!str) return 0;
        const n = str.replace(/[^0-9.]/g, '');
        const v = parseFloat(n || '0');
        return n.includes('.') ? v * factor : v;
    };
    const discount = wcCart?.totals?.total_discount ? getVal(wcCart.totals.total_discount) / factor : 0;
    const appliedCoupons = wcCart?.coupons || [];
    const displayTotal = discount > 0 ? Math.max(0, cartTotal - discount) : cartTotal;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Your Shopping Bag</h1>

            <div className={styles.layout}>
                <div className={styles.items}>
                    {cart.filter(item => item.product?.prices?.price).map((item) => {
                        const mu = item.product.prices.currency_minor_unit || 2;
                        const price = parseInt(item.product.prices.price) / Math.pow(10, mu);

                        return (
                            <div key={item.product.id} className={styles.item}>
                                <div className={styles.imageContainer}>
                                    <Image
                                        src={item.product.images[0]?.src || '/placeholder.jpg'}
                                        alt={item.product.name}
                                        width={100}
                                        height={100}
                                        className={styles.image}
                                    />
                                </div>

                                <div className={styles.details}>
                                    <h3 className={styles.name}>{item.product.name}</h3>
                                    <p className={styles.price}>{item.product.prices.currency_symbol}{price.toFixed(2)}</p>

                                    <div className={styles.controls}>
                                        <div className={styles.quantity}>
                                            <button onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}>
                                                <Minus size={14} />
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <button className={styles.remove} onClick={() => removeFromCart(item.product.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.subtotal}>
                                    {(price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        );
                    })}

                    <Link href="/shop" className={styles.backLink}>
                        <ArrowLeft size={16} /> Back to Shop
                    </Link>
                </div>

                <aside className={styles.summary}>
                    <h2 className={styles.summaryTitle}>Order Summary</h2>
                    <div className={styles.summaryRow}>
                        <span>Subtotal</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                        <div className={styles.summaryRow} style={{ color: '#d32f2f' }}>
                            <span>
                                Discount
                                {appliedCoupons.length > 0 && (
                                    <span style={{ fontSize: '0.75rem', marginLeft: '0.4rem', opacity: 0.75 }}>
                                        ({appliedCoupons.map((c: any) => c.code?.toUpperCase()).join(', ')})
                                    </span>
                                )}
                            </span>
                            <span>-${discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className={styles.summaryRow}>
                        <span>Shipping</span>
                        <span>Calculated at checkout</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.total}`}>
                        <span>Total</span>
                        <span>${displayTotal.toFixed(2)}</span>
                    </div>

                    <Link href="/checkout" className={styles.checkoutBtn}>
                        PROCEED TO CHECKOUT
                    </Link>
                </aside>
            </div>
        </div>
    );
}
