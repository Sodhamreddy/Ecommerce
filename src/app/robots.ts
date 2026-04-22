import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/wishlist/', '/account/', '/checkout/'],
        },
        sitemap: 'https://jerseyperfume.com/sitemap.xml',
    };
}
