export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { SITE_DOMAIN } from '@/lib/config';
import { validateCheckoutProtection } from '@/lib/checkout-protection';
import { normalizeCheckoutTotals } from '@/lib/checkout-totals';

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
    checkoutTotals?: CheckoutTotals;
    customerId?: number | null;
    createAccount?: boolean;
    accountPassword?: string;
    shouldCapture?: boolean;
};

type CheckoutTotals = {
    subtotal?: number;
    shipping?: number;
    tax?: number;
    discount?: number;
    total?: number;
    coupons?: string[];
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
    shipping_lines?: Array<{ method_id: string; method_title: string; total: string }>;
    coupon_lines?: Array<{ code: string; discount: string }>;
    fee_lines?: Array<{ name: string; tax_status: string; total: string }>;
    tax_lines?: Array<{ rate_code: string; label: string; tax_total: string; shipping_tax_total: string }>;
    customer_note: string;
    meta_data: Array<{ key: string; value: string }>;
    customer_id?: number;
};

type VerifiedPayPalPayment = {
    transactionId: string;
    amount: string;
    currency: string;
    items: Array<{ productId: number; quantity: number }>;
};

type PayPalCapture = {
    id?: string;
    status?: string;
    amount?: {
        value?: string;
        currency_code?: string;
    };
};

type PayPalPurchaseUnit = {
    items?: Array<{
        sku?: string;
        quantity?: string;
    }>;
    payments?: {
        captures?: PayPalCapture[];
    };
};

type PayPalOrder = {
    status?: string;
    message?: string;
    purchase_units?: PayPalPurchaseUnit[];
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

function verifyCompletedPayPalPayment(paypalOrder: PayPalOrder): VerifiedPayPalPayment {
    if (paypalOrder?.status !== 'COMPLETED') {
        throw new Error('PayPal payment was not completed.');
    }

    const capture = paypalOrder?.purchase_units
        ?.flatMap((unit) => unit?.payments?.captures || [])
        ?.find((item) => item?.status === 'COMPLETED' && item?.id);

    if (!capture) {
        throw new Error('PayPal capture could not be verified.');
    }

    const amount = capture?.amount?.value;
    const currency = capture?.amount?.currency_code;
    if (!amount || currency !== 'USD') {
        throw new Error('PayPal capture amount could not be verified.');
    }

    return {
        transactionId: capture.id!,
        amount,
        currency,
        items: (paypalOrder?.purchase_units || [])
            .flatMap((unit) => unit?.items || [])
            .map((item) => ({
                productId: Number(item?.sku || 0),
                quantity: Math.max(1, Number(item?.quantity || 1)),
            }))
            .filter((item) => item.productId > 0),
    };
}

async function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
    const accessToken = await getPayPalAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });
    const data = await res.json() as PayPalOrder;
    if (!res.ok) throw new Error(data.message || `PayPal verification failed (${res.status})`);
    return data;
}

async function capturePayPalOrder(orderId: string): Promise<VerifiedPayPalPayment> {
    const accessToken = await getPayPalAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });
    const data = await res.json() as PayPalOrder;
    if (!res.ok) {
        const existingOrder = await getPayPalOrder(orderId);
        if (existingOrder?.status === 'COMPLETED') {
            return verifyCompletedPayPalPayment(existingOrder);
        }
        throw new Error(data.message || `PayPal capture failed (${res.status})`);
    }
    return verifyCompletedPayPalPayment(data);
}

async function verifyExistingPayPalOrder(orderId: string): Promise<VerifiedPayPalPayment> {
    const paypalOrder = await getPayPalOrder(orderId);
    return verifyCompletedPayPalPayment(paypalOrder);
}

function toMoney(value: unknown) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}

async function wcRequest(path: string, method: 'GET' | 'POST' | 'PUT', body?: unknown) {
    const credentials = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
    const response = await fetch(`${SITE_DOMAIN}/wp-json/wc/v3/${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        console.error(`[PayPal Complete Order] WC ${method} ${path} error:`, data);
        throw new Error(data.message || 'WooCommerce order update failed');
    }

    return data;
}

type RecoverableOrder = {
    id?: number;
    order_key?: string;
    transaction_id?: string;
    billing?: { email?: string };
    meta_data?: { key?: string; value?: unknown }[];
};

function orderHasPayPalReference(order: RecoverableOrder, paypalOrderId: string, transactionId?: string) {
    if (transactionId && String(order.transaction_id || '') === transactionId) return true;

    const refs = new Set(
        (Array.isArray(order.meta_data) ? order.meta_data : [])
            .filter((item) => [
                'paypal_order_id',
                'paypal_transaction_id',
                '_ppcp_paypal_order_id',
                '_paypal_transaction_id',
                '_ppcp_paypal_payment_capture_id',
            ].includes(String(item?.key || '')))
            .map((item) => String(item?.value || ''))
            .filter(Boolean)
    );

    return refs.has(paypalOrderId) || Boolean(transactionId && refs.has(transactionId));
}

async function findExistingWooOrder(paypalOrderId: string, transactionId: string | undefined, email?: string) {
    const params = new URLSearchParams({
        per_page: '50',
        orderby: 'date',
        order: 'desc',
    });
    if (email) params.set('search', email);

    const orders = await wcRequest(`orders?${params.toString()}`, 'GET') as RecoverableOrder[];
    if (!Array.isArray(orders)) return null;

    return orders.find((order) =>
        orderHasPayPalReference(order, paypalOrderId, transactionId) &&
        (!email || String(order.billing?.email || '').toLowerCase() === email.toLowerCase())
    ) || null;
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
        const body = (await request.json()) as CompleteOrderBody;
        // Generous limit: the client retries completion up to 3x per checkout, and
        // several shoppers can share one IP (mobile CGNAT / office). Blocking here
        // before capture is fine, but blocking a legit customer must be rare.
        const protectionError = validateCheckoutProtection(request, body, {
            maxAttempts: 25,
            windowMs: 15 * 60 * 1000,
        });
        if (protectionError) return protectionError;

        const {
            formData,
            cartItems,
            paypalOrderId,
            checkoutTotals,
            customerId: existingCustomerId,
            createAccount,
            accountPassword,
            shouldCapture,
        } = body;

        if (!WC_KEY || !WC_SECRET) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (!paypalOrderId) {
            return NextResponse.json({ error: 'Missing PayPal order id' }, { status: 400 });
        }

        const verifiedPayment = shouldCapture
            ? await capturePayPalOrder(paypalOrderId)
            : await verifyExistingPayPalOrder(paypalOrderId);

        const normalizedTotals = await normalizeCheckoutTotals(checkoutTotals);
        const paidTotal = Number(verifiedPayment.amount);
        // The payment is already captured here. A totals mismatch must NOT abandon the
        // order — that is exactly how a customer ends up charged with no order and no
        // confirmation email. The captured amount was already validated at create-order
        // time, so flag any drift for review and continue creating the order.
        const totalsMismatch = checkoutTotals?.total != null
            && (!Number.isFinite(normalizedTotals.total) || Math.abs(normalizedTotals.total - paidTotal) > 0.01);

        const transactionId = verifiedPayment.transactionId;

        const existingOrder = await findExistingWooOrder(paypalOrderId, transactionId, formData.email);
        if (existingOrder?.id && existingOrder?.order_key) {
            return NextResponse.json({
                success: true,
                orderId: existingOrder.id,
                orderKey: existingOrder.order_key,
                recovered: true,
            });
        }

        const cartLineItems = (Array.isArray(cartItems) ? cartItems : []).map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            ...(item.variationId ? { variation_id: item.variationId } : {}),
        })).filter((item) => item.product_id > 0 && item.quantity > 0);
        const paypalLineItems = verifiedPayment.items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
        }));
        const lineItems = paypalLineItems.length > cartLineItems.length ? paypalLineItems : cartLineItems;
        // Payment already captured: if we can't resolve items, still record the order
        // (held for review) rather than throwing away a paid transaction.
        const missingLineItems = lineItems.length === 0;

        const metaData: Array<{ key: string; value: string }> = [
            { key: 'paypal_order_id', value: paypalOrderId },
            { key: 'paypal_transaction_id', value: transactionId },
            { key: '_ppcp_paypal_order_id', value: paypalOrderId },
            { key: '_paypal_transaction_id', value: transactionId },
            { key: '_ppcp_paypal_payment_capture_id', value: transactionId },
            { key: '_verified_paypal_amount', value: verifiedPayment.amount },
            { key: '_verified_paypal_currency', value: verifiedPayment.currency },
            { key: '_headless_line_item_count', value: String(lineItems.length) },
        ];

        if (totalsMismatch) {
            metaData.push({ key: '_headless_totals_mismatch', value: `expected=${normalizedTotals.total} paid=${paidTotal}` });
        }
        if (missingLineItems) {
            metaData.push({ key: '_headless_missing_line_items', value: 'yes' });
        }

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
            // Orders missing resolved items are held for manual review but still created
            // and still email the customer — never silently dropped after a capture.
            status: missingLineItems ? 'on-hold' : 'processing',
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

        const attachedCustomerId = customerId || (typeof existingCustomerId === 'number' ? existingCustomerId : null);
        if (attachedCustomerId) {
            orderData.customer_id = attachedCustomerId;
        }

        const shippingTotal = normalizedTotals.shipping;
        const taxTotal = normalizedTotals.tax;
        const discountTotal = normalizedTotals.discount;
        const couponCodes = normalizedTotals.coupons;

        if (shippingTotal > 0) {
            orderData.shipping_lines = [{
                method_id: 'flat_rate',
                method_title: 'Shipment',
                total: toMoney(shippingTotal),
            }];
        }

        if (discountTotal > 0) {
            const discountPerCoupon = discountTotal / Math.max(1, couponCodes.length);
            orderData.coupon_lines = (couponCodes.length ? couponCodes : ['coupon']).map((code) => ({
                code,
                discount: toMoney(discountPerCoupon),
            }));
        }

        if (taxTotal > 0) {
            const salesTax = toMoney(taxTotal);
            metaData.push({ key: '_payment_sales_tax', value: salesTax });
        }

        if (createAccount && accountPassword) {
            orderData.customer_note = (orderData.customer_note ? orderData.customer_note + '\n' : '') +
                (customerId ? '[Account created]' : '[Account requested but could not be created]');
        }

        // No resolvable items: carry the captured amount as a fee so the order total
        // still reflects the money received, and note it for manual reconciliation.
        if (missingLineItems) {
            orderData.fee_lines = [{
                name: 'PayPal payment (items pending review)',
                tax_status: 'none',
                total: toMoney(paidTotal),
            }];
            orderData.customer_note = (orderData.customer_note ? orderData.customer_note + '\n' : '') +
                `[Items could not be auto-resolved — verify against PayPal ${transactionId}]`;
        }

        let order;
        try {
            order = await wcRequest('orders', 'POST', orderData);
        } catch (err) {
            // The payment is captured. Do everything possible to still record an order so
            // the customer gets a confirmation email and staff can see the sale.

            // 1) A prior attempt (or a timed-out request) may already have created it.
            const recoveredOrder = await findExistingWooOrder(paypalOrderId, transactionId, formData.email);
            if (recoveredOrder?.id && recoveredOrder?.order_key) {
                return NextResponse.json({
                    success: true,
                    orderId: recoveredOrder.id,
                    orderKey: recoveredOrder.order_key,
                    recovered: true,
                });
            }

            // 2) Retry without the fields that most often trip WC validation (coupons,
            //    tax, shipping, fees, customer link). Held for review, but recorded.
            console.error('[PayPal Complete Order] Order create failed, retrying simplified:', err);
            const simplified: WooCommerceOrderPayload = {
                payment_method: orderData.payment_method,
                payment_method_title: orderData.payment_method_title,
                set_paid: true,
                status: 'on-hold',
                created_via: 'headless-checkout',
                transaction_id: transactionId,
                billing: orderData.billing,
                shipping: orderData.shipping,
                line_items: lineItems,
                customer_note: (orderData.customer_note ? orderData.customer_note + '\n' : '') +
                    '[Auto-recovered order — original creation failed, please verify totals]',
                meta_data: [...metaData, { key: '_headless_recovered_order', value: 'simplified' }],
            };
            try {
                order = await wcRequest('orders', 'POST', simplified);
            } catch (err2) {
                // 3) Last resort: a minimal order carrying just the captured amount as a
                //    fee, so a paid transaction is NEVER invisible to the store.
                console.error('[PayPal Complete Order] Simplified create failed, minimal fallback:', err2);
                const minimal: WooCommerceOrderPayload = {
                    payment_method: orderData.payment_method,
                    payment_method_title: orderData.payment_method_title,
                    set_paid: true,
                    status: 'on-hold',
                    created_via: 'headless-checkout',
                    transaction_id: transactionId,
                    billing: orderData.billing,
                    shipping: orderData.shipping,
                    line_items: [],
                    fee_lines: [{
                        name: 'PayPal payment (order needs review)',
                        tax_status: 'none',
                        total: toMoney(paidTotal),
                    }],
                    customer_note: `[Auto-recovered minimal order — verify items & totals against PayPal ${transactionId}]`,
                    meta_data: [...metaData, { key: '_headless_recovered_order', value: 'minimal' }],
                };
                order = await wcRequest('orders', 'POST', minimal);
            }
        }

        return NextResponse.json({ success: true, orderId: order.id, orderKey: order.order_key });
    } catch (e: unknown) {
        console.error('[PayPal Complete Order] Exception:', e);
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
    }
}
