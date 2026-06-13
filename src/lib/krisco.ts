/**
 * Krisco Sales LLC Developer API client (SERVER-ONLY).
 *
 * Authenticates with the Client ID / Client Secret via the X-API-Key /
 * X-API-Secret headers (Method 1 in the developer docs). These credentials are
 * read from server environment variables and must NEVER be sent to the browser,
 * so every call here runs on the server (lib helper + /api/krisco/* route).
 *
 * SANDBOX credentials are a 30-day trial for testing only — not for live orders.
 *
 * Live sandbox response shape (verified against the API, differs from the docs):
 *   { "data": [ {sku, description, brand, classification, msrp, unit_price, stock, image, ...} ],
 *     "pagination": { total, limit, offset, has_more } }
 */

// Trim + strip trailing slash: dashboard-pasted values often carry stray
// whitespace, and the secret/path are case- and character-exact.
const API_BASE = (process.env.KRISCO_API_BASE || 'https://api.kriscosalesllc.com/api/v1').trim().replace(/\/+$/, '');
const CLIENT_ID = (process.env.KRISCO_CLIENT_ID || '').trim();
const CLIENT_SECRET = (process.env.KRISCO_CLIENT_SECRET || '').trim();

/** A single catalog product as returned by /catalog/products/. */
export interface KriscoProduct {
    sku: string;
    description: string;          // full product name/description (no separate `name` field)
    brand: string | null;
    upc?: string | null;
    classification: string | null; // acts as the category
    msrp: number | null;
    unit_price: number | null;
    is_net_price?: boolean;
    stock: number | null;
    location?: string | null;
    image: string | null;
    is_active?: boolean;
    created_at?: string;
}

export interface KriscoProductsResult {
    products: KriscoProduct[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    error?: string;
}

export interface KriscoQuery {
    search?: string;
    brand?: string;
    sku?: string;
    limit?: number;
    offset?: number;
}

function authHeaders(): Record<string, string> {
    return {
        'X-API-Key': CLIENT_ID,
        'X-API-Secret': CLIENT_SECRET,
        // Aliases documented by Krisco — sent for robustness, harmless if ignored.
        'X-Client-ID': CLIENT_ID,
        'X-Client-Secret': CLIENT_SECRET,
        Accept: 'application/json',
    };
}

const empty = (overrides: Partial<KriscoProductsResult> = {}): KriscoProductsResult => ({
    products: [],
    total: 0,
    limit: 0,
    offset: 0,
    hasMore: false,
    ...overrides,
});

/**
 * Fetch a page of products from the Krisco catalog.
 * Never throws — returns an empty result with an `error` field on failure so
 * the page/route can render a friendly message instead of crashing.
 */
export async function fetchKriscoProducts(query: KriscoQuery = {}): Promise<KriscoProductsResult> {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return empty({ error: 'Krisco API credentials are not configured on the server.' });
    }

    const limit = Math.min(Math.max(query.limit ?? 24, 1), 200);
    const offset = Math.max(query.offset ?? 0, 0);

    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (query.search) params.set('search', query.search);
    if (query.brand) params.set('brand', query.brand);
    if (query.sku) params.set('sku', query.sku);

    const url = `${API_BASE}/catalog/products/?${params.toString()}`;

    try {
        const res = await fetch(url, {
            headers: authHeaders(),
            // Catalog/stock changes over time; keep it reasonably fresh.
            next: { revalidate: 300 },
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            return empty({
                limit,
                offset,
                error: `Krisco API returned ${res.status}. ${text.slice(0, 200)}`,
            });
        }

        const json: unknown = await res.json().catch(() => null);
        const data = (json as { data?: KriscoProduct[] })?.data ?? [];
        const pg = (json as { pagination?: { total?: number; limit?: number; offset?: number; has_more?: boolean } })?.pagination;

        return {
            products: Array.isArray(data) ? data : [],
            total: pg?.total ?? data.length,
            limit: pg?.limit ?? limit,
            offset: pg?.offset ?? offset,
            hasMore: pg?.has_more ?? false,
        };
    } catch (err) {
        return empty({
            limit,
            offset,
            error: `Failed to reach Krisco API: ${(err as Error).message}`,
        });
    }
}
