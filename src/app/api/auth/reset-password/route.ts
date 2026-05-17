export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { SITE_DOMAIN, API_BASE_URL } from '@/lib/config';
import { createPasswordResetToken } from '@/lib/password-reset-token';
import nodemailer from 'nodemailer';

type WCCustomer = {
    id: number;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
};

const ckKey = process.env.WC_CONSUMER_KEY;
const ckSecret = process.env.WC_CONSUMER_SECRET;

function getSiteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL || 'https://jerseyperfume.com').replace(/\/$/, '');
}

function isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function findCustomer(userLogin: string): Promise<WCCustomer | null> {
    if (!ckKey || !ckSecret) return null;

    const params = new URLSearchParams({
        consumer_key: ckKey,
        consumer_secret: ckSecret,
        per_page: '10',
    });
    params.set(isEmail(userLogin) ? 'email' : 'search', userLogin);

    const res = await fetch(`${API_BASE_URL}/wc/v3/customers?${params.toString()}`, {
        cache: 'no-store',
    });
    if (!res.ok) return null;

    const customers = await res.json().catch(() => []);
    if (!Array.isArray(customers) || customers.length === 0) return null;

    const normalizedLogin = userLogin.toLowerCase();
    return customers.find((customer: WCCustomer) => {
        return customer.email?.toLowerCase() === normalizedLogin
            || customer.username?.toLowerCase() === normalizedLogin;
    }) || customers[0] || null;
}

async function sendResetEmail(customer: WCCustomer, requestedLogin: string) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromName = process.env.SMTP_FROM_NAME || 'Jersey Perfume Support';

    if (!smtpHost || !smtpUser || !smtpPass) {
        throw new Error('SMTP configuration is missing.');
    }

    const replyTo = process.env.CONTACT_EMAIL || smtpUser;
    const token = createPasswordResetToken({
        id: customer.id,
        email: customer.email,
        login: requestedLogin,
        exp: Date.now() + 60 * 60 * 1000,
    });
    const resetUrl = `${getSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();
    const safeName = escapeHtml(name || 'there');
    const safeResetUrl = escapeHtml(resetUrl);

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
        from: `"${fromName}" <${smtpUser}>`,
        replyTo,
        to: customer.email,
        subject: 'Jersey Perfume account password reset',
        headers: {
            'Auto-Submitted': 'auto-generated',
            'X-Auto-Response-Suppress': 'All',
        },
        text: [
            `Hi ${name || 'there'},`,
            '',
            'We received a request to reset your Jersey Perfume account password.',
            '',
            'Use this secure link to choose a new password:',
            resetUrl,
            '',
            'This link expires in 1 hour.',
            '',
            'If you did not request this email, you can safely ignore it and your password will not change.',
            '',
            'Jersey Perfume',
            `Support: ${replyTo}`,
            getSiteUrl(),
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:560px;margin:0 auto">
                <p style="font-size:13px;color:#555;margin:0 0 20px">Jersey Perfume account support</p>
                <h2 style="color:#151c39;margin:0 0 18px">Reset your password</h2>
                <p>Hi ${safeName},</p>
                <p>We received a request to reset your Jersey Perfume account password.</p>
                <p>
                    <a href="${safeResetUrl}" style="display:inline-block;background:#151c39;color:#fff;text-decoration:none;padding:12px 18px;border-radius:4px;font-weight:700">
                        Reset Password
                    </a>
                </p>
                <p style="font-size:13px;color:#666">This link expires in 1 hour. If you did not request this email, you can safely ignore it and your password will not change.</p>
                <p style="font-size:12px;color:#777;margin-top:24px">
                    Jersey Perfume<br>
                    Support: <a href="mailto:${escapeHtml(replyTo)}" style="color:#151c39">${escapeHtml(replyTo)}</a><br>
                    <a href="${escapeHtml(getSiteUrl())}" style="color:#151c39">${escapeHtml(getSiteUrl())}</a>
                </p>
            </div>
        `,
    });
}

export async function POST(request: Request) {
    const { user_login } = await request.json();

    if (!user_login) {
        return NextResponse.json({ error: 'Email or username is required.' }, { status: 400 });
    }

    const requestedLogin = String(user_login).trim();

    try {
        const customer = await findCustomer(requestedLogin);
        if (customer?.email) {
            await sendResetEmail(customer, requestedLogin);
            return NextResponse.json({ success: true });
        }
    } catch (e: unknown) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Failed to send reset link.' },
            { status: 500 }
        );
    }

    // Keep WordPress' native reset as a fallback for stores/users not returned by WooCommerce.
    try {
        const res = await fetch(`${SITE_DOMAIN}/wp-login.php?action=lostpassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Cookie: 'wordpress_test_cookie=WP+Cookie+check',
                Referer: `${SITE_DOMAIN}/wp-login.php`,
            },
            body: new URLSearchParams({
                user_login: requestedLogin,
                redirect_to: '',
                'wp-submit': 'Get New Password',
                testcookie: '1',
            }).toString(),
            redirect: 'manual',
        });

        const location = res.headers.get('location') || '';
        if ((res.status >= 300 && res.status < 400) && (location.includes('checkemail') || location.includes('wp-login'))) {
            return NextResponse.json({ success: true });
        }

        if (res.status === 302 || res.status === 301) {
            return NextResponse.json({ success: true });
        }

        const text = await res.text().catch(() => '');
        if (
            text.includes('check your email') ||
            text.includes('checkemail') ||
            text.includes('password reset') ||
            text.includes('has been sent') ||
            text.includes('ERROR') ||
            text.includes('Invalid')
        ) {
            return NextResponse.json({ success: true });
        }
    } catch {}

    try {
        const res = await fetch(`${API_BASE_URL}/wc/store/v1/customers/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: requestedLogin }),
        });
        if (res.ok) return NextResponse.json({ success: true });
    } catch {}

    return NextResponse.json({ success: true });
}
