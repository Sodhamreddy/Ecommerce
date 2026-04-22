/**
 * WooCommerce Store API Integration
 * All cart/checkout calls go through Next.js API routes to avoid CORS issues.
 * Product data is fetched directly from WC Store API (public, CORS-allowed).
 */

import { API_BASE_URL, SITE_DOMAIN } from './config';
import { fetchWithRetry, delay } from './fetch-utils';

// WC Store API nonce — required for all cart mutation POST requests.
// Restored from sessionStorage on load so page refreshes/navigations don't lose it.
let _wcNonce: string | null =
    typeof window !== 'undefined'
        ? (() => { try { return sessionStorage.getItem('wc_nonce'); } catch { return null; } })()
        : null;

function setNonce(v: string | null) {
    if (typeof window !== 'undefined' && v) {
        _wcNonce = v;
        try { sessionStorage.setItem('wc_nonce', v); } catch {}
    }
}
function clearNonce() {
    _wcNonce = null;
    if (typeof window !== 'undefined') {
        try { sessionStorage.removeItem('wc_nonce'); } catch {}
    }
}
function nonceHeaders(): Record<string, string> {
    return _wcNonce ? { 'Nonce': _wcNonce } : {};
}

/**
 * Ensure a nonce is available before any cart mutation.
 *
 * Custom response headers (X-WC-Store-Api-Nonce) can be stripped by some
 * hosting providers / CDNs before they reach the browser. This function calls
 * a dedicated endpoint that returns the nonce in the JSON body instead,
 * making delivery reliable regardless of server configuration.
 */
async function ensureNonce(): Promise<void> {
    if (_wcNonce) return;
    if (typeof window === 'undefined') return;
    try {
        const isProd = process.env.NODE_ENV === 'production';
        const url = isProd ? '/api/wc/nonce.php' : '/api/wc/nonce';
        const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.nonce) { setNonce(data.nonce); return; }
        }
    } catch (err) {
        console.warn('[Nonce API] Failed to fetch body nonce:', err);
    }
    // Fallback: grab nonce from cart GET response headers
    await getWCCart();
}

/**
 * Execute a POST mutation against the WC Store API through the proxy.
 * Ensures a nonce is present and automatically retries once if the nonce
 * is rejected (HTTP 401) by clearing the stale nonce and fetching a fresh one.
 */
async function doMutation(path: string, body: object): Promise<Response> {
    // Attempt to use existing nonce first to maintain session continuity.
    // If it's missing, ensureNonce will fetch it. If it's stale, the 401/403 catch block will refresh it.
    await ensureNonce();

    const execute = () => {
        const url = mutationUrl(path);
        return fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                ...COMMON_HEADERS, 
                ...nonceHeaders(),
                'Nonce': _wcNonce || '' 
            },
            body: JSON.stringify(body),
            credentials: 'include',
        });
    };

    let response = await execute();

    // Nonce was stale or missing — clear it, fetch a fresh one, and retry once
    // Some configurations return 403 Forbidden for invalid nonces instead of 401.
    if (response.status === 401 || response.status === 403) {
        clearNonce();
        await ensureNonce();
        response = await execute();
    }

    // Always capture any refreshed nonce from the response
    const freshNonce = response.headers.get('x-wc-store-api-nonce') || response.headers.get('nonce');
    if (freshNonce) setNonce(freshNonce);

    return response;
}

/**
 * For production, append the nonce as a URL query parameter (?_nonce=xxx).
 * Hostinger's Nginx strips custom request headers before they reach PHP,
 * but query parameters always pass through intact.
 * In development the Next.js API route reads the nonce from the header directly.
 */
function mutationUrl(path: string): string {
    const base = getApiUrl(path);
    if (typeof window !== 'undefined' && _wcNonce) {
        return base + (base.includes('?') ? '&' : '?') + '_wpnonce=' + encodeURIComponent(_wcNonce);
    }
    return base;
}

const COMMON_HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

const getApiUrl = (path: string, params: Record<string, string | number> = {}) => {
    const isServer = typeof window === 'undefined';
    const isProd = process.env.NODE_ENV === 'production';
    
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => query.append(key, val.toString()));
    const queryString = query.toString();

    if (isServer) {
        // Use ?rest_route= format for server-side calls as well for maximum reliability
        // This avoids 404s caused by local rewrite/security rules blocking "pretty" URLs.
        const cleanPath = '/' + path.replace(/^\//, '');
        const url = new URL(`${SITE_DOMAIN}/index.php`);
        url.searchParams.set('rest_route', cleanPath);
        Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, val.toString()));
        return url.toString();
    }

    if (isProd) {
        // Correct path for production proxy on Hostinger
        return queryString ? `/proxy.php?path=${path}&${queryString}` : `/proxy.php?path=${path}`;
    }

    return queryString ? `/api/proxy?path=${path}&${queryString}` : `/api/proxy?path=${path}`;
};

// ─── Cart Management via local API proxy ───

export interface WCCartItem {
    key: string;
    id: number;
    quantity: number;
    name: string;
    short_description: string;
    images: { id: number; src: string; thumbnail: string; alt: string }[];
    prices: {
        price: string;
        regular_price: string;
        sale_price: string;
        currency_code: string;
        currency_symbol: string;
        currency_minor_unit: number;
    };
    totals: {
        line_subtotal: string;
        line_total: string;
        currency_code: string;
        currency_symbol: string;
        currency_minor_unit: number;
    };
}

export interface WCCart {
    items: WCCartItem[];
    totals: {
        total_items: string;
        total_shipping: string;
        total_tax: string;
        total_price: string;
        total_discount?: string;
        currency_code: string;
        currency_symbol: string;
        currency_minor_unit: number;
    };
    shipping_rates: any[];
    coupons: any[];
    items_count: number;
    needs_shipping: boolean;
}

/**
 * Get current WooCommerce cart via local proxy (avoids CORS)
 */
export async function getWCCart(): Promise<WCCart | null> {
    if (typeof window === 'undefined') return null; // Skip during build/SSR
    try {
        const url = getApiUrl('wc/store/v1/cart');
        const response = await fetchWithRetry(url, { headers: COMMON_HEADERS, credentials: 'include' });
        // Capture nonce for subsequent mutation requests - check common variations
        let nonce = response.headers.get('X-WC-Store-Api-Nonce') || 
                    response.headers.get('Nonce') || 
                    response.headers.get('nonce') ||
                    response.headers.get('x-wc-store-api-nonce');
        
        // Fallback: search all headers for something looking like a nonce
        if (!nonce) {
            response.headers.forEach((val, key) => {
                if (key.toLowerCase().includes('nonce')) nonce = val;
            });
        }

        if (nonce) setNonce(nonce);
        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}

/**
 * Add item to WooCommerce cart via local proxy
 */
export async function addToWCCart(productId: number, quantity: number = 1): Promise<WCCart | null> {
    try {
        const response = await doMutation('wc/store/v1/cart/add-item', { id: productId, quantity });
        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}

/**
 * Update item quantity in WooCommerce cart via local proxy
 */
export async function updateWCCartItem(itemKey: string, quantity: number): Promise<WCCart | null> {
    try {
        const response = await doMutation('wc/store/v1/cart/update-item', { key: itemKey, quantity });
        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}

/**
 * Remove item from WooCommerce cart via local proxy
 */
export async function removeFromWCCart(itemKey: string): Promise<WCCart | null> {
    try {
        const response = await doMutation('wc/store/v1/cart/remove-item', { key: itemKey });
        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}

/** Decode HTML entities returned in WC API error messages */
function decodeHtml(str: string): string {
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

/**
 * Apply coupon to WooCommerce cart
 */
export async function applyCoupon(code: string): Promise<WCCart | null> {
    try {
        const response = await doMutation('wc/store/v1/cart/apply-coupon', { code });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const rawMsg = err.message || err.error || 'Failed to apply coupon';
            throw new Error(decodeHtml(rawMsg));
        }
        return await response.json();
    } catch (e: any) {
        throw new Error(decodeHtml(e.message || 'Coupon error'));
    }
}

/**
 * Update cart customer address so WooCommerce recalculates tax + shipping rates
 */
export async function updateCartCustomer(data: {
    billing_address?: { country?: string; state?: string; postcode?: string; city?: string };
    shipping_address?: { country?: string; state?: string; postcode?: string; city?: string };
}): Promise<WCCart | null> {
    try {
        const response = await doMutation('wc/store/v1/cart/update-customer', data);
        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}

/**
 * Remove coupon from WooCommerce cart via proxy.
 * Forces a fresh nonce so the remove request is never rejected by a stale nonce.
 * Throws on failure so the caller can surface a specific message.
 */
export async function removeCoupon(code: string): Promise<WCCart | null> {
    // Refresh nonce — stale nonce causes silent 401 → null result → "Failed to remove" UI
    clearNonce();
    await ensureNonce();
    try {
        const response = await doMutation('wc/store/v1/cart/remove-coupon', { code });
        if (!response.ok) {
            const ct = response.headers.get('content-type') || '';
            const err = ct.includes('application/json')
                ? await response.json().catch(() => ({}))
                : {};
            throw new Error(decodeHtml(err.message || `Failed to remove coupon (status ${response.status})`));
        }
        return await response.json().catch(() => null);
    } catch (e: any) {
        throw new Error(e.message || 'Failed to remove coupon. Please refresh and try again.');
    }
}

// ─── Payment Gateways ───

export interface PaymentGateway {
    id: string;
    title: string;
    description: string;
    order: number;
}

/**
 * Get available payment gateways via server-side API route (uses WC REST API v3 with consumer keys)
 */
export async function getPaymentGateways(): Promise<PaymentGateway[]> {
    const isServer = typeof window === 'undefined';
    if (isServer) return getDefaultGateways(); // Skip fetch during build/SSR to avoid nonce errors

    try {
        const isProd = process.env.NODE_ENV === 'production';
        const url = isProd ? '/api/wc/payment-gateways.php' : '/api/wc/payment-gateways';
        const response = await fetch(url, { headers: COMMON_HEADERS, cache: 'no-store' });
        if (!response.ok) {
            console.warn(`[Gateways] API returned status ${response.status}`);
            return getDefaultGateways();
        }
        const data = await response.json().catch(() => null);
        return (data && Array.isArray(data) && data.length > 0) ? data : getDefaultGateways();
    } catch (err) {
        console.error('[Gateways] Failed to load:', err);
        return getDefaultGateways();
    }
}

function getDefaultGateways(): PaymentGateway[] {
    return [
        { id: 'ppcp-gateway', title: 'PayPal', description: 'Pay securely via PayPal.', order: 0 },
        { id: 'ppcp-credit-card-gateway', title: 'Debit & Credit Cards', description: 'Pay with your credit card.', order: 1 }
    ];
}

// ─── Checkout ───

export interface CheckoutData {
    billing_address: {
        first_name: string;
        last_name: string;
        company?: string;
        address_1: string;
        address_2?: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
        email: string;
        phone: string;
    };
    shipping_address: {
        first_name: string;
        last_name: string;
        company?: string;
        address_1: string;
        address_2?: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
        phone?: string;
    };
    payment_method: string;
    customer_note?: string;
    create_account?: boolean;
    payment_data?: { key: string; value: string }[];
}

export interface OrderResult {
    order_id: number;
    status: string;
    order_key: string;
    customer_id: number;
    billing_address: any;
    shipping_address: any;
    payment_method: string;
    payment_result: {
        payment_status: string;
        payment_details: any[];
        redirect_url: string;
    };
    totals: any;
}

/**
 * Submit checkout via local proxy.
 * Always forces a fresh nonce before submission so the nonce + session cookie
 * are guaranteed to match (stale nonces cause silent 401/404 failures).
 */
export async function submitCheckout(checkoutData: CheckoutData): Promise<OrderResult> {
    // Force a fresh nonce — the cached nonce may be tied to an older session
    clearNonce();
    await ensureNonce();

    const response = await doMutation('wc/store/v1/checkout', checkoutData);

    const contentType = response.headers.get('content-type') || '';
    let data: any = {};

    if (contentType.includes('application/json')) {
        data = await response.json().catch(() => ({}));
    } else {
        // Non-JSON (e.g. WordPress 404 HTML) — surface a friendly message
        const text = await response.text();
        console.error('[Checkout] Non-JSON response', response.status, text.substring(0, 300));
        
        // Extract a snippet for debugging in the UI banner if the user is stuck
        const snippet = text.substring(0, 80).replace(/<[^>]*>?/gm, '').trim();
        
        if (response.status === 404) {
            throw new Error(`Checkout is temporarily unavailable (Status 404). ${snippet ? 'Snippet: ' + snippet : ''} Please refresh the page and try again.`);
        }
        throw new Error(`Checkout failed (Status ${response.status}). ${snippet || 'Server returned invalid format'}. Please try again.`);
    }

    if (!response.ok) {
        const errMsg = data.message || data.error || 'Checkout failed. Please try again.';
        throw new Error(decodeHtml(errMsg));
    }

    return data;
}

// ─── WordPress Content (Posts, Pages, SEO, tags, categories) ───
// These use the public WP REST API which allows CORS

export interface WPPost {
    id: number;
    date: string;
    slug: string;
    title: { rendered: string };
    content: { rendered: string };
    excerpt: { rendered: string };
    featured_media: number;
    categories: number[];
    tags: number[];
    _embedded?: {
        'wp:featuredmedia'?: { source_url: string; alt_text: string }[];
        'wp:term'?: { id: number; name: string; slug: string; taxonomy: string }[][];
    };
    yoast_head_json?: {
        title?: string;
        description?: string;
        og_title?: string;
        og_description?: string;
        og_image?: { url: string }[];
        canonical?: string;
    };
}

/**
 * Fetch WordPress posts with SEO data, categories, tags, featured images
 */
export async function fetchWPPosts(
    page: number = 1,
    perPage: number = 10,
    category?: number,
    tag?: number,
    search?: string,
): Promise<{ posts: WPPost[]; totalPages: number; total: number }> {
    try {
        const path = `wp/v2/posts`;
        const params: any = { _embed: '1', page, per_page: perPage };
        if (category) params.categories = category;
        if (tag) params.tags = tag;
        if (search) params.search = search;
        
        const url = getApiUrl(path, params);
        const response = await fetchWithRetry(url, { headers: COMMON_HEADERS });
        if (!response.ok) return { posts: [], totalPages: 0, total: 0 };

        const total = parseInt(response.headers.get('X-WP-Total') || '0');
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0');
        const posts = await response.json();
        return { posts, totalPages, total };
    } catch {
        return { posts: [], totalPages: 0, total: 0 };
    }
}

/**
 * Fetch a single WordPress post by slug
 */
export async function fetchWPPostBySlug(slug: string): Promise<WPPost | null> {
    try {
        const url = getApiUrl('wp/v2/posts', { slug, _embed: '1' });
        const response = await fetchWithRetry(url, { headers: COMMON_HEADERS });
        if (!response.ok) return null;
        const posts = await response.json();
        return posts[0] || null;
    } catch {
        return null;
    }
}

/**
 * Fetch WordPress pages
 */
export async function fetchWPPage(slug: string): Promise<WPPost | null> {
    try {
        const url = getApiUrl('wp/v2/pages', { slug, _embed: '1' });
        const response = await fetchWithRetry(url, { headers: COMMON_HEADERS });
        if (!response.ok) return null;
        const pages = await response.json();
        return pages[0] || null;
    } catch {
        return null;
    }
}

/**
 * Fetch WordPress categories
 */
export async function fetchWPCategories(): Promise<any[]> {
    try {
        const url = getApiUrl('wp/v2/categories', { per_page: 100 });
        const response = await fetchWithRetry(url, { headers: COMMON_HEADERS });
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

/**
 * Fetch WordPress tags
 */
export async function fetchWPTags(): Promise<any[]> {
    try {
        const url = getApiUrl('wp/v2/tags', { per_page: 100 });
        const response = await fetchWithRetry(url, { headers: COMMON_HEADERS });
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

// ─── WooCommerce Product Categories/Tags (public API) ───

export async function fetchWCProductCategories(): Promise<any[]> {
    try {
        const url = getApiUrl('wc/store/v1/products/categories', { per_page: 100 });
        const response = await fetchWithRetry(url, { headers: COMMON_HEADERS });
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

export async function fetchWCProductTags(): Promise<any[]> {
    try {
        const url = getApiUrl('wc/store/v1/products/tags', { per_page: 100 });
        const response = await fetchWithRetry(url, { headers: COMMON_HEADERS });
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

// ─── On-Sale Products ───

export async function fetchOnSaleProducts(page = 1, perPage = 20): Promise<any> {
    try {
        const url = getApiUrl('wc/store/v1/products', { page, per_page: perPage, on_sale: 'true' });
        const response = await fetchWithRetry(url, { headers: COMMON_HEADERS });
        if (!response.ok) return { products: [], totalPages: 0, totalProducts: 0 };
        const totalProducts = parseInt(response.headers.get('X-WP-Total') || '0');
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0');
        const products = await response.json();
        return { products, totalPages, totalProducts };
    } catch {
        return { products: [], totalPages: 0, totalProducts: 0 };
    }
}

export async function fetchAllWPPosts(): Promise<WPPost[]> {
    let allPosts: WPPost[] = [];
    let page = 1;
    const perPage = 50;
    while (true) {
        const { posts } = await fetchWPPosts(page, perPage);
        if (posts.length === 0) break;
        allPosts = [...allPosts, ...posts];
        if (posts.length < perPage) break;
        page++;
        await delay(200);
    }
    return allPosts;
}

export async function fetchAllWPPages(): Promise<WPPost[]> {
    try {
        const url = getApiUrl('wp/v2/pages', { per_page: 100 });
        const response = await fetch(url, { headers: COMMON_HEADERS });
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

// ─── SmartSlider 3 Integration ───

export interface SlideData {
    bg: string;
    href: string;
    title?: string;
    subtitle?: string;
    cta?: string;
    accent?: string;
}

/**
 * Returns the homepage hero slider images.
 * URLs are sourced directly from the WordPress media library.
 * Update this list whenever the SmartSlider is updated on WordPress.
 */
export async function fetchSmartSliderSlides(_sliderId: number = 1): Promise<SlideData[]> {
    try {
        return [
            { bg: `${SITE_DOMAIN}/wp-content/uploads/2026/04/Mothers-Day-Banner-3-1.png`, href: '/product-category/womens-fragrances', cta: 'SHOP WOMEN\'S', accent: '#d4a853' },
            { bg: `${SITE_DOMAIN}/wp-content/uploads/2026/02/Jersey-Banner-8-2-1.png`,    href: '/shop?search=soprano+ice', cta: 'SHOP NOW', accent: '#d4a853' },
            { bg: `${SITE_DOMAIN}/wp-content/uploads/2025/11/Jersey-Banner-7.png`,         href: '/shop', cta: 'SHOP NOW', accent: '#d4a853' },
            { bg: `${SITE_DOMAIN}/wp-content/uploads/2026/01/Jersey-Banner-23-01.png`,     href: '/shop?search=dumont', cta: 'SHOP DUMONT', accent: '#d4a853' },
            { bg: `${SITE_DOMAIN}/wp-content/uploads/2026/01/Jersey-banner-23-01-03.png`,  href: '/shop?search=christian+siriano', cta: 'SHOP NOW', accent: '#d4a853' },
            { bg: `${SITE_DOMAIN}/wp-content/uploads/2026/01/Tumi-Product-Banner.png`,     href: '/shop?search=tumi', cta: 'SHOP TUMI', accent: '#d4a853' },
        ];
    } catch {
        return [];
    }
}
