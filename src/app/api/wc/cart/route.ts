export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { WC_STORE_API } from '@/lib/config';

// Static fallback for output: 'export' build — real cart is fetched client-side via proxy.php
export async function GET() {
    return NextResponse.json({ items: [], totals: { total_price: '0', currency_code: 'GBP' }, item_count: 0 });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cookie = request.headers.get('cookie') || '';
        const nonce = request.headers.get('X-WC-Store-Api-Nonce') || request.headers.get('Nonce') || request.headers.get('nonce') || '';
        const { action, ...params } = body;
        
        let url = `${WC_STORE_API}/cart`;
        if (action === 'add-item') url += '/add-item';
        else if (action === 'update-item') url += '/update-item';
        else if (action === 'remove-item') url += '/remove-item';
        else if (action === 'apply-coupon') url += '/apply-coupon';
        else if (action === 'remove-coupon') url += '/remove-coupon';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(cookie ? { 'Cookie': cookie } : {}),
        };
        if (nonce) headers['X-WC-Store-Api-Nonce'] = nonce;

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(params)
        });
        
        const contentType = response.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { error: 'Non-JSON response', text: text.substring(0, 100) };
        }

        const setCookie = response.headers.get('set-cookie');
        const resNonce = response.headers.get('X-WC-Store-Api-Nonce') || response.headers.get('Nonce') || response.headers.get('nonce');
        
        const nextResponse = NextResponse.json(data, { status: response.status });
        if (setCookie) nextResponse.headers.set('set-cookie', setCookie);
        if (resNonce) nextResponse.headers.set('X-WC-Store-Api-Nonce', resNonce);
        
        return nextResponse;
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Cart operation failed' }, { status: 500 });
    }
}
