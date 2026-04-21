import { fetchProducts, fetchCategories } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';
import { MetadataRoute } from 'next';

const SITE_URL = 'https://jerseyperfume.com';

async function fetchBlogSlugs(): Promise<string[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/wp/v2/posts?per_page=100&_fields=slug`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const posts = await res.json();
        return posts.map((p: { slug: string }) => p.slug);
    } catch {
        return [];
    }
}

async function fetchAllProductSlugs(): Promise<string[]> {
    const slugs: string[] = [];
    let page = 1;
    while (true) {
        const { products, totalPages } = await fetchProducts(page, 100);
        slugs.push(...products.map(p => p.slug));
        if (page >= totalPages) break;
        page++;
    }
    return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [categories, productSlugs, blogSlugs] = await Promise.all([
        fetchCategories(),
        fetchAllProductSlugs(),
        fetchBlogSlugs(),
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

    const productPages: MetadataRoute.Sitemap = productSlugs.map(slug => ({
        url: `${siteUrl}/product/${slug}/`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    const blogPages: MetadataRoute.Sitemap = blogSlugs.map(slug => ({
        url: `${siteUrl}/blog/${slug}/`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
}
