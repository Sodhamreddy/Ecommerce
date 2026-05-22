export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { validateCheckoutProtection } from '@/lib/checkout-protection';





export async function POST(request: Request) {
    try {
        const body = await request.json();
        const protectionError = validateCheckoutProtection(request, body, {
            maxAttempts: 6,
            windowMs: 10 * 60 * 1000,
        });
        if (protectionError) return protectionError;

        return NextResponse.json(
            { error: 'Direct checkout is disabled. Please complete payment through the secure checkout page.' },
            { status: 403 }
        );
    } catch (e: unknown) {
        console.error('[Checkout API Exception]:', e);
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Checkout failed' }, { status: 500 });
    }
}
