export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { WC_STORE_API } from '@/lib/config';

/**
 * Dev-mode nonce endpoint — mirrors /api/wc/nonce.php for production.
 * Returns { nonce: string } so the browser doesn't have to read response headers.
 */
export async function GET(request: Request) {
    const cookie = request.headers.get('cookie') || '';

    try {
        const response = await fetch(`${WC_STORE_API}/cart`, {
            headers: {
                'Accept': 'application/json',
                ...(cookie ? { 'Cookie': cookie } : {}),
            },
            cache: 'no-store',
        });

        const nonce =
            response.headers.get('X-WC-Store-Api-Nonce') ||
            response.headers.get('Nonce') ||
            response.headers.get('nonce') ||
            '';

        const res = NextResponse.json({ nonce });

        // Forward session cookies so the nonce stays tied to the right cart
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            const sanitized = setCookie
                .replace(/;\s*Secure/gi, '')
                .replace(/;\s*SameSite=[^;,]*/gi, '')
                .replace(/;\s*Domain=[^;,]*/gi, '');
            res.headers.set('set-cookie', sanitized);
        }

        return res;
    } catch {
        return NextResponse.json({ nonce: '' });
    }
}
