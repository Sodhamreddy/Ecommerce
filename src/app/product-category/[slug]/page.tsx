import { Suspense } from 'react';
import { fetchProducts, fetchCategories } from '@/lib/api';
import ShopContent from '@/components/ShopContent';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
    try {
        const categories = await fetchCategories();
        return categories.map(cat => ({ slug: cat.slug }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const name = slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    return {
        title: `${name} | Jersey Perfume`,
        description: `Shop our ${name} collection at Jersey Perfume. 100% authentic designer fragrances at unbeatable prices.`,
    };
}

export default async function ProductCategoryPage({ params }: Props) {
    const { slug } = await params;

    // Fetch categories first so we can resolve slug → numeric ID for WC Store API v1
    const categories = await fetchCategories();
    const catEntry = categories.find(c => c.slug === slug);
    const catParam = catEntry ? catEntry.id.toString() : slug;

    const { products, totalPages, totalProducts } = await fetchProducts(1, 24, '', catParam);

    return (
        <Suspense fallback={<div className="container py-10">Loading...</div>}>
            <ShopContent
                initialProducts={products}
                initialCategories={categories}
                initialTotalPages={totalPages}
                initialTotalProducts={totalProducts}
                initialCategoryQuery={slug}
                initialSearchQuery=""
            />
        </Suspense>
    );
}
