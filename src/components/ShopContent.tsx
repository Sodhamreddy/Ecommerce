"use client";

import { useState, useEffect } from 'react';
import { Product, Category, fetchCategories } from '@/lib/api';
import { fetchProductsAction } from '@/app/actions';
import ProductCard from './ProductCard';
import { Search, ChevronRight, LayoutGrid, List, ChevronLeft, SlidersHorizontal } from 'lucide-react';
import styles from './ShopContent.module.css';

interface ShopContentProps {
    initialProducts: Product[];
    initialCategories: Category[];
    initialTotalPages: number;
    initialTotalProducts: number;
    initialCategoryQuery?: string;
    initialSearchQuery?: string;
}

export default function ShopContent({
    initialProducts,
    initialCategories,
    initialTotalPages,
    initialTotalProducts,
    initialCategoryQuery = '',
    initialSearchQuery = ''
}: ShopContentProps) {
    const [products, setProducts] = useState(initialProducts);
    const [categories] = useState(initialCategories);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const [totalProducts, setTotalProducts] = useState(initialTotalProducts);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(initialSearchQuery);
    const [selectedCategory, setSelectedCategory] = useState(initialCategoryQuery);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
    const [sortBy, setSortBy] = useState('date');
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

    const handleFilter = async () => {
        setLoading(true);
        const { products: newProducts, totalPages: newTotalPages, totalProducts: newTotal } = await fetchProductsAction(
            1, 24, search, selectedCategory, priceRange.min.toString(), priceRange.max.toString(), sortBy
        );
        setProducts(newProducts);
        setTotalPages(newTotalPages);
        setTotalProducts(newTotal);
        setPage(1);
        setLoading(false);
    };

    const handlePageChange = async (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setLoading(true);
        setPage(newPage);
        const { products: newProducts } = await fetchProductsAction(
            newPage, 24, search, selectedCategory, priceRange.min.toString(), priceRange.max.toString(), sortBy
        );
        setProducts(newProducts);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={styles.shopContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.widget}>
                    <h3 className={styles.widgetTitle}>SEARCH</h3>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Search products"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                        />
                        <Search className={styles.searchIcon} size={18} onClick={handleFilter} />
                    </div>
                </div>

                <div className={styles.widget}>
                    <h3 className={styles.widgetTitle}>PRODUCT CATEGORIES</h3>
                    <ul className={styles.categoryList}>
                        <li
                            className={selectedCategory === '' ? styles.activeCategory : ''}
                            onClick={() => { setSelectedCategory(''); handleFilter(); }}
                        >
                            All Products
                        </li>
                        {categories.map(cat => (
                            <li
                                key={cat.id}
                                className={selectedCategory === cat.slug ? styles.activeCategory : ''}
                                onClick={() => { setSelectedCategory(cat.slug); handleFilter(); }}
                            >
                                {cat.name} <span>({cat.count})</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.widget}>
                    <h3 className={styles.widgetTitle}>FILTER BY PRICE</h3>
                    <div className={styles.priceFilter}>
                        {/* Simple price slider implementation would go here */}
                        <input
                            type="range"
                            min="0"
                            max="2000"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                            className={styles.rangeInput}
                        />
                        <div className={styles.priceDisplay}>
                            Price: ${priceRange.min} — ${priceRange.max}
                        </div>
                        <button className={styles.filterBtn} onClick={handleFilter}>FILTER</button>
                    </div>
                </div>
            </aside>

            <main className={styles.mainContent}>
                <div className={styles.topBar}>
                    <div className={styles.breadcrumb}>
                        Home <ChevronRight size={14} /> Shop
                    </div>
                    <div className={styles.controls}>
                        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); handleFilter(); }}>
                            <option value="date">Default sorting</option>
                            <option value="popularity">Sort by popularity</option>
                            <option value="rating">Sort by average rating</option>
                            <option value="date">Sort by latest</option>
                            <option value="price">Sort by price: low to high</option>
                            <option value="price-desc">Sort by price: high to low</option>
                        </select>
                        <div className={styles.viewToggle}>
                            <LayoutGrid
                                className={viewType === 'grid' ? styles.activeView : ''}
                                size={20}
                                onClick={() => setViewType('grid')}
                            />
                            <List
                                className={viewType === 'list' ? styles.activeView : ''}
                                size={20}
                                onClick={() => setViewType('list')}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loader}>Loading products...</div>
                ) : (
                    <>
                        <div className={viewType === 'grid' ? styles.grid : styles.list}>
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => handlePageChange(page - 1)}
                                    className={styles.pageBtn}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = page;
                                    if (page <= 3) pageNum = i + 1;
                                    else if (page > totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = page - 2 + i;

                                    if (pageNum <= 0 || pageNum > totalPages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            className={`${styles.pageBtn} ${page === pageNum ? styles.activePage : ''}`}
                                            onClick={() => handlePageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => handlePageChange(page + 1)}
                                    className={styles.pageBtn}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
