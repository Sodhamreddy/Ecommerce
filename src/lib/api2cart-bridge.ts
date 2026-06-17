import { createHmac } from 'crypto';

const BRIDGE_URL = 'https://backend.jerseyperfume.com/bridge2cart/bridge.php';

function swapLetters(input: string) {
    const source = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const target = 'ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba9876543210+/';
    return input.replace(/[A-Za-z0-9+/]/g, (char) => target[source.indexOf(char)] || char);
}

function encodeBridgeData(data: unknown) {
    return swapLetters(Buffer.from(JSON.stringify(data), 'utf8').toString('base64'));
}

function signBridgePayload(payload: Record<string, string>, token: string) {
    const sorted = Object.keys(payload)
        .sort()
        .reduce((acc, key) => {
            acc[key] = payload[key];
            return acc;
        }, {} as Record<string, string>);
    const body = new URLSearchParams(sorted).toString();
    return createHmac('sha256', token).update(body).digest('hex');
}

async function callBridgePlatformAction(platformAction: string, data: unknown) {
    const token = process.env.VEEQO_BRIDGE_TOKEN;
    if (!token) {
        return { ok: false, skipped: true, message: 'VEEQO_BRIDGE_TOKEN is not configured.' };
    }

    const payload: Record<string, string> = {
        action: 'platform_action',
        platform_action: platformAction,
        data: encodeBridgeData(data),
    };
    const sign = signBridgePayload(payload, token);
    const body = new URLSearchParams({ ...payload, a2c_sign: sign });

    const response = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        cache: 'no-store',
        redirect: 'follow',
    });
    const text = await response.text();
    let parsed: any = null;
    try {
        parsed = JSON.parse(text);
    } catch {}

    if (!response.ok || String(text).startsWith('ERROR:') || parsed?.error) {
        return {
            ok: false,
            status: response.status,
            message: parsed?.error?.message || text.slice(0, 300) || 'Bridge request failed.',
        };
    }

    return { ok: true, status: response.status, data: parsed ?? text };
}

export async function notifyBridgeOrderCancelled(orderId: number, fromStatus: string) {
    return callBridgePlatformAction('triggerEvents', {
        store_id: 1,
        events: [
            {
                event: 'update',
                entity_type: 'order',
                entity_id: orderId,
                status: {
                    from: fromStatus,
                    to: 'cancelled',
                },
            },
        ],
    });
}
