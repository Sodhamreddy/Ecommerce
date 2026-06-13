export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { validateCheckoutProtection } from '@/lib/checkout-protection';
import { normalizeCheckoutTotals } from '@/lib/checkout-totals';

const PAYPAL_API = process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

type PayPalCartItem = {
    product?: {
        id?: number;
        name?: string;
        slug?: string;
        prices?: {
            price?: string;
            currency_minor_unit?: number;
        };
    };
    quantity?: number;
};

type CheckoutTotals = {
    subtotal?: number;
    shipping?: number;
    tax?: number;
    discount?: number;
    total?: number;
    coupons?: string[];
};

function toMoney(value: number) {
    return value.toFixed(2);
}

function buildPayPalItems(cartItems: PayPalCartItem[] | undefined, expectedTotal: number) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return null;
    }

    const items = cartItems.map((item) => {
        const product = item.product || {};
        const quantity = Math.max(1, Number(item.quantity || 1));
        const minorUnit = product.prices?.currency_minor_unit || 2;
        const rawPrice = Number.parseInt(product.prices?.price || '0', 10);
        const unitPrice = rawPrice / Math.pow(10, minorUnit);

        if (!product.id || !product.name || !Number.isFinite(unitPrice) || unitPrice <= 0) {
            return null;
        }

        return {
            name: product.name.slice(0, 127),
            quantity: String(quantity),
            sku: String(product.id),
            category: 'PHYSICAL_GOODS',
            unit_amount: {
                currency_code: 'USD',
                value: toMoney(unitPrice),
            },
            ...(product.slug ? { url: `https://jerseyperfume.com/product/${product.slug}/` } : {}),
        };
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (items.length === 0) return null;

    const itemTotal = items.reduce((sum, item) => {
        return sum + Number(item.unit_amount.value) * Number(item.quantity);
    }, 0);

    if (Math.abs(itemTotal - expectedTotal) > 0.01) {
        return null;
    }

    return {
        items,
        itemTotal: toMoney(itemTotal),
    };
}

async function getAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('PayPal credentials not configured. Add PAYPAL_CLIENT_SECRET to .env.local');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
    const data = await res.json();
    return data.access_token;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const protectionError = validateCheckoutProtection(request, body, {
            maxAttempts: 12,
            windowMs: 10 * 60 * 1000,
        });
        if (protectionError) return protectionError;

        const { amount, paymentSource, cartItems, checkoutTotals } = body as {
            amount?: string;
            paymentSource?: string;
            cartItems?: PayPalCartItem[];
            checkoutTotals?: CheckoutTotals;
        };
        const parsed = parseFloat(String(amount || ''));
        if (!amount || isNaN(parsed) || parsed <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const normalizedTotals = await normalizeCheckoutTotals(checkoutTotals);
        if (Math.abs(normalizedTotals.total - parsed) > 0.01) {
            return NextResponse.json({ error: 'Checkout totals changed. Please refresh the page and try again.' }, { status: 409 });
        }

        const accessToken = await getAccessToken();
        const subtotal = normalizedTotals.subtotal;
        const shipping = normalizedTotals.shipping;
        const tax = normalizedTotals.tax;
        const discount = normalizedTotals.discount;
        const totalsMatch = Math.abs((subtotal + shipping + tax - discount) - parsed) <= 0.01;
        const paypalItems = buildPayPalItems(cartItems, subtotal > 0 ? subtotal : parsed);
        const amountPayload = {
            currency_code: 'USD',
            value: parsed.toFixed(2),
            ...(paypalItems && totalsMatch ? {
                breakdown: {
                    item_total: {
                        currency_code: 'USD',
                        value: paypalItems.itemTotal,
                    },
                    ...(shipping > 0 ? {
                        shipping: {
                            currency_code: 'USD',
                            value: toMoney(shipping),
                        },
                    } : {}),
                    ...(tax > 0 ? {
                        tax_total: {
                            currency_code: 'USD',
                            value: toMoney(tax),
                        },
                    } : {}),
                    ...(discount > 0 ? {
                        discount: {
                            currency_code: 'USD',
                            value: toMoney(discount),
                        },
                    } : {}),
                },
            } : {}),
        };

        const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: amountPayload,
                    ...(paypalItems ? { items: paypalItems.items } : {}),
                }],
                ...(paymentSource === 'card' ? {
                    payment_source: {
                        card: {
                            attributes: {
                                verification: {
                                    method: 'SCA_WHEN_REQUIRED',
                                },
                            },
                        },
                    },
                } : {}),
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return NextResponse.json({ error: err.message || 'Failed to create PayPal order' }, { status: res.status });
        }

        const order = await res.json();
        return NextResponse.json({ id: order.id });
    } catch (e: unknown) {
        console.error('[PayPal Create Order]', e);
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
    }
}
