export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';
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

    const normalizedLogin = userLogin.toLowerCase();
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

    return customers.find((customer: WCCustomer) => {
        return customer.email?.toLowerCase() === normalizedLogin
            || customer.username?.toLowerCase() === normalizedLogin;
    }) || null;
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
    if (!requestedLogin) {
        return NextResponse.json({ error: 'Email or username is required.' }, { status: 400 });
    }

    try {
        const customer = await findCustomer(requestedLogin);
        if (!customer?.email) {
            return NextResponse.json(
                { error: 'No account found with that email or username.' },
                { status: 404 }
            );
        }

        await sendResetEmail(customer, requestedLogin);
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Failed to send reset link.' },
            { status: 500 }
        );
    }
}
