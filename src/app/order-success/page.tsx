"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Calendar } from 'lucide-react';
import styles from './OrderSuccess.module.css';

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id') || 'ORD-999999';

    // Simulated arrival date (+4 days)
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 4);

    return (
        <div className={styles.container}>
            <div className={styles.successCard}>
                <div className={styles.iconCircle}>
                    <CheckCircle size={64} className={styles.checkIcon} />
                </div>

                <h1 className={styles.title}>Order Confirmed!</h1>
                <p className={styles.message}>
                    Thank you for shopping with Jersey Perfume. Your payment was successfully processed and your order is now being prepared for dispatch.
                </p>

                <div className={styles.orderBox}>
                    <div className={styles.orderDetail}>
                        <span className={styles.label}>Order Reference:</span>
                        <span className={styles.value}>{orderId}</span>
                    </div>
                </div>

                <div className={styles.trackingTimeline}>
                    <h2 className={styles.trackingTitle}>Order Tracking Status</h2>

                    <div className={styles.timelineItem}>
                        <div className={`${styles.bubble} ${styles.activeBubble}`}><CheckCircle size={16} /></div>
                        <div className={styles.timelineContent}>
                            <h4>Order Placed</h4>
                            <p>We've received your order and payment.</p>
                        </div>
                    </div>

                    <div className={styles.timelineItem}>
                        <div className={styles.bubble}><Package size={16} /></div>
                        <div className={styles.timelineContent}>
                            <h4>Processing</h4>
                            <p>Your items are being carefully hand-packed.</p>
                        </div>
                    </div>

                    <div className={styles.timelineItem}>
                        <div className={styles.bubble}><Truck size={16} /></div>
                        <div className={styles.timelineContent}>
                            <h4>Shipped</h4>
                            <p>Handed over to our delivery partners.</p>
                        </div>
                    </div>

                    <div className={styles.timelineItem}>
                        <div className={styles.bubble}><Calendar size={16} /></div>
                        <div className={styles.timelineContent}>
                            <h4>Estimated Delivery</h4>
                            <p style={{ fontWeight: 600, color: '#3340d3' }}>
                                {arrivalDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link href="/shop" className={styles.shopBtn}>Continue Shopping</Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '10rem' }}>Loading Order...</div>}>
            <OrderSuccessContent />
        </Suspense>
    );
}
