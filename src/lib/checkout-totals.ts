import { SITE_DOMAIN } from './config';

type CheckoutTotals = {
    subtotal?: number;
    shipping?: number;
    tax?: number;
    discount?: number;
    total?: number;
    coupons?: string[];
};

type CouponDefinition = {
    code?: string;
    amount?: string;
    discount_type?: string;
    minimum_amount?: string;
    maximum_amount?: string;
};

const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

function money(value: unknown) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount : 0;
}

function clampDiscount(value: number, subtotal: number) {
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.min(value, Math.max(0, subtotal));
}

async function fetchCouponDefinition(code: string): Promise<CouponDefinition | null> {
    if (!WC_KEY || !WC_SECRET) return null;

    const credentials = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
    const params = new URLSearchParams({ code, per_page: '1' });
    const response = await fetch(`${SITE_DOMAIN}/wp-json/wc/v3/coupons?${params.toString()}`, {
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Accept': 'application/json',
        },
        cache: 'no-store',
    });

    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return Array.isArray(data) ? data[0] || null : null;
}

export async function normalizeCheckoutTotals(totals?: CheckoutTotals): Promise<Required<Omit<CheckoutTotals, 'coupons'>> & { coupons: string[] }> {
    const subtotal = money(totals?.subtotal);
    const shipping = money(totals?.shipping);
    const tax = money(totals?.tax);
    const coupons = Array.isArray(totals?.coupons)
        ? totals.coupons.map((code) => String(code).trim()).filter(Boolean)
        : [];

    const definitions = await Promise.all(coupons.map(fetchCouponDefinition));
    const canVerifyCoupons = coupons.length > 0 && definitions.every(Boolean);

    let verifiedDiscount = 0;
    if (coupons.length === 0) {
        verifiedDiscount = 0;
    } else if (canVerifyCoupons) {
        verifiedDiscount = definitions.reduce((sum, definition) => {
            const amount = money(definition?.amount);
            const minimum = money(definition?.minimum_amount);
            const maximum = money(definition?.maximum_amount);
            if (amount <= 0 || (minimum > 0 && subtotal < minimum)) return sum;

            let discount = 0;
            if (definition?.discount_type === 'percent') {
                discount = subtotal * (amount / 100);
            } else if (definition?.discount_type === 'fixed_cart') {
                discount = amount;
            }

            if (maximum > 0) discount = Math.min(discount, maximum);
            return sum + clampDiscount(discount, subtotal);
        }, 0);
    } else {
        verifiedDiscount = clampDiscount(money(totals?.discount), subtotal);
    }

    const discount = Number(clampDiscount(verifiedDiscount, subtotal).toFixed(2));
    const total = Number(Math.max(0, subtotal + shipping + tax - discount).toFixed(2));

    return {
        subtotal: Number(subtotal.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        discount,
        total,
        coupons,
    };
}
