import { NextResponse } from 'next/server';

const WP_BASE = 'https://jerseyperfume.com';
const WP_JSON = `${WP_BASE}/wp-json`;

export async function POST(request: Request) {
    const { username, password } = await request.json();

    if (!username || !password) {
        return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    try {
        // ── Step 1: Authenticate via wp-login.php ──
        // 302 redirect = valid credentials, 200 = wrong credentials
        const loginRes = await fetch(`${WP_BASE}/wp-login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Cookie: 'wordpress_test_cookie=WP+Cookie+check',
                'User-Agent': 'Mozilla/5.0',
            },
            body: new URLSearchParams({
                log: username,
                pwd: password,
                'wp-submit': 'Log In',
                redirect_to: '/wp-admin/',
                testcookie: '1',
            }).toString(),
            redirect: 'manual',
        });

        if (loginRes.status !== 302) {
            return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
        }

        // ── Step 2: Collect session cookies ──
        // Node 18+ supports getSetCookie(); fall back to splitting the header
        let cookieParts: string[] = [];
        if (typeof (loginRes.headers as any).getSetCookie === 'function') {
            cookieParts = (loginRes.headers as any).getSetCookie() as string[];
        } else {
            const raw = loginRes.headers.get('set-cookie') || '';
            // Split multiple Set-Cookie values (commas appear inside values too, use name= pattern)
            cookieParts = raw.split(/,(?=[a-z_]+=[^;]+;)/i);
        }

        // Build a Cookie header string (name=value only, no attributes)
        const cookieStr = cookieParts
            .map(c => c.split(';')[0].trim())
            .filter(Boolean)
            .join('; ');

        if (!cookieStr.includes('wordpress_logged_in_')) {
            return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 401 });
        }

        // ── Step 3: Fetch WP user info with session cookie ──
        const meRes = await fetch(`${WP_JSON}/wp/v2/users/me?context=edit`, {
            headers: { Cookie: cookieStr },
        });

        let wpUser: any = {};
        if (meRes.ok) {
            wpUser = await meRes.json().catch(() => ({}));
        }

        // ── Step 4: Fetch WC customer billing/shipping with session cookie ──
        let billing: any = null;
        let shipping: any = null;
        let wcId: number | null = wpUser.id || null;

        const custRes = await fetch(`${WP_JSON}/wc/store/v1/customer`, {
            headers: { Cookie: cookieStr },
        });
        if (custRes.ok) {
            const cust = await custRes.json().catch(() => null);
            if (cust) {
                wcId = cust.id || wcId;
                billing = cust.billing_address || null;
                shipping = cust.shipping_address || null;
            }
        }

        const user = {
            id: wcId,
            name: wpUser.name || wpUser.display_name || username,
            user_email: wpUser.email || username,
            // Store session cookie for subsequent authenticated requests
            sessionCookie: cookieStr,
            billing,
            shipping,
        };

        return NextResponse.json(user);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Login failed.' }, { status: 500 });
    }
}
