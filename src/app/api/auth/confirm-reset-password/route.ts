export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { API_BASE_URL, SITE_DOMAIN } from '@/lib/config';
import { verifyPasswordResetToken } from '@/lib/password-reset-token';

const ckKey = process.env.WC_CONSUMER_KEY;
const ckSecret = process.env.WC_CONSUMER_SECRET;

export async function POST(request: Request) {
    const { key, login, password, token } = await request.json();

    if (!password || (!token && (!key || !login))) {
        return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (token) {
        if (!ckKey || !ckSecret) {
            return NextResponse.json({ error: 'Password reset is temporarily unavailable.' }, { status: 500 });
        }

        try {
            const payload = verifyPasswordResetToken(token);
            if (!payload) {
                return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
            }

            const params = new URLSearchParams({
                consumer_key: ckKey,
                consumer_secret: ckSecret,
            });
            const res = await fetch(`${API_BASE_URL}/wc/v3/customers/${payload.id}?${params.toString()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                return NextResponse.json(
                    { error: data?.message || 'Could not reset password. Please request a new link.' },
                    { status: 400 }
                );
            }

            return NextResponse.json({ success: true });
        } catch (e: unknown) {
            return NextResponse.json(
                { error: e instanceof Error ? e.message : 'Server error' },
                { status: 500 }
            );
        }
    }

    try {
        // Submit new password to WordPress reset endpoint
        const res = await fetch(`${SITE_DOMAIN}/wp-login.php?action=resetpass`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
                'Referer': `${SITE_DOMAIN}/wp-login.php`,
            },
            body: new URLSearchParams({
                'rp_key': key,
                'rp_login': login,
                'pass1': password,
                'pass2': password,
                'wp-submit': 'Save Password',
                'action': 'resetpass',
            }).toString(),
            redirect: 'manual',
        });

        // WordPress redirects to login page on success
        const location = res.headers.get('location') || '';
        if (res.status >= 300 && res.status < 400) {
            if (location.includes('password-reset') || location.includes('wp-login') || location.includes('loggedout')) {
                return NextResponse.json({ success: true });
            }
        }

        // Check body for error indicators
        const text = await res.text().catch(() => '');
        if (text.includes('Your password has been reset') || text.includes('password has been changed')) {
            return NextResponse.json({ success: true });
        }
        if (text.includes('invalid key') || text.includes('Invalid key') || text.includes('expired')) {
            return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
        }

        // Accept 302 redirect as success (common WP behavior)
        if (res.status === 302 || res.status === 301) {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Could not reset password. The link may have expired.' }, { status: 400 });
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
    }
}
