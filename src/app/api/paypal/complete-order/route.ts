export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { SITE_DOMAIN } from '@/lib/config';
import nodemailer from 'nodemailer';

const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

async function sendOrderConfirmationEmail(order: any, formData: any, cartItems: any[]) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        const itemRows = cartItems.map((item: any) => {
            const price = (parseInt(item.product.prices.price) / Math.pow(10, item.product.prices.currency_minor_unit || 2));
            return `<tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">${item.product.name}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(price * item.quantity).toFixed(2)}</td>
            </tr>`;
        }).join('');

        const total = order.total || '0.00';
        const orderId = order.id;

        const html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
                <div style="background:#151c39;color:white;padding:24px 32px;">
                    <h1 style="margin:0;font-size:1.4rem;letter-spacing:0.05em;">Jersey Perfume</h1>
                    <p style="margin:8px 0 0;opacity:0.8;font-size:0.9rem;">Order Confirmation</p>
                </div>
                <div style="padding:32px;">
                    <h2 style="color:#151c39;margin-top:0;">Thank you for your order, ${formData.firstName}!</h2>
                    <p>Your order <strong>#${orderId}</strong> has been placed and is being processed.</p>

                    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                        <thead>
                            <tr style="background:#f5f5f5;">
                                <th style="padding:10px 8px;text-align:left;">Product</th>
                                <th style="padding:10px 8px;text-align:center;">Qty</th>
                                <th style="padding:10px 8px;text-align:right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>${itemRows}</tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold;">Total</td>
                                <td style="padding:12px 8px;text-align:right;font-weight:bold;">$${parseFloat(total).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="background:#f9f9f9;padding:16px;border-radius:4px;margin:20px 0;">
                        <h3 style="margin-top:0;color:#151c39;">Shipping to:</h3>
                        <p style="margin:0;line-height:1.7;">
                            ${formData.firstName} ${formData.lastName}<br/>
                            ${formData.address}${formData.address2 ? ', ' + formData.address2 : ''}<br/>
                            ${formData.city}, ${formData.state} ${formData.zip}<br/>
                            ${formData.country}
                        </p>
                    </div>

                    <p style="color:#666;font-size:0.9rem;">
                        Questions? Reply to this email or contact us at
                        <a href="mailto:info@jerseyperfume.com">info@jerseyperfume.com</a>
                    </p>
                </div>
            </div>
        `;

        // Send to customer
        await transporter.sendMail({
            from: `"Jersey Perfume" <${process.env.SMTP_USER}>`,
            to: formData.email,
            subject: `Order Confirmed #${orderId} — Jersey Perfume`,
            html,
        });

        // Notify store admin
        const adminEmail = process.env.CONTACT_EMAIL || 'info@jerseyperfume.com';
        await transporter.sendMail({
            from: `"Jersey Perfume Orders" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `New Order #${orderId} — $${parseFloat(total).toFixed(2)} — ${formData.firstName} ${formData.lastName}`,
            html: `<p>New order <strong>#${orderId}</strong> placed by ${formData.firstName} ${formData.lastName} (${formData.email}).</p>
                   <p>Total: <strong>$${parseFloat(total).toFixed(2)}</strong></p>
                   <p><a href="${SITE_DOMAIN}/wp-admin/admin.php?page=wc-orders&action=edit&id=${orderId}">View order in WordPress</a></p>`,
        });
    } catch (err) {
        // Email failure must never break the order response
        console.error('[Order Email] Failed to send confirmation:', err);
    }
}

export async function POST(request: Request) {
    try {
        const { formData, cartItems, paypalOrderId, paypalTransactionId, createAccount, accountPassword } = await request.json();

        if (!WC_KEY || !WC_SECRET) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const lineItems = (cartItems as any[]).map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            ...(item.variationId ? { variation_id: item.variationId } : {}),
        }));

        const metaData: any[] = [
            { key: 'paypal_order_id', value: paypalOrderId },
            { key: 'paypal_transaction_id', value: paypalTransactionId },
        ];

        const orderData: any = {
            payment_method: 'ppcp-gateway',
            payment_method_title: 'PayPal',
            set_paid: true,
            status: 'processing',
            billing: {
                first_name: formData.firstName,
                last_name: formData.lastName,
                company: formData.company || '',
                address_1: formData.address,
                address_2: formData.address2 || '',
                city: formData.city,
                state: formData.state,
                postcode: formData.zip,
                country: formData.country,
                email: formData.email,
                phone: formData.phone,
            },
            shipping: {
                first_name: formData.firstName,
                last_name: formData.lastName,
                address_1: formData.address,
                address_2: formData.address2 || '',
                city: formData.city,
                state: formData.state,
                postcode: formData.zip,
                country: formData.country,
            },
            line_items: lineItems,
            customer_note: formData.orderNotes || '',
            meta_data: metaData,
        };

        if (createAccount && accountPassword) {
            orderData.customer_note = (orderData.customer_note ? orderData.customer_note + '\n' : '') + '[Account requested]';
        }

        const credentials = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
        const response = await fetch(`${SITE_DOMAIN}/wp-json/wc/v3/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
            },
            body: JSON.stringify(orderData),
        });

        const order = await response.json();

        if (!response.ok) {
            console.error('[PayPal Complete Order] WC error:', order);
            return NextResponse.json({ error: order.message || 'Order creation failed' }, { status: 400 });
        }

        // Send confirmation emails (non-blocking — failure does not affect order response)
        sendOrderConfirmationEmail(order, formData, cartItems);

        return NextResponse.json({ success: true, orderId: order.id, orderKey: order.order_key });
    } catch (e: any) {
        console.error('[PayPal Complete Order] Exception:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
