"use client";

import { useState, useEffect } from 'react';
import styles from './AccountContent.module.css';
import {
    LayoutDashboard, User, LogOut, Package, Loader2,
    Eye, EyeOff, MapPin, Settings, ShoppingBag, XCircle, RotateCcw
} from 'lucide-react';

interface Order {
    id: number;
    status: string;
    total: string;
    subtotal?: string;
    discount_total?: string;
    shipping_total?: string;
    total_tax?: string;
    fee_lines?: { name?: string; total?: string }[];
    tax_lines?: { tax_total?: string; shipping_tax_total?: string }[];
    meta_data?: { key?: string; value?: string }[];
    date_created: string;
    number: string;
    line_items?: { id?: number; name: string; quantity: number; total?: string; price?: number }[];
    billing?: { first_name?: string; last_name?: string; email?: string; phone?: string; address_1?: string; address_2?: string; city?: string; state?: string; postcode?: string; country?: string };
    shipping?: { first_name?: string; last_name?: string; address_1?: string; address_2?: string; city?: string; state?: string; postcode?: string; country?: string };
    actions?: {
        can_cancel?: boolean;
        can_refund?: boolean;
        cancel_disabled_reason?: string;
        refund_disabled_reason?: string;
    };
}

type DashView = 'dashboard' | 'orders' | 'addresses' | 'account-details';
type AuthView = 'login' | 'register' | 'forgot';

function money(value: unknown) {
    const amount = typeof value === 'number' ? value : parseFloat(String(value || '0'));
    return Number.isFinite(amount) ? amount : 0;
}

function getOrderMeta(order: Order, key: string) {
    return order.meta_data?.find((item) => item.key === key)?.value;
}

function getOrderSalesTax(order: Order) {
    const wcTax = money(order.total_tax);
    if (wcTax > 0) return wcTax;

    const salesTaxMeta = money(getOrderMeta(order, '_payment_sales_tax'));
    if (salesTaxMeta > 0) return salesTaxMeta;

    const feeTax = order.fee_lines
        ?.filter((line) => String(line.name || '').toLowerCase().includes('sales tax'))
        .reduce((sum, line) => sum + money(line.total), 0) || 0;
    if (feeTax > 0) return feeTax;

    const lineTax = order.tax_lines?.reduce((sum, line) => (
        sum + money(line.tax_total) + money(line.shipping_tax_total)
    ), 0) || 0;
    if (lineTax > 0) return lineTax;

    const verifiedPayPalAmount = money(getOrderMeta(order, '_verified_paypal_amount'));
    const orderTotal = money(order.total);
    const missingTax = verifiedPayPalAmount - orderTotal;
    return missingTax > 0 && missingTax < 100 ? missingTax : 0;
}

function getOrderDisplayTotal(order: Order) {
    const verifiedPayPalAmount = money(getOrderMeta(order, '_verified_paypal_amount'));
    const orderTotal = money(order.total);
    return verifiedPayPalAmount > orderTotal ? verifiedPayPalAmount : orderTotal;
}

export default function AccountContent() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [dashView, setDashView] = useState<DashView>('dashboard');
    const [authView, setAuthView] = useState<AuthView>('login');

    const [loading, setLoading] = useState(false);
    const [regLoading, setRegLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [regError, setRegError] = useState('');
    const [regSuccess, setRegSuccess] = useState('');
    const [forgotMsg, setForgotMsg] = useState('');

    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
    const [orderDetailsError, setOrderDetailsError] = useState('');
    const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
    const [orderActionError, setOrderActionError] = useState('');
    const [orderActionMessage, setOrderActionMessage] = useState('');

    const [showLoginPwd, setShowLoginPwd] = useState(false);
    const [showRegPwd, setShowRegPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);

    // Account details form
    const [acctSaving, setAcctSaving] = useState(false);
    const [acctMsg, setAcctMsg] = useState('');
    const [acctErr, setAcctErr] = useState('');

    useEffect(() => {
        const savedUser = localStorage.getItem('jp_user');
        if (savedUser) {
            try {
                const u = JSON.parse(savedUser);
                setUser(u);
                setIsLoggedIn(true);
            } catch {}
        }
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setLoginError('');
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
        } catch (err: any) {
            setLoginError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setRegLoading(true);
        setRegError('');
        setRegSuccess('');
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
            setRegSuccess('Account created! Please log in.');
            form.reset();
        } catch (err: any) {
            setRegError(err.message);
        } finally {
            setRegLoading(false);
        }
    };

    const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setForgotMsg('');
        const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_login: email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send reset link.');
            setForgotMsg('success');
        } catch (err: any) {
            setForgotMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async () => {
        if (!user?.id) return;
        setOrdersLoading(true);
        try {
            const params = new URLSearchParams({ customer: String(user.id) });
            if (user.user_email) params.set('email', user.user_email);
            const res = await fetch(`/api/wc/orders?${params.toString()}`);
            if (res.ok) setOrders(await res.json());
        } catch {}
        setOrdersLoading(false);
    };

    const handleViewOrders = () => {
        setDashView('orders');
        setSelectedOrder(null);
        if (orders.length === 0) loadOrders();
    };

    const openOrderDetails = async (order: Order) => {
        setSelectedOrder(order);
        setOrderDetailsError('');
        setOrderDetailsLoading(true);
        try {
            const params = new URLSearchParams({ id: String(order.id), customer: String(user.id) });
            if (user.user_email) params.set('email', user.user_email);
            const res = await fetch(`/api/wc/orders?${params.toString()}`, { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load order details.');
            setSelectedOrder(data);
        } catch (err: any) {
            setOrderDetailsError(err.message || 'Failed to load order details.');
        } finally {
            setOrderDetailsLoading(false);
        }
    };

    const handleOrderAction = async (order: Order, action: 'cancel' | 'refund') => {
        setOrderActionLoading(`${action}-${order.id}`);
        setOrderActionError('');
        setOrderActionMessage('');
        try {
            const res = await fetch('/api/wc/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: order.id,
                    customer: user.id,
                    email: user.user_email,
                    action,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Order action failed.');

            setOrders(prev => prev.map(item => item.id === data.id ? data : item));
            if (selectedOrder?.id === data.id) setSelectedOrder(data);
            setOrderActionMessage(data.message || (action === 'cancel' ? 'Order cancelled successfully.' : 'Refund request submitted.'));
        } catch (err: any) {
            setOrderActionError(err.message || 'Order action failed.');
        } finally {
            setOrderActionLoading(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jp_user');
        setIsLoggedIn(false);
        setUser(null);
        setOrders([]);
        setDashView('dashboard');
    };

    const handleSaveAccount = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAcctSaving(true);
        setAcctMsg('');
        setAcctErr('');
        const form = e.currentTarget;
        const first_name = (form.elements.namedItem('first_name') as HTMLInputElement).value;
        const last_name = (form.elements.namedItem('last_name') as HTMLInputElement).value;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const new_password = (form.elements.namedItem('new_password') as HTMLInputElement).value;
        try {
            const res = await fetch('/api/auth/update-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    first_name,
                    last_name,
                    email,
                    ...(new_password ? { password: new_password } : {}),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update account.');
            const updated = { ...user, name: `${first_name} ${last_name}`.trim(), user_email: email };
            localStorage.setItem('jp_user', JSON.stringify(updated));
            setUser(updated);
            setAcctMsg('Account updated successfully.');
        } catch (err: any) {
            setAcctErr(err.message);
        } finally {
            setAcctSaving(false);
        }
    };

    const statusColor: Record<string, string> = {
        completed: styles['status-completed'],
        processing: styles['status-processing'],
        'on-hold': styles['status-onhold'],
        cancelled: styles['status-cancelled'],
        refunded: styles['status-refunded'],
        pending: styles['status-pending'],
    };

    // ── Dashboard (logged in) ──
    if (isLoggedIn && user) {
        const billing = user.billing || {};
        const shipping = user.shipping || {};
        const displayName = user.name || user.user_email || '';
        const nameParts = displayName.split(' ');
        const initials = nameParts.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

        return (
            <div className={styles.accountContainer}>
                <div className={styles.accountPageTitle}>
                    <User size={20} /> MY ACCOUNT
                </div>
                <div className={styles.dashboard}>
                    {/* Sidebar */}
                    <aside className={styles.sidebar}>
                        <div className={styles.userProfile}>
                            <div className={styles.avatar}>{initials || <User size={28} />}</div>
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>{displayName}</div>
                                <div className={styles.userEmail}>{user.user_email}</div>
                            </div>
                        </div>

                        <nav className={styles.sideNav}>
                            <div className={`${styles.navItem} ${dashView === 'dashboard' ? styles.activeNav : ''}`} onClick={() => setDashView('dashboard')}>
                                <LayoutDashboard size={17} /> Dashboard
                            </div>
                            <div className={`${styles.navItem} ${dashView === 'orders' ? styles.activeNav : ''}`} onClick={handleViewOrders}>
                                <Package size={17} /> Orders
                            </div>
                            <div className={`${styles.navItem} ${dashView === 'addresses' ? styles.activeNav : ''}`} onClick={() => setDashView('addresses')}>
                                <MapPin size={17} /> Addresses
                            </div>
                            <div className={`${styles.navItem} ${dashView === 'account-details' ? styles.activeNav : ''}`} onClick={() => setDashView('account-details')}>
                                <Settings size={17} /> Account Details
                            </div>
                            <div className={styles.navItem} onClick={handleLogout}>
                                <LogOut size={17} /> Log out
                            </div>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className={styles.mainArea}>

                        {/* ── Dashboard ── */}
                        {dashView === 'dashboard' && (
                            <div className={styles.dashContent}>
                                <h2 className={styles.welcomeTitle}>WELCOME TO YOUR ACCOUNT PAGE</h2>
                                <p className={styles.welcomeSubtitle}>
                                    Hi <strong>{displayName}</strong>, today is a great day to check your account page. You can check also:
                                </p>
                                <div className={styles.quickActions}>
                                    <button className={styles.quickBtn} onClick={handleViewOrders}>
                                        <ShoppingBag size={18} /> RECENT ORDERS
                                    </button>
                                    <button className={styles.quickBtn} onClick={() => setDashView('addresses')}>
                                        <MapPin size={18} /> ADDRESSES
                                    </button>
                                    <button className={styles.quickBtn} onClick={() => setDashView('account-details')}>
                                        <User size={18} /> ACCOUNT DETAILS
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Orders ── */}
                        {dashView === 'orders' && (
                            <div className={styles.dashContent}>
                                <h2 className={styles.sectionTitle}>{selectedOrder ? `Order #${selectedOrder.number || selectedOrder.id}` : 'Orders'}</h2>
                                {selectedOrder ? (
                                    <div className={styles.orderDetailPage}>
                                        <button type="button" className={styles.backToOrdersBtn} onClick={() => setSelectedOrder(null)}>
                                            Back to orders
                                        </button>
                                        {orderDetailsLoading ? (
                                            <div className={styles.loadingRow}><Loader2 size={18} className="animate-spin" /> Loading order details...</div>
                                        ) : (
                                            <>
                                                {orderDetailsError && <div className={styles.errorMsg}>{orderDetailsError}</div>}
                                                <div className={styles.orderMetaGrid}>
                                                    <div>
                                                        <span>Date</span>
                                                        <strong>{new Date(selectedOrder.date_created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Status</span>
                                                        <strong className={`${styles.statusBadge} ${statusColor[selectedOrder.status] || ''}`}>{selectedOrder.status}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Total</span>
                                                        <strong>${getOrderDisplayTotal(selectedOrder).toFixed(2)}</strong>
                                                    </div>
                                                </div>
                                                {orderActionError && <div className={styles.errorMsg}>{orderActionError}</div>}
                                                {orderActionMessage && <div className={styles.successMsg}>{orderActionMessage}</div>}
                                                <div className={styles.orderActions}>
                                                    <button
                                                        type="button"
                                                        className={styles.cancelOrderBtn}
                                                        disabled={!selectedOrder.actions?.can_cancel || orderActionLoading === `cancel-${selectedOrder.id}`}
                                                        title={selectedOrder.actions?.can_cancel ? '' : selectedOrder.actions?.cancel_disabled_reason}
                                                        onClick={() => handleOrderAction(selectedOrder, 'cancel')}
                                                    >
                                                        {orderActionLoading === `cancel-${selectedOrder.id}` ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                                                        Cancel order
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.refundOrderBtn}
                                                        disabled={!selectedOrder.actions?.can_refund || orderActionLoading === `refund-${selectedOrder.id}`}
                                                        title={selectedOrder.actions?.can_refund ? '' : selectedOrder.actions?.refund_disabled_reason}
                                                        onClick={() => handleOrderAction(selectedOrder, 'refund')}
                                                    >
                                                        {orderActionLoading === `refund-${selectedOrder.id}` ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                                                        Request refund
                                                    </button>
                                                </div>

                                                <h3 className={styles.orderSubTitle}>Items</h3>
                                                {selectedOrder.line_items?.length ? (
                                                    <table className={styles.orderItemsTable}>
                                                        <tbody>
                                                            {selectedOrder.line_items.map((item, index) => (
                                                                <tr key={item.id || index}>
                                                                    <td>{item.name}</td>
                                                                    <td>Qty {item.quantity}</td>
                                                                    <td>${parseFloat(item.total || String((item.price || 0) * item.quantity) || '0').toFixed(2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <p className={styles.emptyNote}>No item details available for this order.</p>
                                                )}

                                                <div className={styles.orderTotalsBox}>
                                                    {selectedOrder.discount_total && parseFloat(selectedOrder.discount_total) > 0 && (
                                                        <div><span>Discount</span><strong>-${parseFloat(selectedOrder.discount_total).toFixed(2)}</strong></div>
                                                    )}
                                                    <div><span>Shipping</span><strong>${parseFloat(selectedOrder.shipping_total || '0').toFixed(2)}</strong></div>
                                                    <div><span>Tax</span><strong>${getOrderSalesTax(selectedOrder).toFixed(2)}</strong></div>
                                                    <div><span>Total</span><strong>${getOrderDisplayTotal(selectedOrder).toFixed(2)}</strong></div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                {ordersLoading ? (
                                    <div className={styles.loadingRow}><Loader2 size={18} className="animate-spin" /> Loading orders...</div>
                                ) : orders.length === 0 ? (
                                    <p className={styles.emptyNote}>No orders have been made yet. <span className={styles.link} onClick={() => window.location.href = '/shop'}>Browse products →</span></p>
                                ) : (
                                    <table className={styles.orderTable}>
                                        <thead>
                                            <tr>
                                                <th>Order</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Total</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr
                                                    key={order.id}
                                                    className={styles.clickableOrderRow}
                                                    onClick={() => openOrderDetails(order)}
                                                >
                                                    <td>
                                                        <button type="button" className={styles.orderLink}>
                                                            #{order.number || order.id}
                                                        </button>
                                                    </td>
                                                    <td>{new Date(order.date_created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                    <td><span className={`${styles.statusBadge} ${statusColor[order.status] || ''}`}>{order.status}</span></td>
                                                    <td>${parseFloat(order.total).toFixed(2)}</td>
                                                    <td onClick={(event) => event.stopPropagation()}>
                                                        {order.actions?.can_cancel ? (
                                                            <button
                                                                type="button"
                                                                className={styles.tableActionBtn}
                                                                disabled={orderActionLoading === `cancel-${order.id}`}
                                                                onClick={() => handleOrderAction(order, 'cancel')}
                                                            >
                                                                {orderActionLoading === `cancel-${order.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Cancel'}
                                                            </button>
                                                        ) : order.actions?.can_refund ? (
                                                            <button
                                                                type="button"
                                                                className={styles.tableActionBtn}
                                                                disabled={orderActionLoading === `refund-${order.id}`}
                                                                onClick={() => handleOrderAction(order, 'refund')}
                                                            >
                                                                {orderActionLoading === `refund-${order.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Refund'}
                                                            </button>
                                                        ) : (
                                                            <span className={styles.emptyAction}>-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── Addresses ── */}
                        {dashView === 'addresses' && (
                            <div className={styles.dashContent}>
                                <h2 className={styles.sectionTitle}>Addresses</h2>
                                <p className={styles.addressNote}>The following addresses will be used on the checkout page by default.</p>
                                <div className={styles.addressGrid}>
                                    <div className={styles.addressCard}>
                                        <h3 className={styles.addressCardTitle}>Billing Address</h3>
                                        {billing.first_name ? (
                                            <address className={styles.addressBlock}>
                                                {billing.first_name} {billing.last_name}<br />
                                                {billing.address_1}{billing.address_2 ? `, ${billing.address_2}` : ''}<br />
                                                {billing.city}{billing.state ? `, ${billing.state}` : ''} {billing.postcode}<br />
                                                {billing.country}<br />
                                                {billing.phone && <>{billing.phone}<br /></>}
                                                {billing.email && <>{billing.email}</>}
                                            </address>
                                        ) : (
                                            <p className={styles.emptyNote}>You have not set up a billing address yet.</p>
                                        )}
                                    </div>
                                    <div className={styles.addressCard}>
                                        <h3 className={styles.addressCardTitle}>Shipping Address</h3>
                                        {shipping.first_name ? (
                                            <address className={styles.addressBlock}>
                                                {shipping.first_name} {shipping.last_name}<br />
                                                {shipping.address_1}{shipping.address_2 ? `, ${shipping.address_2}` : ''}<br />
                                                {shipping.city}{shipping.state ? `, ${shipping.state}` : ''} {shipping.postcode}<br />
                                                {shipping.country}<br />
                                                {shipping.phone && <>{shipping.phone}</>}
                                            </address>
                                        ) : (
                                            <p className={styles.emptyNote}>You have not set up a shipping address yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Account Details ── */}
                        {dashView === 'account-details' && (
                            <div className={styles.dashContent}>
                                <h2 className={styles.sectionTitle}>Account Details</h2>
                                {acctMsg && <div className={styles.successMsg}>{acctMsg}</div>}
                                {acctErr && <div className={styles.errorMsg}>{acctErr}</div>}
                                <form onSubmit={handleSaveAccount} className={styles.acctForm}>
                                    <div className={styles.formRow2}>
                                        <div className={styles.formGroup}>
                                            <label>First Name *</label>
                                            <input name="first_name" required defaultValue={user.name?.split(' ')[0] || ''} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Last Name *</label>
                                            <input name="last_name" required defaultValue={user.name?.split(' ').slice(1).join(' ') || ''} />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Email Address *</label>
                                        <input type="email" name="email" required defaultValue={user.user_email || ''} />
                                    </div>
                                    <hr className={styles.divider} />
                                    <h3 className={styles.subTitle}>Password Change</h3>
                                    <p className={styles.privacyNote}>Leave blank to keep your current password.</p>
                                    <div className={styles.formGroup}>
                                        <label>New Password</label>
                                        <div className={styles.passwordWrapper}>
                                            <input type={showNewPwd ? 'text' : 'password'} name="new_password" placeholder="New password (optional)" minLength={6} />
                                            <button type="button" className={styles.eyeBtn} onClick={() => setShowNewPwd(v => !v)}>
                                                {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" className={styles.submitBtn} disabled={acctSaving}>
                                        {acctSaving ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        );
    }

    // ── Register ──
    if (authView === 'register') {
        return (
            <div className={styles.accountContainer}>
                <div className={styles.accountHeader}><h1>Create Account</h1></div>
                <div className={styles.authCard} style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <h2 className={styles.cardTitle}>Register</h2>
                    {regError && <div className={styles.errorMsg}>{regError}</div>}
                    {regSuccess ? (
                        <div className={styles.successMsg}>
                            {regSuccess}
                            <br /><br />
                            <span className={styles.link} onClick={() => { setAuthView('login'); setRegSuccess(''); setRegError(''); }}>← Back to Login</span>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleRegister}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>First Name *</label>
                                        <input type="text" name="first_name" required placeholder="First name" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Last Name *</label>
                                        <input type="text" name="last_name" required placeholder="Last name" />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email address *</label>
                                    <input type="email" name="reg_email" required placeholder="your@email.com" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Password *</label>
                                    <div className={styles.passwordWrapper}>
                                        <input type={showRegPwd ? 'text' : 'password'} name="reg_password" required placeholder="Create a password" minLength={6} />
                                        <button type="button" className={styles.eyeBtn} onClick={() => setShowRegPwd(v => !v)}>
                                            {showRegPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <p className={styles.privacyNote}>
                                    Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our <a href="/info/privacy-policy">privacy policy</a>.
                                </p>
                                <button type="submit" className={styles.submitBtn} disabled={regLoading}>
                                    {regLoading ? <Loader2 className="animate-spin" size={18} /> : 'Register'}
                                </button>
                            </form>
                            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: '#555' }}>
                                Already have an account?{' '}
                                <span className={styles.link} onClick={() => { setAuthView('login'); setRegError(''); }}>Log in here</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ── Forgot Password ──
    if (authView === 'forgot') {
        return (
            <div className={styles.accountContainer}>
                <div className={styles.accountHeader}><h1>My Account</h1></div>
                <div className={styles.authCard} style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <h2 className={styles.cardTitle}>Lost Password</h2>
                    {forgotMsg === 'success' ? (
                        <div className={styles.successMsg}>
                            Password reset link has been sent to your email. Please check your inbox.
                            <br /><br />
                            <span className={styles.link} onClick={() => { setAuthView('login'); setForgotMsg(''); }}>← Back to login</span>
                        </div>
                    ) : (
                        <>
                            {forgotMsg && <div className={styles.errorMsg}>{forgotMsg}</div>}
                            <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '2rem' }}>
                                Enter your username or email address and we will send you a link to reset your password.
                            </p>
                            <form onSubmit={handleForgot}>
                                <div className={styles.formGroup}>
                                    <label>Username or Email</label>
                                    <input type="text" name="email" required placeholder="example@email.com" />
                                </div>
                                <button type="submit" className={styles.submitBtn} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Reset Password'}
                                </button>
                                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                    <span className={styles.link} onClick={() => { setAuthView('login'); setForgotMsg(''); }}>← Back to login</span>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ── Login ──
    return (
        <div className={styles.accountContainer}>
            <div className={styles.accountHeader}><h1>My Account</h1></div>
            <div className={styles.authCard} style={{ maxWidth: '480px', margin: '0 auto' }}>
                <h2 className={styles.cardTitle}>Login</h2>
                {loginError && <div className={styles.errorMsg}>{loginError}</div>}
                {regSuccess && <div className={styles.successMsg}>{regSuccess}</div>}
                <form onSubmit={handleLogin}>
                    <div className={styles.formGroup}>
                        <label>Username or email address *</label>
                        <input type="text" name="email" required placeholder="Enter username or email" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Password *</label>
                        <div className={styles.passwordWrapper}>
                            <input type={showLoginPwd ? 'text' : 'password'} name="password" required placeholder="••••••••" />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowLoginPwd(v => !v)}>
                                {showLoginPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <span className={styles.forgotLink} style={{ cursor: 'pointer' }} onClick={() => setAuthView('forgot')}>Lost your password?</span>
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Log In'}
                    </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: '#555' }}>
                    Don&apos;t have an account?{' '}
                    <span className={styles.link} onClick={() => { setAuthView('register'); setLoginError(''); }} style={{ cursor: 'pointer', fontWeight: 700 }}>Register here</span>
                </div>
            </div>
        </div>
    );
}
