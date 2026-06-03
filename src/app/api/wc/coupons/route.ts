export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

const ckKey = process.env.WC_CONSUMER_KEY;
const ckSecret = process.env.WC_CONSUMER_SECRET;

type CouponResponse = {
    id: number;
    code: string;
    amount: string;
    discount_type: string;
    free_shipping?: boolean;
    minimum_amount?: string;
    maximum_amount?: string;
    product_ids?: number[];
    excluded_product_ids?: number[];
    product_categories?: number[];
    excluded_product_categories?: number[];
    exclude_sale_items?: boolean;
};

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const code = String(url.searchParams.get('code') || '').trim();
        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
        }
        if (!ckKey || !ckSecret) {
            return NextResponse.json({ error: 'WooCommerce API credentials are missing.' }, { status: 500 });
        }

        const params = new URLSearchParams({
            code,
            consumer_key: ckKey,
            consumer_secret: ckSecret,
        });
        const res = await fetch(`${API_BASE_URL}/wc/v3/coupons?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json().catch(() => []);
        if (!res.ok) {
            const message = typeof data === 'object' && data && 'message' in data
                ? String(data.message)
                : 'Failed to load coupon.';
            return NextResponse.json({ error: message }, { status: res.status });
        }

        const coupon = Array.isArray(data) ? data[0] as CouponResponse | undefined : undefined;
        if (!coupon) {
            return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
        }

        return NextResponse.json({
            id: coupon.id,
            code: coupon.code,
            amount: coupon.amount,
            discount_type: coupon.discount_type,
            free_shipping: Boolean(coupon.free_shipping),
            minimum_amount: coupon.minimum_amount || '0',
            maximum_amount: coupon.maximum_amount || '0',
            product_ids: coupon.product_ids || [],
            excluded_product_ids: coupon.excluded_product_ids || [],
            product_categories: coupon.product_categories || [],
            excluded_product_categories: coupon.excluded_product_categories || [],
            exclude_sale_items: Boolean(coupon.exclude_sale_items),
        });
    } catch (err) {
        console.error('[WC Coupon]', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to load coupon.' }, { status: 500 });
    }
}
