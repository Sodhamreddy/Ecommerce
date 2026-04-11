export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function POST(request: Request) {
    const { id, first_name, last_name, email, password } = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const ckKey = process.env.WC_CONSUMER_KEY;
    const ckSecret = process.env.WC_CONSUMER_SECRET;

    if (!ckKey || !ckSecret) {
        return NextResponse.json({ error: 'Account update not configured.' }, { status: 503 });
    }

    const body: Record<string, any> = {};
    if (first_name) body.first_name = first_name;
    if (last_name) body.last_name = last_name;
    if (email) body.email = email;
    if (password) body.password = password;

    try {
        const res = await fetch(
            `${API_BASE_URL}/wc/v3/customers/${id}?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(
                { error: (data as any).message || 'Failed to update account.' },
                { status: res.status }
            );
        }

        return NextResponse.json({ success: true, user: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Update failed.' }, { status: 500 });
    }
}
