import { fetchProducts as apiFetchProducts } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';
import { fetchWithRetry } from '@/lib/fetch-utils';

export async function fetchProductsAction(
    page = 1,
    perPage = 20,
    search = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    orderby = 'date',
    order = 'desc',
    onSale = false
) {
    return apiFetchProducts(page, perPage, search, category, minPrice, maxPrice, orderby, order, onSale);
}

const COMMON_HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

export async function fetchReviewsAction(productId: number) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/wc/store/v1/products/${productId}/reviews`, {
            headers: COMMON_HEADERS
        }, 3, 1000, 'Reviews');
        if (!response.ok) {
            console.warn(`Failed to fetch reviews: ${response.statusText}`);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.warn('Error fetching reviews:', error);
        return [];
    }
}

export async function fetchBlogPostsAction(limit = 3) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/wp/v2/posts?per_page=${limit}&_embed`, {
            headers: COMMON_HEADERS
        }, 3, 1000, 'BlogPosts');
        if (!response.ok) {
            console.warn(`Failed to fetch blogs: ${response.statusText}`);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.warn('Error fetching blogs:', error);
        return [];
    }
}

export async function fetchWPPageAction(slug: string) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/wp/v2/pages?slug=${slug}`, {
            headers: COMMON_HEADERS
        }, 3, 1000, `Page-${slug}`);
        if (!response.ok) {
            console.warn(`Failed to fetch page ${slug}: ${response.statusText}`);
            return null;
        }
        const pages = await response.json();
        return Array.isArray(pages) && pages.length > 0 ? pages[0] : null;
    } catch (error) {
        console.warn(`Error fetching page ${slug}:`, error);
        return null;
    }
}
