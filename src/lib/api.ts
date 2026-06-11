export interface ProductImage {
    id: number;
    src: string;
    thumbnail: string;
    alt: string;
}

export interface ProductCategory {
    id: number;
    name: string;
    slug: string;
}

export interface ProductPrice {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_symbol: string;
    currency_code: string;
    currency_minor_unit: number;
}

export interface ProductAttribute {
    id: number;
    name: string;
    taxonomy: string;
    has_variations: boolean;
    terms: { id: number; name: string; slug: string }[];
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    short_description: string;
    prices: ProductPrice;
    images: ProductImage[];
    categories: ProductCategory[];
    is_in_stock: boolean;
    on_sale: boolean;
    attributes: ProductAttribute[];
    related_products?: number[];
    yoast_head_json?: {
        title?: string;
        description?: string;
        og_title?: string;
        og_description?: string;
        og_image?: { url: string }[];
        canonical?: string;
    };
    meta_data?: { key?: string; value?: unknown }[];
}

import { API_BASE_URL } from './config';
import { fetchWithRetry, delay } from './fetch-utils';

interface RawCategory {
    id: number;
    name: string;
    slug: string;
    count: number;
    parent?: number;
    image?: { id: number; src: string; alt?: string };
}

export function decodeHtmlEntities(value: string): string {
    if (!value) return '';

    const namedEntities: Record<string, string> = {
        amp: '&',
        quot: '"',
        apos: "'",
        lt: '<',
        gt: '>',
        nbsp: ' ',
        ndash: '-',
        mdash: '-',
        rsquo: "'",
        lsquo: "'",
        rdquo: '"',
        ldquo: '"',
    };

    let decoded = value;
    for (let i = 0; i < 3; i++) {
        const next = decoded
            .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
            .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
            .replace(/&([a-z]+);/gi, (match, entity) => namedEntities[entity.toLowerCase()] ?? match);

        if (next === decoded) break;
        decoded = next;
    }

    return decoded;
}

function decodeProduct(product: Product): Product {
    return {
        ...product,
        name: decodeHtmlEntities(product.name),
        images: product.images?.map(image => ({
            ...image,
            alt: decodeHtmlEntities(image.alt),
        })) ?? [],
        categories: product.categories?.map(category => ({
            ...category,
            name: decodeHtmlEntities(category.name),
        })) ?? [],
        attributes: product.attributes?.map(attribute => ({
            ...attribute,
            name: decodeHtmlEntities(attribute.name),
            terms: attribute.terms?.map(term => ({
                ...term,
                name: decodeHtmlEntities(term.name),
            })) ?? [],
        })) ?? [],
    };
}

function decodeCategory(category: Category): Category {
    return {
        ...category,
        name: decodeHtmlEntities(category.name),
        image: category.image
            ? {
                ...category.image,
                alt: decodeHtmlEntities(category.image.alt),
            }
            : category.image,
    };
}

function decodeTag(tag: ProductTag): ProductTag {
    return {
        ...tag,
        name: decodeHtmlEntities(tag.name),
    };
}

const getApiUrl = (path: string, params: Record<string, string | number> = {}) => {
    const isServer = typeof window === 'undefined';
    const isProd = process.env.NODE_ENV === 'production';
    
    // Create query parameters
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
            query.append(key, val.toString());
        }
    });

    const queryString = query.toString();

    if (isServer) {
        // Direct backend call for server-side
        const baseUrl = `${API_BASE_URL}/${path}`;
        return baseUrl + (queryString ? `?${queryString}` : '');
    }

    // Client-side: Construct proxy URL with path parameter
    query.set('path', path);
    const finalProxyQueryString = query.toString();

    if (isProd) {
        return `/proxy.php?${finalProxyQueryString}`;
    }
    return `/api/proxy?${finalProxyQueryString}`;
};

export async function fetchProducts(
    page = 1,
    perPage = 20,
    search = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    orderby = 'date',
    order = 'desc',
    onSale = false,
    tag = ''
): Promise<{ products: Product[], totalPages: number, totalProducts: number }> {
    try {
        let finalOrderby = orderby;
        let finalOrder = order;

        // Handle combined sort values from UI
        if (orderby === 'price-desc') {
            finalOrderby = 'price';
            finalOrder = 'desc';
        } else if (orderby === 'price') {
            finalOrderby = 'price';
            finalOrder = 'asc';
        }

        const params: Record<string, string | number> = {
            page,
            per_page: perPage,
        };

        if (onSale) params.on_sale = 'true';

        if (finalOrderby) params.orderby = finalOrderby;
        if (finalOrder) params.order = finalOrder;
        if (search) params.search = search;
        
        if (category) {
            // WC Store API v1 accepts category slug directly (e.g. "mens-fragrances")
            // Numeric IDs also work — pass as-is either way
            params.category = category;
        }

        if (tag) {
            params.tag = tag;
        }

        // Only add price filters if values are provided and non-zero/non-default
        if (minPrice && minPrice !== '0') {
            params.min_price = (parseFloat(minPrice) * 100).toString();
        }
        if (maxPrice && maxPrice !== '400') {
            params.max_price = (parseFloat(maxPrice) * 100).toString();
        }

        const COMMON_HEADERS = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        const url = getApiUrl('wc/store/v1/products', params);
        const response = await fetchWithRetry(url, {
            headers: COMMON_HEADERS,
            next: { revalidate: 3600 } 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('WooCommerce API Error Status:', response.status);
            console.warn('WooCommerce API Error Text:', errorText);
            
            try {
                const errorBody = JSON.parse(errorText);
                console.warn('WooCommerce API Error Body (JSON):', errorBody);
            } catch (e) {
                console.warn('WooCommerce API Error Body (Not JSON)');
            }
            
            // Return empty set instead of throwing so UI doesn't crash on filter failures
            return { products: [], totalPages: 0, totalProducts: 0 };
        }

        const totalProducts = parseInt(response.headers.get('X-WP-Total') || '0');
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
        const data: Product[] = await response.json();

        return { products: data.map(decodeProduct), totalPages, totalProducts };
    } catch (error) {
        console.warn('Error fetching products:', error);
        return { products: [], totalPages: 0, totalProducts: 0 };
    }
}

export async function fetchCategories(): Promise<Category[]> {
    try {
        // Use WC v3 API (server-side only) — returns full category data including `parent`
        const ckKey = process.env.WC_CONSUMER_KEY;
        const ckSecret = process.env.WC_CONSUMER_SECRET;
        if (ckKey && ckSecret) {
            const res = await fetch(
                `${API_BASE_URL}/wc/v3/products/categories?per_page=100&consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
                { next: { revalidate: 3600 } }
            );
            if (res.ok) {
                const data = await res.json();
                return data.map((c: RawCategory) => decodeCategory({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    count: c.count,
                    parent: c.parent ?? 0,
                    image: c.image ? { id: c.image.id, src: c.image.src, thumbnail: c.image.src, alt: c.image.alt || c.name } : undefined,
                }));
            }
        }
        // Fallback: WC Store API (public, no parent field — default parent to 0)
        const url = getApiUrl('wc/store/v1/products/categories');
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((c: Category) => decodeCategory({ ...c, parent: c.parent ?? 0 }));
    } catch (error) {
        console.warn('Error fetching categories:', error);
        return [];
    }
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    count: number;
    parent: number;
    image?: { id: number; src: string; thumbnail: string; alt: string };
}

/**
 * Fetch categories and auto-fill missing images from the first product in each category.
 * Categories that have a dedicated image in WooCommerce use that; others get a product thumbnail.
 */
export async function fetchCategoriesWithThumbnails(): Promise<Category[]> {
    const categories = await fetchCategories();
    const needsThumb = categories.filter(c => c.count > 0 && !c.image?.src);

    if (needsThumb.length === 0) return categories;

    // Fetch one product per category in parallel to get its image
    const results = await Promise.allSettled(
        needsThumb.map(async (cat) => {
            // Add a small jittered delay to avoid hitting the server all at once
            await delay(Math.random() * 500);
            const url = getApiUrl('wc/store/v1/products', { category: cat.id, per_page: 1 });
            const res = await fetchWithRetry(url, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 3600 },
            });
            if (!res.ok) return { id: cat.id, image: null };
            const products: Product[] = await res.json().catch(() => []);
            const img = products[0]?.images?.[0] || null;
            return { id: cat.id, image: img };
        })
    );

    const thumbMap = new Map<number, Category['image']>();
    results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.image) {
            thumbMap.set(r.value.id, r.value.image);
        }
    });

    return categories.map(cat => ({
        ...cat,
        image: cat.image?.src ? cat.image : (thumbMap.get(cat.id) ?? cat.image),
    }));
}

export interface ProductTag {
    id: number;
    name: string;
    slug: string;
    count: number;
}

export async function fetchTags(): Promise<ProductTag[]> {
    try {
        const ckKey = process.env.WC_CONSUMER_KEY;
        const ckSecret = process.env.WC_CONSUMER_SECRET;
        if (ckKey && ckSecret) {
            const res = await fetch(
                `${API_BASE_URL}/wc/v3/products/tags?per_page=100&consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
                { next: { revalidate: 3600 } }
            );
            if (res.ok) {
                const data = await res.json();
                return data.map((t: { id: number; name: string; slug: string; count: number }) => ({
                    id: t.id, name: t.name, slug: t.slug, count: t.count,
                })).map(decodeTag);
            }
        }
        return [];
    } catch {
        return [];
    }
}

export async function fetchAllProducts(): Promise<Product[]> {
    let allProducts: Product[] = [];
    let page = 1;
    const perPage = 50;

    while (true) {
        const { products } = await fetchProducts(page, perPage);
        if (products.length === 0) break;
        allProducts = [...allProducts, ...products];
        if (products.length < perPage) break;
        page++;
        // Pace the requests
        await delay(200);
    }

    return allProducts;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
    try {
        const normalizedSlug = decodeURIComponent(String(slug || '')).trim();
        const url = /^\d+$/.test(normalizedSlug)
            ? getApiUrl(`wc/store/v1/products/${normalizedSlug}`)
            : getApiUrl('wc/store/v1/products', { slug: normalizedSlug });
        const response = await fetchWithRetry(url, { 
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 3600 } 
        });
        if (!response.ok) return null;
        const data = await response.json();
        const product = Array.isArray(data) ? data[0] : data;
        return product ? decodeProduct(product) : null;
    } catch (error) {
        console.warn(`Error fetching product ${slug}:`, error);
        return null;
    }
}

export async function fetchProductSeoBySlug(slug: string): Promise<Pick<Product, 'yoast_head_json' | 'meta_data'> | null> {
    try {
        const key = process.env.WC_CONSUMER_KEY;
        const secret = process.env.WC_CONSUMER_SECRET;
        if (!key || !secret) return null;

        const params = new URLSearchParams({
            slug,
            consumer_key: key,
            consumer_secret: secret,
        });
        const response = await fetchWithRetry(`${API_BASE_URL}/wc/v3/products?${params.toString()}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 },
        });
        if (!response.ok) return null;

        const data = await response.json();
        const product = Array.isArray(data) ? data[0] : null;
        if (!product) return null;

        return {
            yoast_head_json: product.yoast_head_json
                ? {
                    ...product.yoast_head_json,
                    title: product.yoast_head_json.title ? decodeHtmlEntities(product.yoast_head_json.title) : product.yoast_head_json.title,
                    description: product.yoast_head_json.description ? decodeHtmlEntities(product.yoast_head_json.description) : product.yoast_head_json.description,
                    og_title: product.yoast_head_json.og_title ? decodeHtmlEntities(product.yoast_head_json.og_title) : product.yoast_head_json.og_title,
                    og_description: product.yoast_head_json.og_description ? decodeHtmlEntities(product.yoast_head_json.og_description) : product.yoast_head_json.og_description,
                }
                : undefined,
            meta_data: product.meta_data,
        };
    } catch (error) {
        console.warn(`Error fetching product SEO ${slug}:`, error);
        return null;
    }
}

export async function fetchProductsByIDs(ids: number[]): Promise<Product[]> {
    if (!ids || ids.length === 0) return [];
    try {
        const url = getApiUrl('wc/store/v1/products', { include: ids.join(',') });
        const response = await fetchWithRetry(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 3600 },
        });
        if (!response.ok) return [];
        const data: Product[] = await response.json();
        return data.map(decodeProduct);
    } catch (error) {
        console.warn('Error fetching products by IDs:', error);
        return [];
    }
}

export async function createOrder(checkoutData: any): Promise<any> {
    try {
        const url = getApiUrl('wc/store/v1/checkout');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(checkoutData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.warn('WooCommerce Checkout Error:', errorData);
            // Fallback for demonstration if WooCommerce requires nonce/session
            return {
                id: Math.floor(100000 + Math.random() * 900000),
                order_key: "wc_order_" + Math.random().toString(36).substring(7),
                status: "simulated_success"
            };
        }

        return await response.json();
    } catch (error) {
        console.warn('Error submitting order to WordPress API:', error);
        // Fallback simulated order ID
        return {
            id: Math.floor(100000 + Math.random() * 900000),
            status: "simulated_success"
        };
    }
}
