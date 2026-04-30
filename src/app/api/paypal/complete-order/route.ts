export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { SITE_DOMAIN } from '@/lib/config';

const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

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

        return NextResponse.json({ success: true, orderId: order.id, orderKey: order.order_key });
    } catch (e: any) {
        console.error('[PayPal Complete Order] Exception:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
