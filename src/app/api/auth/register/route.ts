export const dynamic = "force-static";
import { NextResponse } from 'next/server';

const WP_BASE = 'https://jerseyperfume.com/wp-json';

export async function POST(request: Request) {
    const { email, password, first_name, last_name } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const ckKey = process.env.WC_CONSUMER_KEY;
    const ckSecret = process.env.WC_CONSUMER_SECRET;

    if (!ckKey || !ckSecret) {
        return NextResponse.json(
            { error: 'Registration is not configured. Please contact support or register on the website.' },
            { status: 503 }
        );
    }

    const credentials = Buffer.from(`${ckKey}:${ckSecret}`).toString('base64');

    try {
        const res = await fetch(`${WP_BASE}/wc/v3/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${credentials}`,
            },
            body: JSON.stringify({ email, password, first_name, last_name }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(
                { error: data.message || 'Registration failed. Email may already be in use.' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, user_id: data.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Registration error.' }, { status: 500 });
    }
}
