import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * On-demand revalidation endpoint.
 * Called by WordPress webhooks to instantly refresh pages when content changes.
 *
 * Usage:
 *   POST /api/revalidate?secret=YOUR_SECRET&type=blog
 *   POST /api/revalidate?secret=YOUR_SECRET&type=slider
 *   POST /api/revalidate?secret=YOUR_SECRET&type=all
 *
 * Set REVALIDATE_SECRET in your .env.local file.
 *
 * ─── WORDPRESS SETUP (Code Snippets plugin) ────────────────────────────────
 * Add this PHP snippet to instantly refresh the site when you publish/update:
 *
 * function jersey_revalidate(string $type): void {
 *   $secret = 'YOUR_SECRET_HERE'; // must match REVALIDATE_SECRET in .env.local
 *   $url    = 'https://jerseyperfume.com/api/revalidate?secret=' . $secret . '&type=' . $type;
 *   wp_remote_post($url, ['timeout' => 5, 'blocking' => false]);
 * }
 *
 * // Revalidate when a blog post is published or updated
 * add_action('save_post', function($post_id, $post) {
 *   if ($post->post_type === 'post' && $post->post_status === 'publish') {
 *     jersey_revalidate('blog');
 *   }
 * }, 10, 2);
 *
 * // Revalidate when SmartSlider is saved
 * add_action('nextend2_smartslider3_slider_save_after', function() {
 *   jersey_revalidate('slider');
 * });
 * ────────────────────────────────────────────────────────────────────────────
 */
export async function POST(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret');

    if (!process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ error: 'REVALIDATE_SECRET not configured' }, { status: 500 });
    }

    if (secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get('type') || 'all';

    if (type === 'blog' || type === 'all') {
        revalidatePath('/blog');
        revalidatePath('/blog/[slug]', 'page');
        revalidatePath('/');
    }

    if (type === 'slider' || type === 'all') {
        revalidatePath('/');
    }

    if (type === 'products' || type === 'all') {
        revalidatePath('/shop');
        revalidatePath('/');
    }

    return NextResponse.json({ revalidated: true, type, timestamp: new Date().toISOString() });
}

// Also support GET for easy browser testing
export async function GET(req: NextRequest) {
    return POST(req);
}
