export interface ProductImage {
    id: number;
    src: string;
    thumbnail: string;
    alt: string;
}

export interface ProductCategory {
    id: number;
    name: string;
    slug: string;
}

export interface ProductPrice {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_symbol: string;
    currency_code: string;
    currency_minor_unit: number;
}

export interface ProductAttribute {
    id: number;
    name: string;
    taxonomy: string;
    has_variations: boolean;
    terms: { id: number; name: string; slug: string }[];
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    short_description: string;
    prices: ProductPrice;
    images: ProductImage[];
    categories: ProductCategory[];
    is_in_stock: boolean;
    on_sale: boolean;
    attributes: ProductAttribute[];
    related_products?: number[];
}

const API_URL = 'https://jerseyperfume.com/wp-json/wc/store/v1/products';

export async function fetchProducts(
    page = 1,
    perPage = 20,
    search = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    orderby = 'date',
    order = 'desc'
): Promise<{ products: Product[], totalPages: number, totalProducts: number }> {
    try {
        let url = `${API_URL}?page=${page}&per_page=${perPage}&orderby=${orderby}&order=${order}`;

        if (search) url += `&search=${search}`;
        if (category) {
            // Check if the category is a string (slug) instead of a numeric ID
            if (isNaN(Number(category))) {
                const categories = await fetchCategories();
                const matchedCategory = categories.find(c => c.slug === category);
                if (matchedCategory) {
                    url += `&category=${matchedCategory.id}`;
                } else {
                    // Category not found, return empty eagerly to avoid returning all products
                    return { products: [], totalPages: 0, totalProducts: 0 };
                }
            } else {
                url += `&category=${category}`;
            }
        }
        if (minPrice) url += `&min_price=${minPrice}`;
        if (maxPrice) url += `&max_price=${maxPrice}`;

        const requestInit: RequestInit = typeof window === 'undefined' ? { next: { revalidate: 3600 } } : {};
        const response = await fetch(url, requestInit);

        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const totalProducts = parseInt(response.headers.get('X-WP-Total') || '0');
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
        const data = await response.json();

        return { products: data, totalPages, totalProducts };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { products: [], totalPages: 0, totalProducts: 0 };
    }
}

export async function fetchCategories(): Promise<Category[]> {
    try {
        const requestInit: RequestInit = typeof window === 'undefined' ? { next: { revalidate: 3600 } } : {};
        const response = await fetch(`${API_URL}/categories`, requestInit);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    count: number;
}

export async function fetchAllProducts(): Promise<Product[]> {
    let allProducts: Product[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const { products } = await fetchProducts(page, perPage);
        if (products.length === 0) break;
        allProducts = [...allProducts, ...products];
        if (products.length < perPage) break;
        page++;
    }

    return allProducts;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
    try {
        const response = await fetch(`${API_URL}?slug=${slug}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data[0] || null;
    } catch (error) {
        console.error(`Error fetching product ${slug}:`, error);
        return null;
    }
}

export async function fetchProductsByIDs(ids: number[]): Promise<Product[]> {
    if (!ids || ids.length === 0) return [];
    try {
        const response = await fetch(`${API_URL}?include=${ids.join(',')}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching products by IDs:', error);
        return [];
    }
}
