// Removed 'use server' for static export compatibility

import { fetchProducts as apiFetchProducts } from '@/lib/api';

export async function fetchProductsAction(
    page = 1,
    perPage = 20,
    search = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    orderby = 'date',
    order = 'desc'
) {
    return apiFetchProducts(page, perPage, search, category, minPrice, maxPrice, orderby, order);
}

export async function fetchReviewsAction(productId: number) {
    try {
        const response = await fetch(`https://jerseyperfume.com/wp-json/wc/store/v1/products/${productId}/reviews`);
        if (!response.ok) {
            console.error(`Failed to fetch reviews: ${response.statusText}`);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

export async function fetchBlogPostsAction(limit = 3) {
    try {
        const response = await fetch(`https://jerseyperfume.com/wp-json/wp/v2/posts?per_page=${limit}&_embed`);
        if (!response.ok) {
            console.error(`Failed to fetch blogs: ${response.statusText}`);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return [];
    }
}

export async function fetchWPPageAction(slug: string) {
    try {
        const response = await fetch(`https://jerseyperfume.com/wp-json/wp/v2/pages?slug=${slug}`);
        if (!response.ok) {
            console.error(`Failed to fetch page ${slug}: ${response.statusText}`);
            return null;
        }
        const pages = await response.json();
        return Array.isArray(pages) && pages.length > 0 ? pages[0] : null;
    } catch (error) {
        console.error(`Error fetching page ${slug}:`, error);
        return null;
    }
}
