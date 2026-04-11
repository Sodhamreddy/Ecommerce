export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { SITE_DOMAIN, API_BASE_URL } from '@/lib/config';

export async function POST(request: Request) {
    const { user_login } = await request.json();

    if (!user_login) {
        return NextResponse.json({ error: 'Email or username is required.' }, { status: 400 });
    }

    // ── Method 1: wp-login.php lostpassword action ──
    try {
        const res = await fetch(`${SITE_DOMAIN}/wp-login.php?action=lostpassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Cookie: 'wordpress_test_cookie=WP+Cookie+check',
                Referer: `${SITE_DOMAIN}/wp-login.php`,
            },
            body: new URLSearchParams({
                user_login,
                redirect_to: '',
                'wp-submit': 'Get New Password',
                testcookie: '1',
            }).toString(),
            redirect: 'manual',
        });

        const location = res.headers.get('location') || '';

        // Success: WP redirects to wp-login.php?checkemail=confirm
        if ((res.status >= 300 && res.status < 400) && (location.includes('checkemail') || location.includes('wp-login'))) {
            return NextResponse.json({ success: true });
        }

        // Also accept plain 302/301 as success (some WP configs)
        if (res.status === 302 || res.status === 301) {
            return NextResponse.json({ success: true });
        }

        // Check body for success/error indicators (status 200)
        const text = await res.text().catch(() => '');
        if (
            text.includes('check your email') ||
            text.includes('checkemail') ||
            text.includes('password reset') ||
            text.includes('has been sent')
        ) {
            return NextResponse.json({ success: true });
        }

        // Even if WP returns error page for "email not found", we show generic success
        // (security: don't reveal if email exists)
        if (text.includes('ERROR') || text.includes('Invalid')) {
            // User not found — still return success for security
            return NextResponse.json({ success: true });
        }
    } catch (e: any) {
        // Network error — fall through to method 2
    }

    // ── Method 2: Try WooCommerce Store API (some stores support this) ──
    try {
        const res = await fetch(`${API_BASE_URL}/wc/store/v1/customers/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user_login }),
        });
        if (res.ok) return NextResponse.json({ success: true });
    } catch {}

    // ── Fallback: always return success for security (don't reveal if email exists) ──
    // The WP email was likely sent even if we couldn't detect it
    return NextResponse.json({ success: true });
}
