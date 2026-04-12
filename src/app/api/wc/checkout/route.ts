export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { WC_STORE_API } from '@/lib/config';





export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cookie = request.headers.get('cookie') || '';
        const nonce = request.headers.get('Nonce') || request.headers.get('nonce') || '';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            ...(cookie ? { 'Cookie': cookie } : {}),
        };
        if (nonce) headers['Nonce'] = nonce;

        const response = await fetch(`${WC_STORE_API}/checkout`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        
        const contentType = response.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('[Checkout API Error]: Non-JSON response', text.substring(0, 500));
            data = { error: 'Non-JSON response', text: text.substring(0, 100) };
        }

        const setCookie = response.headers.get('set-cookie');
        const nextResponse = NextResponse.json(data, { status: response.status });
        if (setCookie) nextResponse.headers.set('set-cookie', setCookie);
        
        return nextResponse;
    } catch (e: any) {
        console.error('[Checkout API Exception]:', e);
        return NextResponse.json({ error: e.message || 'Checkout failed' }, { status: 500 });
    }
}
