export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function POST(request: Request) {
    const { email, password, first_name, last_name } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (!first_name || !last_name) {
        return NextResponse.json({ error: 'First name and last name are required.' }, { status: 400 });
    }

    const ckKey = process.env.WC_CONSUMER_KEY;
    const ckSecret = process.env.WC_CONSUMER_SECRET;

    if (!ckKey || !ckSecret) {
        return NextResponse.json(
            { error: 'Registration is not configured. Please contact support.' },
            { status: 503 }
        );
    }

    // ── Check if email already exists ──
    try {
        const checkRes = await fetch(
            `${API_BASE_URL}/wc/v3/customers?email=${encodeURIComponent(email)}&consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
            { cache: 'no-store' }
        );
        if (checkRes.ok) {
            const existing = await checkRes.json();
            if (Array.isArray(existing) && existing.length > 0) {
                return NextResponse.json(
                    { error: 'An account with this email address already exists. Please log in.' },
                    { status: 400 }
                );
            }
        }
    } catch {}

    // ── Create new customer ──
    try {
        const res = await fetch(
            `${API_BASE_URL}/wc/v3/customers?consumer_key=${ckKey}&consumer_secret=${ckSecret}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, first_name, last_name }),
            }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            const msg = (data as any).message || '';
            if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('registered')) {
                return NextResponse.json(
                    { error: 'An account with this email already exists. Please log in.' },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: msg || 'Registration failed. Please try again.' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, user_id: (data as any).id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Registration error.' }, { status: 500 });
    }
}
