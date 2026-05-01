import { fetchProducts, fetchCategories, fetchTags } from '@/lib/api';
import { fetchAllWPPosts } from '@/lib/woocommerce';
import { MetadataRoute } from 'next';

export const revalidate = 3600;

const SITE_URL = 'https://jerseyperfume.com';

async function fetchBlogSlugs(): Promise<string[]> {
    try {
        const posts = await fetchAllWPPosts();
        return posts.map(p => p.slug);
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
    const [categories, tags, productSlugs, blogSlugs] = await Promise.all([
        fetchCategories(),
        fetchTags(),
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
