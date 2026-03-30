/**
 * WooCommerce Store API Integration
 * All cart/checkout calls go through Next.js API routes to avoid CORS issues.
 * Product data is fetched directly from WC Store API (public, CORS-allowed).
 */

// WC Store API nonce — required for all cart mutation POST requests
let _wcNonce: string | null = null;
function setNonce(v: string | null) { if (typeof window !== 'undefined') _wcNonce = v; }
function nonceHeaders(): Record<string, string> { return _wcNonce ? { 'Nonce': _wcNonce } : {}; }

const getApiUrl = (path: string, params: Record<string, string | number> = {}) => {
    const isServer = typeof window === 'undefined';
    const isProd = process.env.NODE_ENV === 'production';
    let baseUrl = `https://jerseyperfume.com/wp-json/${path}`;
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => query.append(key, val.toString()));
    const queryString = query.toString();
    const finalAbsoluteUrl = baseUrl + (queryString ? `?${queryString}` : '');
    if (isServer) return finalAbsoluteUrl;
    if (isProd) return `/proxy.php?path=${path}&${queryString}`;
    return `/api/proxy?path=${path}&${queryString}`;
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
    try {
        const url = getApiUrl('wc/store/v1/cart');
        const response = await fetch(url);
        // Capture nonce for subsequent mutation requests
        const nonce = response.headers.get('Nonce') || response.headers.get('nonce');
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
        const url = getApiUrl('wc/store/v1/cart/add-item');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...nonceHeaders() },
            body: JSON.stringify({ id: productId, quantity }),
        });
        const nonce = response.headers.get('Nonce') || response.headers.get('nonce');
        if (nonce) setNonce(nonce);
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
        const url = getApiUrl('wc/store/v1/cart/update-item');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...nonceHeaders() },
            body: JSON.stringify({ key: itemKey, quantity }),
        });
        const nonce = response.headers.get('Nonce') || response.headers.get('nonce');
        if (nonce) setNonce(nonce);
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
        const url = getApiUrl('wc/store/v1/cart/remove-item');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...nonceHeaders() },
            body: JSON.stringify({ key: itemKey }),
        });
        const nonce = response.headers.get('Nonce') || response.headers.get('nonce');
        if (nonce) setNonce(nonce);
        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}

/**
 * Apply coupon to WooCommerce cart
 */
export async function applyCoupon(code: string): Promise<WCCart | null> {
    try {
        const url = getApiUrl('wc/store/v1/cart/apply-coupon');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...nonceHeaders() },
            body: JSON.stringify({ code }),
        });
        const nonce = response.headers.get('Nonce') || response.headers.get('nonce');
        if (nonce) setNonce(nonce);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || err.error || 'Failed to apply coupon');
        }
        return await response.json();
    } catch (e: any) {
        throw new Error(e.message || 'Coupon error');
    }
}

/**
 * Remove coupon from WooCommerce cart via proxy
 */
export async function removeCoupon(code: string): Promise<WCCart | null> {
    try {
        const url = getApiUrl('wc/store/v1/cart/remove-coupon');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...nonceHeaders() },
            body: JSON.stringify({ code }),
        });
        const nonce = response.headers.get('Nonce') || response.headers.get('nonce');
        if (nonce) setNonce(nonce);
        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
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
 * Get available payment gateways via proxy
 */
export async function getPaymentGateways(): Promise<PaymentGateway[]> {
    try {
        const url = getApiUrl('wc/store/v1/checkout/payment-gateways');
        const response = await fetch(url);
        if (!response.ok) return getDefaultGateways();
        const data = await response.json().catch(() => null);
        return (data && Array.isArray(data) && data.length > 0) ? data : getDefaultGateways();
    } catch {
        return getDefaultGateways();
    }
}

function getDefaultGateways(): PaymentGateway[] {
    return [
        { id: 'paypal', title: 'PayPal', description: 'Pay securely via PayPal', order: 1 }
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
 * Submit checkout via local proxy
 */
export async function submitCheckout(checkoutData: CheckoutData): Promise<OrderResult> {
    const url = getApiUrl('wc/store/v1/checkout');
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData),
    });

    const contentType = response.headers.get('content-type');
    let data: any = {};
    
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        await response.text();
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
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
        const response = await fetch(url);
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
        const url = getApiUrl(`wp/v2/posts?slug=${slug}&_embed`);
        const response = await fetch(url);
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
        const url = getApiUrl(`wp/v2/pages?slug=${slug}&_embed`);
        const response = await fetch(url);
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
        const url = getApiUrl('wp/v2/categories?per_page=100');
        const response = await fetch(url);
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
        const url = getApiUrl('wp/v2/tags?per_page=100');
        const response = await fetch(url);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

// ─── WooCommerce Product Categories/Tags (public API) ───

export async function fetchWCProductCategories(): Promise<any[]> {
    try {
        const url = getApiUrl('wc/store/v1/products/categories?per_page=100');
        const response = await fetch(url);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

export async function fetchWCProductTags(): Promise<any[]> {
    try {
        const url = getApiUrl('wc/store/v1/products/tags?per_page=100');
        const response = await fetch(url);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

// ─── On-Sale Products ───

export async function fetchOnSaleProducts(page = 1, perPage = 20): Promise<any> {
    try {
        const url = getApiUrl(`wc/store/v1/products?page=${page}&per_page=${perPage}&on_sale=true`);
        const response = await fetch(url);
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
    const perPage = 100;
    while (true) {
        const { posts } = await fetchWPPosts(page, perPage);
        if (posts.length === 0) break;
        allPosts = [...allPosts, ...posts];
        if (posts.length < perPage) break;
        page++;
    }
    return allPosts;
}

export async function fetchAllWPPages(): Promise<WPPost[]> {
    try {
        const url = getApiUrl('wp/v2/pages', { per_page: 100 });
        const response = await fetch(url);
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
 * Fetch SmartSlider 3 images by scraping the homepage HTML.
 * SmartSlider Free does not expose a REST API, so we parse the rendered HTML
 * to extract background image URLs from the slider section (id="n2-ss-2").
 */
export async function fetchSmartSliderSlides(_sliderId: number = 1): Promise<SlideData[]> {
    try {
        const response = await fetch('https://jerseyperfume.com/', {
            next: { revalidate: 1800 },
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!response.ok) return [];

        const html = await response.text();

        // Locate the SmartSlider section
        const ssStart = html.indexOf('id="n2-ss-2"');
        if (ssStart < 0) return [];
        const ssEnd = html.indexOf('</section>', ssStart);
        const section = html.slice(ssStart, ssEnd > 0 ? ssEnd : ssStart + 40000);

        const slides: SlideData[] = [];

        // Each slide background is wrapped in <div class="n2-ss-slide-background" data-public-id="N">
        const bgBlockRe = /data-public-id="(\d+)"[\s\S]*?n2-ss-slide-background-image[\s\S]*?<img[^>]+>/g;
        let bgMatch: RegExpExecArray | null;
        while ((bgMatch = bgBlockRe.exec(section)) !== null) {
            const imgTag = bgMatch[0];

            // Prefer bv-data-src (lazy-loaded), fall back to src
            const bvSrc = imgTag.match(/bv-data-src="([^"]+)"/)?.[1] ?? '';
            const plainSrc = imgTag.match(/\ssrc="([^"]+)"/)?.[1] ?? '';
            let raw = bvSrc || plainSrc;

            if (!raw || raw.includes('svg+xml')) continue;

            // Strip BV optimizer wrapper: .../al_opt_content/IMAGE/jerseyperfume.com/wp-content/...
            if (raw.includes('al_opt_content/IMAGE/')) {
                raw = raw.replace(/.*al_opt_content\/IMAGE\/jerseyperfume\.com/, 'https://jerseyperfume.com').split('?')[0];
            }
            if (raw.startsWith('//')) raw = 'https:' + raw;

            // Skip thumbnail-sized images (100x, 150x, 300x, etc.)
            if (/\d{2,3}x\d{2,3}\.(jpg|png|webp|jpeg)$/i.test(raw)) continue;

            slides.push({
                bg: raw,
                href: '/shop',
                cta: 'SHOP NOW',
                accent: '#d4a853',
            });
        }

        return slides;
    } catch {
        return [];
    }
}
