import { Suspense } from 'react';
import { fetchProducts, fetchCategories } from '@/lib/api';
import ShopContent from '@/components/ShopContent';
import { Metadata } from 'next';

// Static build — client-side useSearchParams() in ShopContent handles URL filters
export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Shop | Jersey Perfume',
    description: 'Browse our full collection of designer and niche fragrances at Jersey Perfume.',
};

export default async function ShopPage() {
    const { products, totalPages, totalProducts } = await fetchProducts(1, 24);
    const categories = await fetchCategories();

    return (
        <Suspense fallback={<div className="container py-10">Loading Shop...</div>}>
            <ShopContent
                initialProducts={products}
                initialCategories={categories}
                initialTotalPages={totalPages}
                initialTotalProducts={totalProducts}
                initialCategoryQuery=""
                initialSearchQuery=""
            />
        </Suspense>
    );
}
