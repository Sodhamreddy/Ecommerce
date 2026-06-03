export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

const ckKey = process.env.WC_CONSUMER_KEY;
const ckSecret = process.env.WC_CONSUMER_SECRET;

type WCOrder = {
    id?: number;
    status?: string;
    total?: string;
    customer_id?: number;
    customer_note?: string;
    date_created?: string;
    date_created_gmt?: string;
    billing?: { email?: string };
    refunds?: unknown[];
    meta_data?: { key?: string; value?: unknown }[];
    actions?: ReturnType<typeof getActionState>;
    [key: string]: unknown;
};

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
        throw new Error(typeof data === 'object' && data && 'message' in data ? String(data.message) : 'Failed to load orders.');
    }
    return Array.isArray(data) ? data as WCOrder[] : [];
}

async function wcRequest(path: string, method: 'GET' | 'POST' | 'PUT', body?: unknown) {
    if (!ckKey || !ckSecret) {
        throw new Error('WooCommerce API credentials are missing.');
    }

    const credentials = Buffer.from(`${ckKey}:${ckSecret}`).toString('base64');
    const res = await fetch(`${API_BASE_URL}/wc/v3/${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(typeof data === 'object' && data && 'message' in data ? String(data.message) : 'WooCommerce order request failed.');
    }
    return data;
}

async function fetchOrder(id: string) {
    if (!ckKey || !ckSecret) {
        throw new Error('WooCommerce API credentials are missing.');
    }

    const params = new URLSearchParams({
        consumer_key: ckKey,
        consumer_secret: ckSecret,
    });

    const res = await fetch(`${API_BASE_URL}/wc/v3/orders/${id}?${params.toString()}`, {
        cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(typeof data === 'object' && data && 'message' in data ? String(data.message) : 'Failed to load order.');
    }
    return data as WCOrder;
}

function getActionState(order: WCOrder) {
    const createdAt = new Date(order?.date_created_gmt ? `${order.date_created_gmt}Z` : order?.date_created || '');
    const ageMs = Number.isFinite(createdAt.getTime()) ? Date.now() - createdAt.getTime() : Number.POSITIVE_INFINITY;
    const withinCancelWindow = ageMs >= 0 && ageMs <= 60 * 60 * 1000;
    const status = String(order?.status || '').toLowerCase();
    const cancelableStatuses = ['pending', 'processing', 'on-hold'];
    const refundableStatuses = ['cancelled', 'canceled'];
    const alreadyRefunded = status === 'refunded' || (Array.isArray(order?.refunds) && order.refunds.length > 0);

    return {
        can_cancel: withinCancelWindow && cancelableStatuses.includes(status),
        can_refund: refundableStatuses.includes(status) && !alreadyRefunded,
        cancel_disabled_reason: withinCancelWindow
            ? ''
            : 'Cancellation is available only within 1 hour of placing the order.',
        refund_disabled_reason: alreadyRefunded
            ? 'Refund has already been requested.'
            : 'Refund is available after the order is cancelled.',
    };
}

function withActions<T extends WCOrder>(order: T): T & { actions: ReturnType<typeof getActionState> } {
    return { ...order, actions: getActionState(order) };
}

function ordersWithActions(orders: WCOrder[]) {
    return orders.map((order) => withActions(order));
}

function canAccessOrder(order: WCOrder, customer: string, email: string) {
    const orderCustomer = String(order?.customer_id || '');
    const orderEmail = String(order?.billing?.email || '').toLowerCase();
    const allowedByCustomer = customer && customer !== '0' && orderCustomer === customer;
    const allowedByEmail = email && orderEmail === email.toLowerCase();
    return allowedByCustomer || allowedByEmail;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id') || '';
        const customer = url.searchParams.get('customer') || '';
        const email = url.searchParams.get('email') || '';

        if (id) {
            const order = await fetchOrder(id);
            if (!canAccessOrder(order, customer, email)) {
                return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
            }

            return NextResponse.json(withActions(order));
        }

        const baseParams = new URLSearchParams({
            per_page: '20',
            orderby: 'date',
            order: 'desc',
        });

        let orders: WCOrder[] = [];
        if (customer && customer !== '0') {
            const params = new URLSearchParams(baseParams);
            params.set('customer', customer);
            orders = await fetchOrders(params);
        }

        if (orders.length === 0 && email) {
            const params = new URLSearchParams(baseParams);
            params.set('search', email);
            orders = (await fetchOrders(params)).filter((order) =>
                String(order?.billing?.email || '').toLowerCase() === email.toLowerCase()
            );
        }

        return NextResponse.json(ordersWithActions(orders));
    } catch (err) {
        console.error('[WC Orders]', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to load orders.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const id = String(body?.id || '');
        const customer = String(body?.customer || '');
        const email = String(body?.email || '');
        const action = String(body?.action || '');

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing order action.' }, { status: 400 });
        }

        const order = await fetchOrder(id);
        if (!canAccessOrder(order, customer, email)) {
            return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
        }

        const actions = getActionState(order);
        if (action === 'cancel') {
            if (!actions.can_cancel) {
                return NextResponse.json({ error: actions.cancel_disabled_reason || 'This order cannot be cancelled.' }, { status: 400 });
            }
            const updated = await wcRequest(`orders/${id}`, 'PUT', {
                status: 'cancelled',
                customer_note: order.customer_note || '',
                meta_data: [
                    ...(Array.isArray(order.meta_data) ? order.meta_data : []),
                    { key: '_headless_cancelled_at', value: new Date().toISOString() },
                ],
            });
            return NextResponse.json(withActions(updated as WCOrder));
        }

        if (action === 'refund') {
            if (!actions.can_refund) {
                return NextResponse.json({ error: actions.refund_disabled_reason || 'Refund is not available for this order.' }, { status: 400 });
            }

            await wcRequest(`orders/${id}/refunds`, 'POST', {
                amount: String(order.total || '0'),
                reason: 'Customer refund request from My Account',
                api_refund: false,
            });
            const updated = await wcRequest(`orders/${id}`, 'PUT', {
                status: 'refunded',
                meta_data: [
                    ...(Array.isArray(order.meta_data) ? order.meta_data : []),
                    { key: '_headless_refund_requested_at', value: new Date().toISOString() },
                ],
            });
            return NextResponse.json(withActions(updated as WCOrder));
        }

        return NextResponse.json({ error: 'Unsupported order action.' }, { status: 400 });
    } catch (err) {
        console.error('[WC Order Action]', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Order action failed.' }, { status: 500 });
    }
}
