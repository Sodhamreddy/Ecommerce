export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { API_BASE_URL, SITE_DOMAIN } from '@/lib/config';

// Only show these two top-level gateways — everything else is filtered out
const ALLOWED_GATEWAY_IDS = ['paypal', 'ppcp-gateway', 'stripe', 'woocommerce_payments', 'cod'];

// Friendly display names override
const GATEWAY_LABELS: Record<string, string> = {
    stripe: 'Debit & Credit Cards',
    woocommerce_payments: 'Debit & Credit Cards',
    paypal: 'PayPal',
    'ppcp-gateway': 'PayPal & Cards',
    cod: 'Cash on Delivery',
};

const GATEWAY_DESCS: Record<string, string> = {
    stripe: 'Pay with your credit card.',
    woocommerce_payments: 'Pay with your credit card.',
    paypal: 'Pay via PayPal.',
    cod: 'Pay with cash upon delivery.',
};

export async function GET() {
    const ckKey = process.env.WC_CONSUMER_KEY;
    const ckSecret = process.env.WC_CONSUMER_SECRET;

    try {
        if (ckKey && ckSecret) {
            // 1. Fetch Merchant settings for PayPal Client ID (Correct path from V3)
            const merchantRes = await fetch(
                `${SITE_DOMAIN}/wp-json/wc/v3/wc_paypal/common/merchant?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
                { cache: 'no-store' }
            );
            let apiClientId = '';
            if (merchantRes.ok) {
                const merchantData = await merchantRes.json();
                // Merchant data is nested in data.merchant.clientId
                apiClientId = merchantData?.data?.merchant?.clientId || merchantData?.merchant?.clientId || merchantData?.clientId || '';
            }

            // 2. Fetch standard gateways
            const res = await fetch(
                `${API_BASE_URL}/wc/v3/payment_gateways?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
                { cache: 'no-store' }
            );

            if (res.ok) {
                const gateways = await res.json();
                const filtered = gateways
                    .filter((g: any) => g.enabled && ALLOWED_GATEWAY_IDS.includes(g.id))
                    .map((g: any) => ({
                        id: g.id,
                        title: GATEWAY_LABELS[g.id] || g.title,
                        description: GATEWAY_DESCS[g.id] || g.description,
                        order: g.order || 0,
                        clientId: g.id === 'ppcp-gateway' ? apiClientId : undefined,
                    }))
                    .sort((a: any, b: any) => a.order - b.order);

                if (filtered.length > 0) return NextResponse.json(filtered);
            }
        }

        // Fallback: return both gateways
        return NextResponse.json([
            { id: 'stripe', title: 'Debit & Credit Cards', description: 'Pay with your credit card.', order: 0 },
            { id: 'paypal', title: 'PayPal', description: 'Pay via PayPal.', order: 1 },
        ]);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch payment gateways' }, { status: 500 });
    }
}
