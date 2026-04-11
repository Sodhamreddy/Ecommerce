import { Suspense } from 'react';
import { fetchProducts, fetchCategories } from '@/lib/api';
import ShopContent from '@/components/ShopContent';
import { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
    title: 'Special Offers | Jersey Perfume',
    description: 'Discover luxury fragrances at unbeatable prices. Shop our exclusive sale with up to 80% off.',
};

export default async function OffersPage() {
    const { products, totalPages, totalProducts } = await fetchProducts(1, 24, "", "", "", "", "date", "desc", true);
    const categories = await fetchCategories();

    return (
        <Suspense fallback={<div className="container py-20 text-center">Loading luxury offers...</div>}>
            <div className="container pt-12">
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <span style={{ color: '#d4a853', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Limited Time</span>
                    <h1 style={{ fontSize: '3rem', fontWeight: 600, color: '#111', marginTop: '0.5rem' }}>Special Offers</h1>
                    <p style={{ color: '#666', maxWidth: '600px', margin: '0.5rem auto' }}>Authentic designer fragrances with major discounts. Grab your signature scent before it sells out.</p>
                </div>
            </div>
            <ShopContent
                initialProducts={products}
                initialCategories={categories}
                initialTotalPages={totalPages}
                initialTotalProducts={totalProducts}
                initialOnSale={true}
            />
        </Suspense>
    );
}
