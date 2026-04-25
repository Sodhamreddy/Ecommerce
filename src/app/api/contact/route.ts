import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { API_BASE_URL } from '@/lib/config';

// Try submitting to CF7 with auto-discovered form ID
async function tryCF7(name: string, email: string, subject: string, message: string): Promise<boolean> {
    // Try common CF7 form IDs (default install starts at 1; 54 was the old hardcoded value)
    const candidates = [1, 2, 3, 5, 7, 54, 55, 100];

    for (const id of candidates) {
        try {
            const body = new FormData();
            body.append('your-name', name);
            body.append('your-email', email);
            body.append('your-subject', subject || `Contact from ${name}`);
            body.append('your-message', message);

            const res = await fetch(`${API_BASE_URL}/contact-form-7/v1/contact-forms/${id}/feedback`, {
                method: 'POST',
                body,
                signal: AbortSignal.timeout(5000),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === 'mail_sent') {
                    console.log(`[Contact] CF7 form ${id} succeeded`);
                    return true;
                }
            }
        } catch {
            // timeout or network error — try next ID
        }
    }
    return false;
}

// Send via nodemailer (requires SMTP env vars)
async function tryNodemailer(name: string, email: string, subject: string, message: string): Promise<boolean> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        await transporter.sendMail({
            from: `"Jersey Perfume Contact" <${process.env.SMTP_USER}>`,
            replyTo: `"${name}" <${email}>`,
            to: process.env.CONTACT_EMAIL || 'info@jerseyperfume.com',
            subject: subject ? `[Contact] ${subject}` : `[Contact] Message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
                    <div style="background:#151c39;color:white;padding:24px 32px;">
                        <h2 style="margin:0;font-size:1.1rem;letter-spacing:0.1em;text-transform:uppercase;">New Contact Form Message</h2>
                    </div>
                    <div style="padding:32px;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
                        <hr style="border:1px solid #eee;margin:20px 0;" />
                        <p><strong>Message:</strong></p>
                        <p style="white-space:pre-wrap;background:#f9f9f9;padding:16px;border-radius:4px;line-height:1.6;">${message}</p>
                    </div>
                </div>
            `,
        });
        return true;
    } catch (err) {
        console.error('[Contact] Nodemailer error:', err);
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const name = body['your-name']?.trim();
        const email = body['your-email']?.trim();
        const subject = body['your-subject']?.trim() || '';
        const message = body['your-message']?.trim();

        if (!name || !email || !message) {
            return NextResponse.json(
                { status: 'validation_failed', message: 'Name, email, and message are required.' },
                { status: 400 }
            );
        }

        // Try CF7 first (no config needed — uses existing WP plugin)
        const cf7Sent = await tryCF7(name, email, subject, message);
        if (cf7Sent) {
            return NextResponse.json({ status: 'mail_sent', message: 'Thank you! Your message has been sent.' });
        }

        // Fall back to nodemailer if SMTP is configured
        const smtpSent = await tryNodemailer(name, email, subject, message);
        if (smtpSent) {
            return NextResponse.json({ status: 'mail_sent', message: 'Thank you! Your message has been sent.' });
        }

        // Nothing worked — log and return a helpful error
        console.error(`[Contact] UNDELIVERED message from ${name} <${email}>: ${message}`);
        return NextResponse.json(
            {
                status: 'error',
                message: `We couldn't send your message automatically. Please email us directly at info@jerseyperfume.com or call +1 (732) 361-4489.`,
            },
            { status: 500 }
        );
    } catch (error) {
        console.error('[Contact API] Unexpected error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Something went wrong. Please try again later.' },
            { status: 500 }
        );
    }
}
