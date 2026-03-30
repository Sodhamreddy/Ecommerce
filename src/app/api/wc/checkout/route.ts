export const dynamic = "force-static";
import { NextResponse } from 'next/server';



const WC_STORE_API = 'https://jerseyperfume.com/wp-json/wc/store/v1';

export async function POST(request: Request) {
    const body = await request.json();
    const cookie = request.headers.get('cookie') || '';

    try {
        const response = await fetch(`${WC_STORE_API}/checkout`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': cookie 
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        const setCookie = response.headers.get('set-cookie');
        
        const nextResponse = NextResponse.json(data, { status: response.status });
        if (setCookie) nextResponse.headers.set('set-cookie', setCookie);
        
        return nextResponse;
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
