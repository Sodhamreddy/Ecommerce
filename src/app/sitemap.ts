import { fetchCategories, fetchTags } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';
import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const SITE_URL = 'https://jerseyperfume.com';

type SitemapEntry = {
    slug: string;
    modified?: string;
    date_modified?: string;
};

async function fetchPaginatedEntries(urlForPage: (page: number) => string): Promise<SitemapEntry[]> {
    const entries: SitemapEntry[] = [];
    let page = 1;

    while (true) {
        try {
            const res = await fetch(urlForPage(page), {
                headers: { Accept: 'application/json' },
                next: { revalidate: 3600 },
            });
            if (!res.ok) break;

            const data = await res.json().catch(() => []);
            if (!Array.isArray(data) || data.length === 0) break;

            entries.push(...data);
            const totalPages = Number(res.headers.get('X-WP-TotalPages') || 0);
            if (data.length < 100 || (totalPages && page >= totalPages)) break;
            page++;
        } catch {
            break;
        }
    }

    return entries;
}

async function fetchBlogEntries(): Promise<SitemapEntry[]> {
    return fetchPaginatedEntries((page) =>
        `${API_BASE_URL}/wp/v2/posts?per_page=100&page=${page}&_fields=slug,modified`
    );
}

async function fetchProductEntries(): Promise<SitemapEntry[]> {
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;
    if (key && secret) {
        return fetchPaginatedEntries((page) => {
            const params = new URLSearchParams({
                per_page: '100',
                page: String(page),
                status: 'publish',
                consumer_key: key,
                consumer_secret: secret,
                _fields: 'slug,date_modified',
            });
            return `${API_BASE_URL}/wc/v3/products?${params.toString()}`;
        });
    }

    return fetchPaginatedEntries((page) =>
        `${API_BASE_URL}/wc/store/v1/products?per_page=100&page=${page}&_fields=slug`
    );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [categories, tags, productEntries, blogEntries] = await Promise.all([
        fetchCategories(),
        fetchTags(),
        fetchProductEntries(),
        fetchBlogEntries(),
    ]);
    const siteUrl = SITE_URL;

    const staticPages: MetadataRoute.Sitemap = [
        { url: `${siteUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${siteUrl}/shop/`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${siteUrl}/blog/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
        { url: `${siteUrl}/offers/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${siteUrl}/wishlist/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
        { url: `${siteUrl}/account/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
        { url: `${siteUrl}/track-order/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ];

    const categoryPages: MetadataRoute.Sitemap = categories
        .filter(c => c.count > 0)
        .map(c => ({
            url: `${siteUrl}/product-category/${c.slug}/`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        }));

    const productPages: MetadataRoute.Sitemap = productEntries.map(product => ({
        url: `${siteUrl}/product/${product.slug}/`,
        lastModified: product.date_modified ? new Date(product.date_modified) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    const blogPages: MetadataRoute.Sitemap = blogEntries.map(post => ({
        url: `${siteUrl}/blog/${post.slug}/`,
        lastModified: post.modified ? new Date(post.modified) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    const tagPages: MetadataRoute.Sitemap = tags
        .filter(t => t.count > 0)
        .map(t => ({
            url: `${siteUrl}/product-tag/${t.slug}/`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));

    return [...staticPages, ...categoryPages, ...tagPages, ...productPages, ...blogPages];
}
