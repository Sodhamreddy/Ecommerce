import { Suspense } from 'react';
import { fetchProducts, fetchCategories, fetchTags } from '@/lib/api';
import ShopContent from '@/components/ShopContent';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
    try {
        const tags = await fetchTags();
        return tags.map(t => ({ slug: t.slug }));
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
        description: `Shop ${name} fragrances at Jersey Perfume. 100% authentic designer fragrances at unbeatable prices.`,
        alternates: { canonical: `https://jerseyperfume.com/product-tag/${slug}/` },
        openGraph: {
            title: `${name} | Jersey Perfume`,
            description: `Shop ${name} fragrances at Jersey Perfume.`,
            url: `https://jerseyperfume.com/product-tag/${slug}/`,
        },
    };
}

export default async function ProductTagPage({ params }: Props) {
    const { slug } = await params;

    const [tags, categories] = await Promise.all([fetchTags(), fetchCategories()]);
    const tagEntry = tags.find(t => t.slug === slug);
    const tagParam = tagEntry ? tagEntry.id.toString() : slug;

    const { products, totalPages, totalProducts } = await fetchProducts(
        1, 24, '', '', '', '', 'date', 'desc', false, tagParam
    );

    return (
        <Suspense fallback={<div className="container py-10">Loading...</div>}>
            <ShopContent
                initialProducts={products}
                initialCategories={categories}
                initialTotalPages={totalPages}
                initialTotalProducts={totalProducts}
                initialCategoryQuery=""
                initialSearchQuery=""
                initialTagQuery={tagParam}
            />
        </Suspense>
    );
}
