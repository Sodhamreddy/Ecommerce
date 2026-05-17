"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const key   = searchParams.get('key')   || '';
    const login = searchParams.get('login') || '';
    const token = searchParams.get('token') || '';

    const [password, setPassword]       = useState('');
    const [confirm, setConfirm]         = useState('');
    const [showPwd, setShowPwd]         = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const [success, setSuccess]         = useState(false);

    useEffect(() => {
        if (!token && (!key || !login)) setError('Invalid or expired reset link. Please request a new one.');
    }, [key, login, token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirm) { setError('Passwords do not match.'); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/confirm-reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, login, token, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
            setSuccess(true);
            setTimeout(() => router.push('/account/'), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '2.5rem', width: '100%', maxWidth: '440px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111' }}>Reset Your Password</h1>

                {success ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '1rem', color: '#166534', fontSize: '0.9rem' }}>
                        Password reset successfully! Redirecting to login...
                    </div>
                ) : (
                    <>
                        {error && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '0.75rem', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                                {error}
                                {(!token && (!key || !login)) && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <a href="/account/" style={{ color: '#151c39', fontWeight: 600, textDecoration: 'underline' }}>← Request a new reset link</a>
                                    </div>
                                )}
                            </div>
                        )}

                        {(token || (key && login)) && (
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#333' }}>New Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required minLength={6}
                                            placeholder="Enter new password"
                                            style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.75rem', border: '1px solid #ddd', borderRadius: '3px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                        />
                                        <button type="button" onClick={() => setShowPwd(v => !v)}
                                            style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#333' }}>Confirm Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            required minLength={6}
                                            placeholder="Confirm new password"
                                            style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.75rem', border: '1px solid #ddd', borderRadius: '3px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                                            style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    style={{ width: '100%', padding: '0.75rem', background: '#151c39', color: '#fff', border: 'none', borderRadius: '3px', fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
