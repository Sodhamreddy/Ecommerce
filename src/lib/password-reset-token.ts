import { createHmac, timingSafeEqual } from 'crypto';

export type PasswordResetPayload = {
    id: number;
    email: string;
    login: string;
    exp: number;
};

const encoder = new TextEncoder();

function base64UrlEncode(value: string) {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function getSecret() {
    return process.env.PASSWORD_RESET_SECRET
        || process.env.REVALIDATE_SECRET
        || process.env.WC_CONSUMER_SECRET
        || '';
}

function signPayload(payload: string) {
    const secret = getSecret();
    if (!secret) throw new Error('Password reset secret is not configured.');
    return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createPasswordResetToken(payload: PasswordResetPayload) {
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyPasswordResetToken(token: string): PasswordResetPayload | null {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expected = signPayload(encodedPayload);
    const expectedBytes = encoder.encode(expected);
    const signatureBytes = encoder.encode(signature);
    if (
        expectedBytes.length !== signatureBytes.length
        || !timingSafeEqual(expectedBytes, signatureBytes)
    ) {
        return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as PasswordResetPayload;
    if (!payload?.id || !payload?.email || !payload?.exp || Date.now() > payload.exp) {
        return null;
    }
    return payload;
}
