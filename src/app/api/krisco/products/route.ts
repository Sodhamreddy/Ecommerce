export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchKriscoProducts } from '@/lib/krisco';

/**
 * GET /api/krisco/products/?search=&brand=&limit=&offset=
 *
 * Thin server-side proxy to the Krisco catalog. The Client ID / Secret live in
 * server env vars and are applied inside fetchKriscoProducts — they never reach
 * the browser. Used by the Krisco catalog page for search + "load more".
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const result = await fetchKriscoProducts({
        search: searchParams.get('search') || undefined,
        brand: searchParams.get('brand') || undefined,
        sku: searchParams.get('sku') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
    });

    return NextResponse.json(result, {
        status: result.error ? 502 : 200,
        headers: { 'Cache-Control': 'no-store' },
    });
}
