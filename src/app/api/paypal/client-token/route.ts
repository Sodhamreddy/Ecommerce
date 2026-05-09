export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const PAYPAL_API = process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

async function getAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('PayPal credentials not configured');

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        cache: 'no-store',
    });

    if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
    return (await res.json()).access_token;
}

export async function GET() {
    try {
        const accessToken = await getAccessToken();
        const res = await fetch(`${PAYPAL_API}/v1/identity/generate-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.client_token) {
            return NextResponse.json(
                { error: data.message || 'Failed to generate PayPal client token' },
                { status: res.status || 500 }
            );
        }

        return NextResponse.json({ clientToken: data.client_token });
    } catch (e: any) {
        console.error('[PayPal Client Token]', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
