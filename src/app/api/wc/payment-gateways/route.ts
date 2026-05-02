export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { API_BASE_URL, SITE_DOMAIN } from '@/lib/config';

const ALLOWED_GATEWAY_IDS = ['paypal', 'ppcp-gateway', 'stripe', 'woocommerce_payments', 'cod'];

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

async function fetchPayPalClientId(ckKey: string, ckSecret: string): Promise<string> {
    // Env variable is the most reliable source — set PAYPAL_CLIENT_ID in .env.local to skip API calls
    if (process.env.PAYPAL_CLIENT_ID) return process.env.PAYPAL_CLIENT_ID;

    // Attempt 1: PayPal plugin merchant endpoint
    try {
        const res = await fetch(
            `${SITE_DOMAIN}/wp-json/wc/v3/wc_paypal/common/merchant?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
            { cache: 'no-store', signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
            const d = await res.json();
            const id = d?.data?.merchant?.clientId || d?.merchant?.clientId || d?.clientId || '';
            if (id) return id;
        }
    } catch { /* try next */ }

    // Attempt 2: Individual ppcp-gateway settings
    try {
        const res = await fetch(
            `${API_BASE_URL}/wc/v3/payment_gateways/ppcp-gateway?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
            { cache: 'no-store', signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
            const d = await res.json();
            const id =
                d?.settings?.client_id?.value ||
                d?.settings?.sandbox_client_id?.value ||
                d?.settings?.testmode?.value === 'yes'
                    ? d?.settings?.sandbox_client_id?.value
                    : d?.settings?.client_id?.value;
            if (id && typeof id === 'string') return id;
        }
    } catch { /* try next */ }

    // Attempt 3: WooCommerce settings group
    try {
        const res = await fetch(
            `${API_BASE_URL}/wc/v3/settings/ppcp-settings?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
            { cache: 'no-store', signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
            const settings: any[] = await res.json();
            if (Array.isArray(settings)) {
                const clientIdSetting = settings.find((s: any) => s.id === 'client_id');
                if (clientIdSetting?.value) return clientIdSetting.value;
            }
        }
    } catch { /* give up */ }

    return '';
}

export async function GET() {
    const ckKey = process.env.WC_CONSUMER_KEY;
    const ckSecret = process.env.WC_CONSUMER_SECRET;

    try {
        if (ckKey && ckSecret) {
            const [apiClientId, gatewaysRes] = await Promise.all([
                fetchPayPalClientId(ckKey, ckSecret),
                fetch(
                    `${API_BASE_URL}/wc/v3/payment_gateways?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
                    { cache: 'no-store' }
                ),
            ]);

            console.log('[Payment Gateways] PayPal Client ID resolved:', apiClientId ? '✓ found' : '✗ empty');

            if (gatewaysRes.ok) {
                const gateways = await gatewaysRes.json();
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

            // WC gateways call failed but we may still have a client ID
            if (apiClientId) {
                return NextResponse.json([
                    { id: 'ppcp-gateway', title: 'PayPal & Cards', description: 'Pay securely via PayPal.', order: 0, clientId: apiClientId },
                ]);
            }
        }

        // Fallback: return default gateways with env client ID if available
        const fallbackClientId = process.env.PAYPAL_CLIENT_ID || '';
        return NextResponse.json([
            { id: 'ppcp-gateway', title: 'PayPal & Cards', description: 'Pay securely via PayPal.', order: 0, clientId: fallbackClientId },
        ]);
    } catch (e: any) {
        console.error('[Payment Gateways] Error:', e.message);
        const fallbackClientId = process.env.PAYPAL_CLIENT_ID || '';
        return NextResponse.json([
            { id: 'ppcp-gateway', title: 'PayPal & Cards', description: 'Pay securely via PayPal.', order: 0, clientId: fallbackClientId },
        ]);
    }
}
