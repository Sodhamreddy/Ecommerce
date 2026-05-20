import { NextResponse } from 'next/server';

type CheckoutProtectionPayload = {
    checkoutStartedAt?: number;
    companyWebsite?: string;
};

type ProtectionOptions = {
    maxAttempts: number;
    windowMs: number;
    minAgeMs?: number;
};

const attempts = new Map<string, number[]>();
const DEFAULT_MIN_AGE_MS = 2500;
const MAX_FORM_AGE_MS = 6 * 60 * 60 * 1000;

function getClientIp(request: Request) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown';

    return request.headers.get('x-real-ip')
        || request.headers.get('cf-connecting-ip')
        || 'unknown';
}

function getProtectionPayload(body: unknown): CheckoutProtectionPayload {
    if (!body || typeof body !== 'object') return {};
    const record = body as Record<string, unknown>;
    const nested = record.checkoutProtection;
    if (nested && typeof nested === 'object') {
        return nested as CheckoutProtectionPayload;
    }

    const formData = record.formData;
    if (formData && typeof formData === 'object') {
        return formData as CheckoutProtectionPayload;
    }

    return record as CheckoutProtectionPayload;
}

function isRateLimited(key: string, options: ProtectionOptions) {
    const now = Date.now();
    const recent = (attempts.get(key) || []).filter((time) => now - time < options.windowMs);
    recent.push(now);
    attempts.set(key, recent);

    return recent.length > options.maxAttempts;
}

export function validateCheckoutProtection(
    request: Request,
    body: unknown,
    options: ProtectionOptions
): NextResponse | null {
    const payload = getProtectionPayload(body);
    const ip = getClientIp(request);

    if (isRateLimited(ip, options)) {
        return NextResponse.json(
            { error: 'Too many checkout attempts. Please wait a few minutes and try again.' },
            { status: 429 }
        );
    }

    if (payload.companyWebsite && String(payload.companyWebsite).trim()) {
        return NextResponse.json({ error: 'Checkout could not be completed.' }, { status: 400 });
    }

    const startedAt = Number(payload.checkoutStartedAt);
    const age = Date.now() - startedAt;
    const minAgeMs = options.minAgeMs ?? DEFAULT_MIN_AGE_MS;

    if (!Number.isFinite(startedAt) || age < minAgeMs || age > MAX_FORM_AGE_MS) {
        return NextResponse.json(
            { error: 'Checkout session expired. Please refresh the page and try again.' },
            { status: 400 }
        );
    }

    return null;
}
