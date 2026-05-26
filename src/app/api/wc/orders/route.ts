export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

const ckKey = process.env.WC_CONSUMER_KEY;
const ckSecret = process.env.WC_CONSUMER_SECRET;

async function fetchOrders(params: URLSearchParams) {
    if (!ckKey || !ckSecret) {
        throw new Error('WooCommerce API credentials are missing.');
    }

    params.set('consumer_key', ckKey);
    params.set('consumer_secret', ckSecret);

    const res = await fetch(`${API_BASE_URL}/wc/v3/orders?${params.toString()}`, {
        cache: 'no-store',
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
        throw new Error((data as any)?.message || 'Failed to load orders.');
    }
    return Array.isArray(data) ? data : [];
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const customer = url.searchParams.get('customer') || '';
        const email = url.searchParams.get('email') || '';

        const baseParams = new URLSearchParams({
            per_page: '20',
            orderby: 'date',
            order: 'desc',
        });

        let orders: any[] = [];
        if (customer && customer !== '0') {
            const params = new URLSearchParams(baseParams);
            params.set('customer', customer);
            orders = await fetchOrders(params);
        }

        if (orders.length === 0 && email) {
            const params = new URLSearchParams(baseParams);
            params.set('search', email);
            orders = (await fetchOrders(params)).filter((order: any) =>
                String(order?.billing?.email || '').toLowerCase() === email.toLowerCase()
            );
        }

        return NextResponse.json(orders);
    } catch (err) {
        console.error('[WC Orders]', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to load orders.' }, { status: 500 });
    }
}
