export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { SITE_DOMAIN, API_BASE_URL } from '@/lib/config';

const WP_JSON = API_BASE_URL;
const ckKey = process.env.WC_CONSUMER_KEY;
const ckSecret = process.env.WC_CONSUMER_SECRET;

type WPUser = {
    id?: number;
    name?: string;
    email?: string;
};

type WCCustomer = {
    id: number;
    email?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    billing?: unknown;
    shipping?: unknown;
};

type JwtLogin = {
    token: string;
    userId: number | null;
};

type HeadersWithSetCookie = Headers & {
    getSetCookie?: () => string[];
};

function isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function fullName(customer: WCCustomer | null, fallback: string) {
    const name = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : '';
    return name || fallback;
}

function uniqueIdentifiers(values: Array<string | undefined | null>) {
    const seen = new Set<string>();
    return values
        .map(value => value?.trim())
        .filter((value): value is string => Boolean(value))
        .filter(value => {
            const normalized = value.toLowerCase();
            if (seen.has(normalized)) return false;
            seen.add(normalized);
            return true;
        });
}

async function fetchWCCustomer(userId: number): Promise<WCCustomer | null> {
    if (!ckKey || !ckSecret) return null;
    try {
        const res = await fetch(
            `${WP_JSON}/wc/v3/customers/${userId}?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
            { cache: 'no-store' }
        );
        if (!res.ok) return null;
        return await res.json() as WCCustomer;
    } catch {
        return null;
    }
}

async function findWCCustomerByLogin(login: string): Promise<WCCustomer | null> {
    if (!ckKey || !ckSecret) return null;

    const params = new URLSearchParams({
        consumer_key: ckKey,
        consumer_secret: ckSecret,
        per_page: '10',
    });
    params.set(isEmail(login) ? 'email' : 'search', login);

    try {
        const res = await fetch(`${WP_JSON}/wc/v3/customers?${params.toString()}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;

        const customers = await res.json().catch(() => []) as WCCustomer[];
        if (!Array.isArray(customers) || customers.length === 0) return null;

        const normalizedLogin = login.toLowerCase();
        return customers.find(customer => {
            return customer.email?.toLowerCase() === normalizedLogin
                || customer.username?.toLowerCase() === normalizedLogin;
        }) || customers[0] || null;
    } catch {
        return null;
    }
}

function loginResponse(params: {
    requestedLogin: string;
    authLogin: string;
    wpUser: WPUser | null;
    wcCustomer: WCCustomer | null;
    token?: string;
    sessionCookie?: string;
    billing?: unknown;
    shipping?: unknown;
}) {
    const { requestedLogin, authLogin, wpUser, wcCustomer, token, sessionCookie, billing, shipping } = params;
    const fallbackName = wpUser?.name || authLogin || requestedLogin;

    return NextResponse.json({
        id: wcCustomer?.id || wpUser?.id || null,
        name: fullName(wcCustomer, fallbackName),
        user_email: wcCustomer?.email || wpUser?.email || requestedLogin,
        billing: wcCustomer?.billing || billing || null,
        shipping: wcCustomer?.shipping || shipping || null,
        ...(token ? { token } : {}),
        ...(sessionCookie ? { sessionCookie } : {}),
    });
}

async function tryJwtLogin(username: string, password: string): Promise<JwtLogin | null> {
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
            const data = await res.json().catch(() => null) as { token?: string; user_id?: number } | null;
            if (data?.token) return { token: data.token, userId: data.user_id || null };
        } catch {}
    }
    return null;
}

async function fetchWPUserWithBearer(token: string): Promise<WPUser | null> {
    return fetch(`${WP_JSON}/wp/v2/users/me?context=edit`, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() as Promise<WPUser> : null).catch(() => null);
}

async function tryBasicAuth(username: string, password: string): Promise<WPUser | null> {
    try {
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        const res = await fetch(`${WP_JSON}/wp/v2/users/me?context=edit`, {
            headers: { Authorization: `Basic ${credentials}` },
        });
        if (!res.ok) return null;
        return await res.json() as WPUser;
    } catch {
        return null;
    }
}

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

        if (loginRes.status < 300 || loginRes.status >= 400) return null;

        const headers = loginRes.headers as HeadersWithSetCookie;
        const cookieParts = typeof headers.getSetCookie === 'function'
            ? headers.getSetCookie()
            : (headers.get('set-cookie') || '').split(/,(?=[a-z_]+=)/i);

        const cookieStr = cookieParts
            .map(cookie => cookie.split(';')[0].trim())
            .filter(Boolean)
            .join('; ');

        if (!cookieStr.includes('wordpress_logged_in_')) return null;
        return cookieStr;
    } catch {
        return null;
    }
}

async function fetchWPUserWithCookie(cookieStr: string): Promise<WPUser | null> {
    const res = await fetch(`${WP_JSON}/wp/v2/users/me?context=edit`, {
        headers: { Cookie: cookieStr },
    });
    return res.ok ? await res.json().catch(() => null) as WPUser | null : null;
}

async function fetchStoreCustomerWithCookie(cookieStr: string) {
    const res = await fetch(`${WP_JSON}/wc/store/v1/customer`, {
        headers: { Cookie: cookieStr },
    });
    if (!res.ok) return { billing: null, shipping: null };

    const customer = await res.json().catch(() => null) as {
        billing_address?: unknown;
        shipping_address?: unknown;
    } | null;

    return {
        billing: customer?.billing_address || null,
        shipping: customer?.shipping_address || null,
    };
}

export async function POST(request: Request) {
    const { username, password } = await request.json();

    if (!username || !password) {
        return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const requestedLogin = String(username).trim();
    const existingCustomer = await findWCCustomerByLogin(requestedLogin);
    const identifiers = uniqueIdentifiers([
        requestedLogin,
        existingCustomer?.username,
        existingCustomer?.email,
    ]);

    for (const authLogin of identifiers) {
        const jwt = await tryJwtLogin(authLogin, password);
        if (jwt) {
            const wpUser = await fetchWPUserWithBearer(jwt.token);
            const wcCustomer = existingCustomer || (jwt.userId || wpUser?.id ? await fetchWCCustomer(jwt.userId || wpUser?.id || 0) : null);
            return loginResponse({ requestedLogin, authLogin, wpUser, wcCustomer, token: jwt.token });
        }
    }

    for (const authLogin of identifiers) {
        const wpUser = await tryBasicAuth(authLogin, password);
        if (wpUser?.id) {
            const wcCustomer = existingCustomer || await fetchWCCustomer(wpUser.id);
            return loginResponse({ requestedLogin, authLogin, wpUser, wcCustomer });
        }
    }

    for (const authLogin of identifiers) {
        const sessionCookie = await tryCookieLogin(authLogin, password);
        if (sessionCookie) {
            const wpUser = await fetchWPUserWithCookie(sessionCookie);
            const storeCustomer = await fetchStoreCustomerWithCookie(sessionCookie);
            const wcCustomer = existingCustomer || (wpUser?.id ? await fetchWCCustomer(wpUser.id) : null);

            return loginResponse({
                requestedLogin,
                authLogin,
                wpUser,
                wcCustomer,
                sessionCookie,
                billing: storeCustomer.billing,
                shipping: storeCustomer.shipping,
            });
        }
    }

    if (existingCustomer) {
        return NextResponse.json(
            { error: 'Password is incorrect. Please try again or reset your password.' },
            { status: 401 }
        );
    }

    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
}
