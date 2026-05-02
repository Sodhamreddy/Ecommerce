export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const PAYPAL_API = process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

async function getAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('PayPal credentials not configured. Add PAYPAL_CLIENT_SECRET to .env.local');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
    const data = await res.json();
    return data.access_token;
}

export async function POST(request: Request) {
    try {
        const { amount } = await request.json();
        const parsed = parseFloat(amount);
        if (!amount || isNaN(parsed) || parsed <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const accessToken = await getAccessToken();
        const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{ amount: { currency_code: 'USD', value: parsed.toFixed(2) } }],
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return NextResponse.json({ error: err.message || 'Failed to create PayPal order' }, { status: res.status });
        }

        const order = await res.json();
        return NextResponse.json({ id: order.id });
    } catch (e: any) {
        console.error('[PayPal Create Order]', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
