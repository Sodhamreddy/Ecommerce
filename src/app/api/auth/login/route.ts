export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { SITE_DOMAIN, API_BASE_URL } from '@/lib/config';

const WP_JSON = API_BASE_URL;
const ckKey = process.env.WC_CONSUMER_KEY;
const ckSecret = process.env.WC_CONSUMER_SECRET;

/** Fetch full WC customer data (billing, shipping, name, email) using consumer keys */
async function fetchWCCustomer(userId: number) {
    if (!ckKey || !ckSecret) return null;
    try {
        const res = await fetch(
            `${WP_JSON}/wc/v3/customers/${userId}?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
            { cache: 'no-store' }
        );
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/** Method 1: JWT Authentication (wp-api-jwt-auth or similar plugin) */
async function tryJwtLogin(username: string, password: string) {
    const endpoints = [
        `${WP_JSON}/jwt-auth/v1/token`,
        `${WP_JSON}/simple-jwt-login/v1/auth`,
    ];
    for (const url of endpoints) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (!res.ok) continue;
            const data = await res.json();
            if (data?.token) return { token: data.token, userId: data.user_id || null };
        } catch {}
    }
    return null;
}

/** Method 2: WP Application Passwords (Basic Auth — WP 5.6+) */
async function tryBasicAuth(username: string, password: string) {
    try {
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        const res = await fetch(`${WP_JSON}/wp/v2/users/me?context=edit`, {
            headers: { Authorization: `Basic ${credentials}` },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/** Method 3: Cookie-based login via wp-login.php */
async function tryCookieLogin(username: string, password: string) {
    try {
        const loginRes = await fetch(`${SITE_DOMAIN}/wp-login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Cookie: 'wordpress_test_cookie=WP+Cookie+check',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Referer: `${SITE_DOMAIN}/wp-login.php`,
            },
            body: new URLSearchParams({
                log: username,
                pwd: password,
                'wp-submit': 'Log In',
                redirect_to: `${SITE_DOMAIN}/wp-admin/`,
                testcookie: '1',
            }).toString(),
            redirect: 'manual',
        });

        // WordPress returns 302 on success, 200 on failure
        const status = loginRes.status;
        if (status < 300 || status >= 400) return null;

        // Collect session cookies
        let cookieParts: string[] = [];
        if (typeof (loginRes.headers as any).getSetCookie === 'function') {
            cookieParts = (loginRes.headers as any).getSetCookie() as string[];
        } else {
            const raw = loginRes.headers.get('set-cookie') || '';
            cookieParts = raw.split(/,(?=[a-z_]+=)/i);
        }

        const cookieStr = cookieParts
            .map((c: string) => c.split(';')[0].trim())
            .filter(Boolean)
            .join('; ');

        if (!cookieStr.includes('wordpress_logged_in_')) return null;
        return cookieStr;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    const { username, password } = await request.json();

    if (!username || !password) {
        return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    // ── Attempt 1: JWT Auth ──
    const jwt = await tryJwtLogin(username, password);
    if (jwt) {
        const wpUser = jwt.token
            ? await fetch(`${WP_JSON}/wp/v2/users/me?context=edit`, {
                headers: { Authorization: `Bearer ${jwt.token}` },
            }).then(r => r.ok ? r.json() : null).catch(() => null)
            : null;

        const userId = jwt.userId || wpUser?.id;
        const wcCustomer = userId ? await fetchWCCustomer(userId) : null;

        return NextResponse.json({
            id: userId,
            name: wcCustomer ? `${wcCustomer.first_name} ${wcCustomer.last_name}`.trim() : (wpUser?.name || username),
            user_email: wcCustomer?.email || wpUser?.email || username,
            billing: wcCustomer?.billing || null,
            shipping: wcCustomer?.shipping || null,
            token: jwt.token,
        });
    }

    // ── Attempt 2: WP Application Password / Basic Auth ──
    const wpUser = await tryBasicAuth(username, password);
    if (wpUser) {
        const wcCustomer = await fetchWCCustomer(wpUser.id);
        return NextResponse.json({
            id: wpUser.id,
            name: wcCustomer ? `${wcCustomer.first_name} ${wcCustomer.last_name}`.trim() : (wpUser.name || username),
            user_email: wcCustomer?.email || wpUser.email || username,
            billing: wcCustomer?.billing || null,
            shipping: wcCustomer?.shipping || null,
        });
    }

    // ── Attempt 3: Cookie-based login ──
    const cookieStr = await tryCookieLogin(username, password);
    if (cookieStr) {
        // Fetch user info via session cookie
        const meRes = await fetch(`${WP_JSON}/wp/v2/users/me?context=edit`, {
            headers: { Cookie: cookieStr },
        });
        const wpUserCookie = meRes.ok ? await meRes.json().catch(() => ({})) : {};

        // Fetch WC customer store data
        let billing = null;
        let shipping = null;
        const custRes = await fetch(`${WP_JSON}/wc/store/v1/customer`, {
            headers: { Cookie: cookieStr },
        });
        if (custRes.ok) {
            const cust = await custRes.json().catch(() => null);
            if (cust) {
                billing = cust.billing_address || null;
                shipping = cust.shipping_address || null;
            }
        }

        // Fetch full WC customer data using consumer keys for richer data
        const wcCustomer = wpUserCookie.id ? await fetchWCCustomer(wpUserCookie.id) : null;

        return NextResponse.json({
            id: wpUserCookie.id || null,
            name: wcCustomer ? `${wcCustomer.first_name} ${wcCustomer.last_name}`.trim() : (wpUserCookie.name || username),
            user_email: wcCustomer?.email || wpUserCookie.email || username,
            sessionCookie: cookieStr,
            billing: wcCustomer?.billing || billing,
            shipping: wcCustomer?.shipping || shipping,
        });
    }

    // ── All methods failed — verify if user exists to give better error ──
    if (ckKey && ckSecret) {
        try {
            const searchRes = await fetch(
                `${WP_JSON}/wc/v3/customers?email=${encodeURIComponent(username)}&consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
                { cache: 'no-store' }
            );
            if (searchRes.ok) {
                const customers = await searchRes.json();
                if (Array.isArray(customers) && customers.length > 0) {
                    return NextResponse.json({ error: 'Password is incorrect. Please try again or reset your password.' }, { status: 401 });
                }
            }
        } catch {}
    }

    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
}
