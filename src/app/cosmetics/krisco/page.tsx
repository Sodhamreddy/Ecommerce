import { Metadata } from 'next';
import { fetchKriscoProducts } from '@/lib/krisco';
import KriscoCatalog from '@/components/KriscoCatalog';

// Live catalog + per-request credentials — render dynamically, never prerender.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Krisco Cosmetics | Jersey Perfume',
    description: 'Browse the Krisco Sales cosmetics, fragrance and personal-care catalog.',
};

export default async function KriscoPage() {
    const { products, total, hasMore, error } = await fetchKriscoProducts({ limit: 24, offset: 0 });

    return (
        <div className="container pt-12">
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <span style={{ color: '#d4a853', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                    Cosmetics
                </span>
                <h1 style={{ fontSize: '3rem', fontWeight: 600, color: '#111', marginTop: '0.5rem' }}>Krisco</h1>
                <p style={{ color: '#666', maxWidth: '640px', margin: '0.5rem auto' }}>
                    Cosmetics, fragrance and personal-care products from the Krisco Sales catalog.
                </p>
            </div>

            <KriscoCatalog
                initialProducts={products}
                initialTotal={total}
                initialHasMore={hasMore}
                initialError={error}
            />
        </div>
    );
}
