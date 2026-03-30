"use client";

import React, { useState } from 'react';
import styles from './OrderTracking.module.css';
import { Search, Package, Truck, CheckCircle, Loader2, Info } from 'lucide-react';

export default function OrderTracking() {
    const [tab, setTab] = useState<'order' | 'tracking'>('order');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleTrack = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        // Simulation of tracking API
        // In reality, this would call a WooCommerce tracking endpoint or jerseyperfume's TrackShip service
        setTimeout(() => {
            const orderId = e.target.orderId?.value || e.target.trackingId?.value;
            if (orderId === '12345') {
                setResult({
                    id: '#12345',
                    status: 'In Transit',
                    lastUpdate: 'Package is being processed at the sorting facility.',
                    timeline: [
                        { status: 'Out for Delivery', date: 'March 27, 2026 8:30 AM', active: false },
                        { status: 'In Transit', date: 'March 26, 2026 11:20 PM', active: true },
                        { status: 'Shipped', date: 'March 25, 2026 2:45 PM', active: false },
                        { status: 'Processed', date: 'March 25, 2026 9:15 AM', active: false },
                        { status: 'Order Placed', date: 'March 24, 2026 8:00 PM', active: false }
                    ]
                });
            } else {
                setError('No order found with the provided details. Please check your information and try again.');
            }
            setLoading(false);
        }, 1500);
    };

    return (
        <div className={styles.trackingContainer}>
            <div className={styles.trackingHeader}>
                <h1>Track Your Order</h1>
                <p>Stay updated on your fragrance journey. Enter your details below to see the current status of your shipment.</p>
            </div>

            <div className={styles.trackingCard}>
                <div className={styles.tabSwitcher}>
                    <div 
                        className={`${styles.tab} ${tab === 'order' ? styles.activeTab : ''}`}
                        onClick={() => setTab('order')}
                    >
                        Order Details
                    </div>
                    <div 
                        className={`${styles.tab} ${tab === 'tracking' ? styles.activeTab : ''}`}
                        onClick={() => setTab('tracking')}
                    >
                        Tracking Number
                    </div>
                </div>

                <form onSubmit={handleTrack}>
                    <div className={styles.formGrid}>
                        {tab === 'order' ? (
                            <>
                                <div className={styles.inputField}>
                                    <label>Order Number</label>
                                    <input name="orderId" type="text" placeholder="Found in your confirmation email" required />
                                </div>
                                <div className={styles.inputField}>
                                    <label>Billing Email</label>
                                    <input name="email" type="email" placeholder="Email used for checkout" required />
                                </div>
                            </>
                        ) : (
                            <div className={styles.inputField} style={{ gridColumn: 'span 2' }}>
                                <label>Tracking Number</label>
                                <input name="trackingId" type="text" placeholder="e.g. JER123456789" required />
                            </div>
                        )}
                    </div>

                    <button type="submit" className={styles.trackBtn} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        {loading ? 'Searching...' : 'Track Order'}
                    </button>
                </form>

                {error && (
                    <div className={styles.resultBox} style={{ borderTop: 'none', background: '#fff0f0', color: '#c53030', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <Info size={18} />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {result && (
                    <div className={styles.resultBox}>
                        <div className={styles.resultTitle}>Order {result.id}</div>
                        <span className={styles.statusText}>{result.status}</span>
                        
                        <div className={styles.timeline}>
                            {result.timeline.map((item: any, idx: number) => (
                                <div 
                                    key={idx} 
                                    className={`${styles.timelineItem} ${item.active ? styles.timelineItemActive : ''}`}
                                >
                                    <h4>{item.status}</h4>
                                    <p>{item.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '3rem', color: '#999', fontSize: '0.85rem' }}>
                Questions about your delivery? Contact us at support@jerseyperfume.com
            </div>
        </div>
    );
}
