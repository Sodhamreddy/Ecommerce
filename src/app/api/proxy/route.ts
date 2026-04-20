export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const path = searchParams.get('path');
    
    if (!path) {
        console.error('[Proxy Error] Missing path parameter in URL:', request.url);
        return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    // Construct the backend URL using the more reliable ?rest_route= format.
    // This bypasses many server-side security rules/misconfigurations that block pretty /wp-json/ urls.
    const cleanPath = '/' + path.replace(/^\//, '');
    const backendUrl = new URL('https://jerseyperfume.com/index.php');
    backendUrl.searchParams.set('rest_route', cleanPath);
    
    // Forward all other query parameters
    searchParams.forEach((value, key) => {
        if (key !== 'path') {
            backendUrl.searchParams.set(key, value);
        }
    });

    console.log(`[Proxy] GET ${request.url} -> ${backendUrl.toString()}`);

    try {
        // Forward browser cookies to WP so WC session is preserved across requests
        const incomingCookie = request.headers.get('cookie') || '';
        const response = await fetch(backendUrl.toString(), {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                ...(incomingCookie ? { 'Cookie': incomingCookie } : {}),
            },
            cache: 'no-store'
        });
        
        const contentType = response.headers.get('content-type') || '';
        let data;
        
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = { error: 'Non-JSON response', text: await response.text() };
        }
        
        // Pass along the pagination + WC Store API Nonce headers
        const headers = new Headers();
        const total = response.headers.get('X-WP-Total');
        const pages = response.headers.get('X-WP-TotalPages');
        const nonce = response.headers.get('X-WC-Store-Api-Nonce') || response.headers.get('Nonce') || response.headers.get('nonce');
        if (total) headers.set('X-WP-Total', total);
        if (pages) headers.set('X-WP-TotalPages', pages);
        if (nonce) headers.set('X-WC-Store-Api-Nonce', nonce);

        // Forward WC session cookie back to browser so POST mutations (coupon, checkout)
        // use the same WC session. Strip Secure/Domain/SameSite so it works on localhost.
        const rawSetCookie = response.headers.get('set-cookie');
        if (rawSetCookie) {
            const sanitized = rawSetCookie
                .replace(/;\s*Secure/gi, '')
                .replace(/;\s*SameSite=[^;,]*/gi, '')
                .replace(/;\s*Domain=[^;,]*/gi, '');
            headers.set('set-cookie', sanitized);
        }

        return NextResponse.json(data, {
            status: response.status,
            headers
        });
    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch proxy', message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    const cleanPath = '/' + path.replace(/^\//, '');
    const finalUrl = `https://jerseyperfume.com/index.php?rest_route=${cleanPath}`;
    
    console.log(`[Proxy] POST ${request.url} -> ${finalUrl}`);

    try {
        const body = await request.json();
        const cookie = request.headers.get('cookie') || '';
        const nonce = request.headers.get('X-WC-Store-Api-Nonce') || request.headers.get('Nonce') || request.headers.get('nonce') || '';

        const fetchHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            ...(cookie ? { 'Cookie': cookie } : {}),
        };
        if (nonce) fetchHeaders['X-WC-Store-Api-Nonce'] = nonce;

        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify(body)
        });

        const contentType = response.headers.get('content-type') || '';
        let data;
        
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error(`[Proxy] Non-JSON response from ${finalUrl}:`, text.substring(0, 500));
            data = { error: 'Non-JSON response', message: `Server returned ${response.status}`, text: text.substring(0, 500) };
        }

        const setCookie = response.headers.get('set-cookie');
        const resNonce = response.headers.get('X-WC-Store-Api-Nonce') || response.headers.get('Nonce') || response.headers.get('nonce');

        const nextResponse = NextResponse.json(data, { status: response.status });
        if (setCookie) {
            const sanitized = setCookie
                .replace(/;\s*Secure/gi, '')
                .replace(/;\s*SameSite=[^;,]*/gi, '')
                .replace(/;\s*Domain=[^;,]*/gi, '');
            nextResponse.headers.set('set-cookie', sanitized);
        }
        if (resNonce) nextResponse.headers.set('X-WC-Store-Api-Nonce', resNonce);

        return nextResponse;
    } catch (error: any) {
        console.error('[Proxy POST Error]:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch', 
            message: error.message,
            path: path
        }, { status: 500 });
    }
}
