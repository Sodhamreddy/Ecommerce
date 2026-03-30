import { NextResponse } from 'next/server';



const WC_STORE_API = 'https://jerseyperfume.com/wp-json/wc/store/v1';

export async function GET(request: Request) {
    const cookie = request.headers.get('cookie') || '';
    
    try {
        const response = await fetch(`${WC_STORE_API}/cart`, {
            headers: { 'Cookie': cookie }
        });
        const data = await response.json();
        
        const setCookie = response.headers.get('set-cookie');
        const nextResponse = NextResponse.json(data);
        if (setCookie) nextResponse.headers.set('set-cookie', setCookie);
        
        return nextResponse;
    } catch {
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const cookie = request.headers.get('cookie') || '';
    const { action, ...params } = body;
    
    let url = `${WC_STORE_API}/cart`;
    if (action === 'add-item') url += '/add-item';
    else if (action === 'update-item') url += '/update-item';
    else if (action === 'remove-item') url += '/remove-item';
    else if (action === 'apply-coupon') url += '/apply-coupon';
    else if (action === 'remove-coupon') url += '/remove-coupon';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': cookie 
            },
            body: JSON.stringify(params)
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
