export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3,
    backoff = typeof window === 'undefined' ? 3000 : 1000,
    source = 'API'
): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            
            // If we get a 403, 500, or 429, we retry
            if (response.status === 403 || response.status === 500 || response.status === 429) {
                console.warn(`[${source}] Attempt ${i + 1} failed with ${response.status}. Retrying in ${backoff}ms...`);
                await delay(backoff);
                backoff *= 2; // Exponential backoff
                continue;
            }
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`[${source}] Attempt ${i + 1} errored. Retrying in ${backoff}ms...`);
            await delay(backoff);
            backoff *= 2;
        }
    }
    throw new Error(`Failed to fetch after ${retries} retries`);
}
