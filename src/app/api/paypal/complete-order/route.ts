export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { SITE_DOMAIN } from '@/lib/config';

const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

const PAYPAL_API = process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

type CheckoutFormData = {
    firstName: string;
    lastName: string;
    company?: string;
    email: string;
    phone: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    orderNotes?: string;
};

type CheckoutCartItem = {
    product: { id: number };
    quantity: number;
    variationId?: number;
};

type CompleteOrderBody = {
    formData: CheckoutFormData;
    cartItems: CheckoutCartItem[];
    paypalOrderId: string;
    paypalTransactionId?: string;
    createAccount?: boolean;
    accountPassword?: string;
    shouldCapture?: boolean;
};

type WooCommerceOrderPayload = {
    payment_method: string;
    payment_method_title: string;
    set_paid: boolean;
    status: string;
    created_via: string;
    transaction_id?: string;
    billing: Record<string, string>;
    shipping: Record<string, string>;
    line_items: Array<{ product_id: number; quantity: number; variation_id?: number }>;
    customer_note: string;
    meta_data: Array<{ key: string; value: string }>;
    customer_id?: number;
};

async function getPayPalAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID!;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
    return (await res.json()).access_token;
}

async function capturePayPalOrder(orderId: string): Promise<string> {
    const accessToken = await getPayPalAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `PayPal capture failed (${res.status})`);
    return data?.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId;
}

async function wcRequest(path: string, method: 'POST' | 'PUT', body: unknown) {
    const credentials = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
    const response = await fetch(`${SITE_DOMAIN}/wp-json/wc/v3/${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        console.error(`[PayPal Complete Order] WC ${method} ${path} error:`, data);
        throw new Error(data.message || 'WooCommerce order update failed');
    }

    return data;
}


async function createCheckoutCustomer(formData: CheckoutFormData, password: string): Promise<number | null> {
    const response = await wcRequest('customers', 'POST', {
        email: formData.email,
        username: formData.email,
        password,
        first_name: formData.firstName,
        last_name: formData.lastName,
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
    }) as { id?: number };

    return typeof response.id === 'number' ? response.id : null;
}

export async function POST(request: Request) {
    try {
        const {
            formData,
            cartItems,
            paypalOrderId,
            paypalTransactionId,
            createAccount,
            accountPassword,
            shouldCapture,
        } = (await request.json()) as CompleteOrderBody;

        if (!WC_KEY || !WC_SECRET) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        let transactionId = paypalTransactionId || '';
        if (shouldCapture && paypalOrderId) {
            transactionId = await capturePayPalOrder(paypalOrderId);
        }

        const lineItems = cartItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            ...(item.variationId ? { variation_id: item.variationId } : {}),
        }));

        const metaData: Array<{ key: string; value: string }> = [
            { key: 'paypal_order_id', value: paypalOrderId },
            { key: 'paypal_transaction_id', value: transactionId },
            { key: '_ppcp_paypal_order_id', value: paypalOrderId },
            { key: '_paypal_transaction_id', value: transactionId },
            { key: '_ppcp_paypal_payment_capture_id', value: transactionId },
        ];

        let customerId: number | null = null;
        if (createAccount && accountPassword) {
            try {
                customerId = await createCheckoutCustomer(formData, accountPassword);
                metaData.push({ key: '_headless_account_created', value: customerId ? 'yes' : 'no' });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown account creation error';
                console.error('[PayPal Complete Order] Account creation skipped:', message);
                metaData.push({ key: '_headless_account_created', value: 'no' });
                metaData.push({ key: '_headless_account_error', value: message });
            }
        }

        const orderData: WooCommerceOrderPayload = {
            payment_method: 'ppcp-gateway',
            payment_method_title: transactionId ? `PayPal (${transactionId})` : 'PayPal',
            set_paid: true,
            status: 'processing',
            created_via: 'headless-checkout',
            transaction_id: transactionId,
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

        if (customerId) {
            orderData.customer_id = customerId;
        }

        if (createAccount && accountPassword) {
            orderData.customer_note = (orderData.customer_note ? orderData.customer_note + '\n' : '') +
                (customerId ? '[Account created]' : '[Account requested but could not be created]');
        }

        const order = await wcRequest('orders', 'POST', orderData);

        return NextResponse.json({ success: true, orderId: order.id, orderKey: order.order_key });
    } catch (e: unknown) {
        console.error('[PayPal Complete Order] Exception:', e);
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
    }
}
