"use client";

import { useState, useCallback, useRef } from 'react';
import { Search, PackageCheck, PackageX, Loader2 } from 'lucide-react';
import type { KriscoProduct } from '@/lib/krisco';
import styles from './KriscoCatalog.module.css';

const PAGE_SIZE = 24;

interface Props {
    initialProducts: KriscoProduct[];
    initialTotal: number;
    initialHasMore: boolean;
    initialError?: string;
}

function formatPrice(value: number | null): string | null {
    if (value === null || value === undefined || value <= 0 || Number.isNaN(value)) return null;
    return `$${value.toFixed(2)}`;
}

function KriscoCard({ product }: { product: KriscoProduct }) {
    const [imgFailed, setImgFailed] = useState(false);
    const price = formatPrice(product.unit_price);
    const msrp = formatPrice(product.msrp);
    const showMsrp = msrp && product.msrp !== null && product.unit_price !== null && product.msrp > product.unit_price;
    const inStock = (product.stock ?? 0) > 0;
    const showImage = product.image && !imgFailed;

    return (
        <div className={styles.card}>
            <div className={styles.imageBox}>
                {showImage ? (
                    // Krisco serves SharePoint image URLs (often with temp tokens that can
                    // fail to hotlink). Plain <img> with an onError fallback avoids breakage.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={product.image as string}
                        alt={product.description}
                        className={styles.image}
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <div className={styles.imageFallback}>
                        <span>{(product.brand || product.description || '?').charAt(0)}</span>
                    </div>
                )}
                {inStock ? (
                    <span className={`${styles.stockBadge} ${styles.inStock}`}>
                        <PackageCheck size={12} /> {product.stock} in stock
                    </span>
                ) : (
                    <span className={`${styles.stockBadge} ${styles.outStock}`}>
                        <PackageX size={12} /> Out of stock
                    </span>
                )}
            </div>

            <div className={styles.content}>
                {product.classification && (
                    <span className={styles.categoryTag}>{product.classification}</span>
                )}
                {product.brand && <div className={styles.brand}>{product.brand}</div>}
                <h3 className={styles.name}>{product.description}</h3>

                <div className={styles.meta}>
                    <span className={styles.sku}>SKU: {product.sku}</span>
                </div>

                <div className={styles.priceRow}>
                    {price ? (
                        <>
                            <span className={styles.price}>{price}</span>
                            {showMsrp && <span className={styles.msrp}>{msrp}</span>}
                        </>
                    ) : (
                        <span className={styles.noPrice}>Contact for price</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function KriscoCatalog({ initialProducts, initialTotal, initialHasMore, initialError }: Props) {
    const [products, setProducts] = useState<KriscoProduct[]>(initialProducts);
    const [total, setTotal] = useState(initialTotal);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(initialError);
    const [searchInput, setSearchInput] = useState('');
    const activeSearch = useRef('');

    const load = useCallback(async (search: string, offset: number, append: boolean) => {
        setLoading(true);
        setError(undefined);
        try {
            const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
            if (search) params.set('search', search);
            const res = await fetch(`/api/krisco/products/?${params.toString()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
                if (!append) setProducts([]);
                return;
            }
            setProducts(prev => (append ? [...prev, ...data.products] : data.products));
            setTotal(data.total);
            setHasMore(data.hasMore);
        } catch (err) {
            setError(`Could not load products: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    const onSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const term = searchInput.trim();
        activeSearch.current = term;
        load(term, 0, false);
    }, [searchInput, load]);

    const loadMore = useCallback(() => {
        load(activeSearch.current, products.length, true);
    }, [load, products.length]);

    return (
        <div className={styles.wrapper}>
            <form className={styles.searchBar} onSubmit={onSearch}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search Krisco catalog by name, brand or SKU…"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />
                <button type="submit" className={styles.searchBtn} disabled={loading}>Search</button>
            </form>

            <p className={styles.resultCount}>
                {total.toLocaleString()} product{total === 1 ? '' : 's'} in the Krisco catalog
                {activeSearch.current ? ` matching “${activeSearch.current}”` : ''}
            </p>

            {error && <div className={styles.errorBox}>{error}</div>}

            {products.length === 0 && !loading && !error && (
                <div className={styles.empty}>No products found.</div>
            )}

            <div className={styles.grid}>
                {products.map((p, i) => (
                    <KriscoCard key={`${p.sku}-${i}`} product={p} />
                ))}
            </div>

            {loading && (
                <div className={styles.loadingRow}>
                    <Loader2 size={20} className={styles.spinner} /> Loading…
                </div>
            )}

            {hasMore && !loading && (
                <div className={styles.loadMoreRow}>
                    <button className={styles.loadMoreBtn} onClick={loadMore} type="button">Load more</button>
                </div>
            )}
        </div>
    );
}
