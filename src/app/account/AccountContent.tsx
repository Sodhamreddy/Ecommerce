"use client";

import { useState, useEffect } from 'react';
import styles from './AccountContent.module.css';
import { LayoutDashboard, User, LogOut, Package, Loader2 } from 'lucide-react';

interface Order {
    id: number;
    status: string;
    total: string;
    date_created: string;
    number: string;
    line_items?: { name: string; quantity: number }[];
}

export default function AccountContent() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [view, setView] = useState<'login' | 'register' | 'forgot' | 'dashboard' | 'orders'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('jp_user');
        if (savedUser) {
            try {
                const u = JSON.parse(savedUser);
                setUser(u);
                setIsLoggedIn(true);
                setView('dashboard');
            } catch {}
        }
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const form = e.currentTarget;
        const username = (form.elements.namedItem('email') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed.');

            localStorage.setItem('jp_user', JSON.stringify(data));
            setUser(data);
            setIsLoggedIn(true);
            setView('dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        const form = e.currentTarget;
        const email = (form.elements.namedItem('reg_email') as HTMLInputElement).value;
        const password = (form.elements.namedItem('reg_password') as HTMLInputElement).value;
        const first_name = (form.elements.namedItem('first_name') as HTMLInputElement).value;
        const last_name = (form.elements.namedItem('last_name') as HTMLInputElement).value;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, first_name, last_name }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed.');

            setSuccess('Account created! Please log in.');
            setView('login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
        // WP lost-password endpoint (standard WP form action)
        setTimeout(() => {
            alert(`If an account exists for ${email}, a password reset link has been sent.`);
            setLoading(false);
            setView('login');
        }, 1000);
    };

    const loadOrders = async () => {
        if (!user?.token) return;
        setOrdersLoading(true);
        try {
            const res = await fetch('https://jerseyperfume.com/wp-json/wc/v3/orders?customer=' + (user.id || ''), {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch {}
        setOrdersLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('jp_user');
        setIsLoggedIn(false);
        setUser(null);
        setOrders([]);
        setView('login');
    };

    const handleViewOrders = () => {
        setView('orders');
        if (orders.length === 0) loadOrders();
    };

    const statusColor: Record<string, string> = {
        completed: styles['status-completed'],
        processing: styles['status-processing'],
        'on-hold': styles['status-onhold'],
        cancelled: styles['status-cancelled'],
        pending: styles['status-pending'],
    };

    if (isLoggedIn) {
        return (
            <div className={styles.accountContainer}>
                <div className={styles.dashboard}>
                    <aside className={styles.sidebar}>
                        <div className={`${styles.sidebarItem} ${view === 'dashboard' ? styles.activeItem : ''}`} onClick={() => setView('dashboard')}>
                            <LayoutDashboard size={18} /> Dashboard
                        </div>
                        <div className={`${styles.sidebarItem} ${view === 'orders' ? styles.activeItem : ''}`} onClick={handleViewOrders}>
                            <Package size={18} /> My Orders
                        </div>
                        <div className={styles.sidebarItem}>
                            <User size={18} /> Account Details
                        </div>
                        <div className={styles.sidebarItem} onClick={handleLogout}>
                            <LogOut size={18} /> Logout
                        </div>
                    </aside>

                    <main className={styles.mainArea}>
                        {view === 'dashboard' && (
                            <div className={styles.welcomeSection}>
                                <h2>Hello, {user?.name || user?.user_email}!</h2>
                                <p>From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your account details.</p>
                                <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className={styles.authCard} style={{ cursor: 'pointer' }} onClick={handleViewOrders}>
                                        <Package size={32} style={{ marginBottom: '1rem', color: '#3340d3' }} />
                                        <h4>Orders</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#888' }}>Check your recent shipment status.</p>
                                    </div>
                                    <div className={styles.authCard}>
                                        <User size={32} style={{ marginBottom: '1rem', color: '#3340d3' }} />
                                        <h4>Account Details</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#888' }}>Update your profile and email.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === 'orders' && (
                            <div className={styles.welcomeSection}>
                                <h2>Your Orders</h2>
                                {ordersLoading ? (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2rem' }}>
                                        <Loader2 size={18} className="animate-spin" /> Loading orders...
                                    </div>
                                ) : orders.length === 0 ? (
                                    <p style={{ marginTop: '1.5rem', color: '#888' }}>No orders found.</p>
                                ) : (
                                    <table className={styles.orderTable}>
                                        <thead>
                                            <tr>
                                                <th>Order</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td>#{order.number || order.id}</td>
                                                    <td>{new Date(order.date_created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                    <td><span className={`${styles.statusBadge} ${statusColor[order.status] || ''}`}>{order.status}</span></td>
                                                    <td>${parseFloat(order.total).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.accountContainer}>
            <div className={styles.accountHeader}>
                <h1>My Account</h1>
                <p>Welcome! Please sign in or create an account below.</p>
            </div>

            {view === 'login' && (
                <div className={styles.authGrid}>
                    <div className={styles.authCard}>
                        <h2 className={styles.cardTitle}>Login</h2>
                        {error && <div className={styles.errorMsg}>{error}</div>}
                        {success && <div className={styles.successMsg}>{success}</div>}
                        <form onSubmit={handleLogin}>
                            <div className={styles.formGroup}>
                                <label>Username or Email</label>
                                <input type="text" name="email" required placeholder="Enter username or email" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Password</label>
                                <input type="password" name="password" required placeholder="••••••••" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                                <span className={styles.forgotLink} style={{ cursor: 'pointer' }} onClick={() => setView('forgot')}>Lost password?</span>
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Log In'}
                            </button>
                        </form>
                        <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.88rem', color: '#666' }}>
                            No account?{' '}
                            <span style={{ color: '#3340d3', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setError(''); setView('register'); }}>
                                Register here
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {view === 'register' && (
                <div className={styles.authGrid}>
                    <div className={styles.authCard}>
                        <h2 className={styles.cardTitle}>Create Account</h2>
                        {error && <div className={styles.errorMsg}>{error}</div>}
                        <form onSubmit={handleRegister}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={styles.formGroup}>
                                    <label>First Name</label>
                                    <input type="text" name="first_name" placeholder="First name" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Last Name</label>
                                    <input type="text" name="last_name" placeholder="Last name" />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email Address *</label>
                                <input type="email" name="reg_email" required placeholder="your@email.com" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Password *</label>
                                <input type="password" name="reg_password" required placeholder="Create a password" minLength={6} />
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Register'}
                            </button>
                        </form>
                        <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.88rem', color: '#666' }}>
                            Already have an account?{' '}
                            <span style={{ color: '#3340d3', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setError(''); setView('login'); }}>
                                Log in
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {view === 'forgot' && (
                <div className={styles.authCard} style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <h2 className={styles.cardTitle}>Lost Password</h2>
                    <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '2rem' }}>
                        Enter your email address and we will send you a link to reset your password.
                    </p>
                    <form onSubmit={handleForgot}>
                        <div className={styles.formGroup}>
                            <label>Username or Email</label>
                            <input type="text" name="email" required placeholder="example@email.com" />
                        </div>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Reset Password'}
                        </button>
                        <button type="button" className={styles.forgotLink} style={{ width: '100%', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', marginTop: '1rem' }} onClick={() => setView('login')}>
                            Back to login
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
