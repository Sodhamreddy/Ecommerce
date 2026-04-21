/** @type {import('next-sitemap').IConfig} */

const SITE_URL = 'https://jerseyperfume.com';

async function fetchAllSlugs() {
    const paths = [];

    try {
        // --- Products ---
        let productPage = 1;
        while (true) {
            const res = await fetch(
                `https://backend.jerseyperfume.com/wp-json/wc/store/v1/products?per_page=100&page=${productPage}`,
                { headers: { Accept: 'application/json' } }
            );
            if (!res.ok) break;
            const products = await res.json();
            if (!Array.isArray(products) || products.length === 0) break;
            for (const p of products) {
                paths.push({
                    loc: `/product/${p.slug}`,
                    changefreq: 'weekly',
                    priority: 0.8,
                    lastmod: p.date_modified || new Date().toISOString(),
                });
            }
            if (products.length < 100) break;
            productPage++;
        }
    } catch (e) {
        console.warn('[sitemap] products fetch failed:', e.message);
    }

    try {
        // --- Blog Posts ---
        let blogPage = 1;
        while (true) {
            const res = await fetch(
                `https://backend.jerseyperfume.com/wp-json/wp/v2/posts?per_page=100&page=${blogPage}&_fields=slug,modified`,
                { headers: { Accept: 'application/json' } }
            );
            if (!res.ok) break;
            const posts = await res.json();
            if (!Array.isArray(posts) || posts.length === 0) break;
            for (const p of posts) {
                paths.push({
                    loc: `/blog/${p.slug}`,
                    changefreq: 'monthly',
                    priority: 0.6,
                    lastmod: p.modified || new Date().toISOString(),
                });
            }
            if (posts.length < 100) break;
            blogPage++;
        }
    } catch (e) {
        console.warn('[sitemap] blog posts fetch failed:', e.message);
    }

    try {
        // --- Info / WP Pages ---
        const res = await fetch(
            `https://backend.jerseyperfume.com/wp-json/wp/v2/pages?per_page=100&_fields=slug,modified`,
            { headers: { Accept: 'application/json' } }
        );
        if (res.ok) {
            const pages = await res.json();
            const excluded = new Set(['home', 'sample-page', 'cart', 'checkout', 'my-account', 'shop']);
            for (const p of pages) {
                if (!excluded.has(p.slug)) {
                    paths.push({
                        loc: `/info/${p.slug}`,
                        changefreq: 'monthly',
                        priority: 0.5,
                        lastmod: p.modified || new Date().toISOString(),
                    });
                }
            }
        }
    } catch (e) {
        console.warn('[sitemap] wp pages fetch failed:', e.message);
    }

    return paths;
}

module.exports = {
    siteUrl: SITE_URL,
    generateRobotsTxt: true,
    outDir: './out',
    exclude: ['/cart', '/checkout', '/order-success', '/account', '/track-order', '/wishlist', '/api/*'],
    robotsTxtOptions: {
        policies: [
            { userAgent: '*', allow: '/' },
            { userAgent: '*', disallow: ['/cart', '/checkout', '/order-success', '/account', '/track-order'] },
        ],
        additionalSitemaps: [`${SITE_URL}/sitemap.xml`],
    },
    additionalPaths: fetchAllSlugs,
};
