"use client";

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import styles from './CartPage.module.css';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

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

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Your Shopping Bag</h1>

            <div className={styles.layout}>
                <div className={styles.items}>
                    {cart.map((item) => {
                        const minorUnit = item.product.prices.currency_minor_unit || 2;
                        const price = parseInt(item.product.prices.price) / Math.pow(10, minorUnit);

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
                    <div className={styles.summaryRow}>
                        <span>Shipping</span>
                        <span>Calculated at checkout</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.total}`}>
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>

                    <button className={styles.checkoutBtn}>
                        PROCEED TO CHECKOUT
                    </button>
                </aside>
            </div>
        </div>
    );
}
