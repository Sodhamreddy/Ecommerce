import { fetchProducts, fetchCategories } from '@/lib/api';
import ShopContent from '@/components/ShopContent';

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedParams = await searchParams;
    const categoryQuery = typeof resolvedParams.category === 'string' ? resolvedParams.category : '';
    const searchQuery = typeof resolvedParams.search === 'string' ? resolvedParams.search : '';

    const { products, totalPages, totalProducts } = await fetchProducts(1, 24, searchQuery, categoryQuery);
    const categories = await fetchCategories();

    return (
        <ShopContent
            initialProducts={products}
            initialCategories={categories}
            initialTotalPages={totalPages}
            initialTotalProducts={totalProducts}
            initialCategoryQuery={categoryQuery}
            initialSearchQuery={searchQuery}
        />
    );
}
