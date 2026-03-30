export const dynamic = "force-static";
import { NextResponse } from 'next/server';



const WC_STORE_API = 'https://jerseyperfume.com/wp-json/wc/store/v1';

export async function GET() {
    try {
        const response = await fetch(`${WC_STORE_API}/checkout/payment-gateways`);
        const data = await response.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch payment gateways' }, { status: 500 });
    }
}
