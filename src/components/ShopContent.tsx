"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product, Category } from '@/lib/api';
import { fetchProductsAction } from '@/app/actions';
import ProductCard from './ProductCard';
import { Search, ChevronRight, LayoutGrid, List, ChevronLeft, SlidersHorizontal, X, Flame, Star, Tag, Sparkles, TrendingUp, Gift } from 'lucide-react';
import styles from './ShopContent.module.css';

interface ShopContentProps {
    initialProducts: Product[];
    initialCategories: Category[];
    initialTotalPages: number;
    initialTotalProducts: number;
    initialCategoryQuery?: string;
    initialSearchQuery?: string;
    initialOnSale?: boolean;
}

const SORT_OPTIONS = [
    { value: 'date', label: 'Newest First' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'price', label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
];

// Quick-access trending category tabs with icons
const QUICK_CATS = [
    { slug: '', label: 'All', icon: <Sparkles size={14} /> },
    { slug: 'mens-fragrances', label: 'Men\'s', icon: <TrendingUp size={14} /> },
    { slug: 'womens-fragrances', label: 'Women\'s', icon: <TrendingUp size={14} /> },
    { slug: 'gift-sets', label: 'Gift Sets', icon: <Gift size={14} /> },
    { slug: 'best-sellers', label: 'Best Sellers', icon: <Star size={14} /> },
    { slug: 'bundles', label: 'Bundles', icon: <Tag size={14} /> },
];

export default function ShopContent({
    initialProducts,
    initialCategories,
    initialTotalPages,
    initialTotalProducts,
    initialCategoryQuery = '',
    initialSearchQuery = '',
    initialOnSale = false
}: ShopContentProps) {
    const [products, setProducts] = useState(initialProducts);
    const [categories] = useState(initialCategories);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const [totalProducts, setTotalProducts] = useState(initialTotalProducts);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(initialSearchQuery);
    const [selectedCategory, setSelectedCategory] = useState(initialCategoryQuery);
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(400);
    const [sortBy, setSortBy] = useState('date');
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [isOnSale] = useState(initialOnSale);
    const quickTabsRef = useRef<HTMLDivElement>(null);

    const searchParams = useSearchParams();
    
    // Initial sync with URL params
    useEffect(() => {
        const cat = searchParams.get('category') || '';
        const s = searchParams.get('search') || '';
        if (cat !== selectedCategory || s !== search) {
            if (cat) setSelectedCategory(cat);
            if (s) setSearch(s);
            runFilter({ cat, s });
        }
    }, [searchParams]);

    // Sticky quick tabs on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (quickTabsRef.current) {
                const rect = quickTabsRef.current.getBoundingClientRect();
                setIsSticky(rect.top <= 70);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const runFilter = async (overrides: {
        s?: string; cat?: string; sort?: string; pmn?: number; pmx?: number; pg?: number;
    } = {}) => {
        setLoading(true);
        const s = overrides.s ?? search;
        const catSlug = overrides.cat ?? selectedCategory;
        const sort = overrides.sort ?? sortBy;
        const pmn = overrides.pmn ?? priceMin;
        const pmx = overrides.pmx ?? priceMax;
        const pg = overrides.pg ?? 1;

        // WC Store API accepts category slug directly
        const { products: newProducts, totalPages: newTotalPages, totalProducts: newTotal } =
            await fetchProductsAction(pg, 24, s, catSlug, pmn.toString(), pmx.toString(), sort, 'desc', isOnSale);

        setProducts(newProducts);
        setTotalPages(newTotalPages);
        setTotalProducts(newTotal);
        setPage(pg);
        setLoading(false);
        if (pg === 1) window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper to clean HTML entities like Men&#8217;s
    const decodeHTML = (html: string) => {
        if (typeof window === 'undefined') {
            return html.replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(Number(dec)))
                       .replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#039;/g, "'");
        }
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const selectCategory = (slug: string) => {
        setSelectedCategory(slug);
        runFilter({ cat: slug });
        setSidebarOpen(false);
    };

    const handleSort = (v: string) => {
        setSortBy(v);
        runFilter({ sort: v });
    };

    const handleSearch = () => {
        runFilter({ s: search });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        runFilter({ pg: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearCategory = () => {
        setSelectedCategory('');
        runFilter({ cat: '' });
    };

    const selectedCat = categories.find(c => c.slug === selectedCategory);
    const activeQuickCat = QUICK_CATS.find(c => c.slug === selectedCategory) || QUICK_CATS[0];

    return (
        <div className={styles.shopWrapper}>

            {/* ── Quick Category Tabs (Trending) ── */}
            <div ref={quickTabsRef} className={`${styles.quickTabsWrap} ${isSticky ? styles.quickTabsSticky : ''}`}>
                <div className="container">
                    <div className={styles.quickTabs}>
                        {QUICK_CATS.map(cat => (
                            <button
                                key={cat.slug}
                                className={`${styles.quickTab} ${selectedCategory === cat.slug ? styles.quickTabActive : ''}`}
                                onClick={() => selectCategory(cat.slug)}
                            >
                                {cat.icon}
                                <span>{cat.label}</span>
                                {cat.slug === 'best-sellers' && <span className={styles.hotDot}>🔥</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Mobile Filter Toggle ── */}
            <button className={styles.mobileFilterBtn} onClick={() => setSidebarOpen(true)}>
                <SlidersHorizontal size={18} /> Filters
                {selectedCategory && <span className={styles.filterDot} />}
            </button>

            {/* ── Sidebar Overlay (mobile) ── */}
            {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

            <div className={styles.shopLayout}>
                {/* ─────────── SIDEBAR ─────────── */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                    <div className={styles.sidebarInner}>
                        <div className={styles.sidebarHead}>
                            <h2 className={styles.sidebarTitle}>Filters</h2>
                            <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className={styles.filterBlock}>
                            <div className={styles.filterLabel}>Search</div>
                            <div className={styles.searchRow}>
                                <input
                                    type="text"
                                    placeholder="Find a fragrance..."
                                    value={search}
                                    className={styles.searchInput}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button className={styles.searchBtn} onClick={handleSearch} aria-label="Search">
                                    <Search size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className={styles.filterBlock}>
                            <div className={styles.filterLabel}>Category</div>
                            <div className={styles.chipList}>
                                <button
                                    className={`${styles.chip} ${selectedCategory === '' ? styles.chipActive : ''}`}
                                    onClick={() => selectCategory('')}
                                >All</button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`${styles.chip} ${selectedCategory === cat.slug ? styles.chipActive : ''}`}
                                        onClick={() => selectCategory(cat.slug)}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: cat.name }} />
                                        <span className={styles.chipCount}>{cat.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price */}
                        <div className={styles.filterBlock}>
                            <div className={styles.filterLabel}>Max Price: <strong>${priceMax}</strong></div>
                            <div className={styles.priceSliderRow}>
                                <span className={styles.priceVal}>$0</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={400}
                                    step={10}
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(parseInt(e.target.value))}
                                    className={styles.priceRange}
                                />
                                <span className={styles.priceVal}>${priceMax}</span>
                            </div>
                            
                            <div className={styles.rangeChips}>
                                {[
                                    { label: 'Under $50', min: 0, max: 50 },
                                    { label: '$50 - $100', min: 50, max: 100 },
                                    { label: '$100 - $200', min: 100, max: 200 },
                                    { label: 'Over $200', min: 200, max: 400 },
                                ].map((range, i) => (
                                    <button
                                        key={i}
                                        className={`${styles.priceChip} ${priceMin === range.min && priceMax === range.max ? styles.priceChipActive : ''}`}
                                        onClick={() => {
                                            setPriceMin(range.min);
                                            setPriceMax(range.max);
                                            runFilter({ pmn: range.min, pmx: range.max });
                                        }}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>

                            <button className={styles.applyBtn} onClick={() => runFilter()}>
                                Apply Filter
                            </button>
                        </div>

                        {/* Sort (in sidebar on mobile) */}
                        <div className={styles.filterBlock}>
                            <div className={styles.filterLabel}>Sort By</div>
                            <div className={styles.chipList}>
                                {SORT_OPTIONS.map(o => (
                                    <button
                                        key={o.value}
                                        className={`${styles.chip} ${sortBy === o.value ? styles.chipActive : ''}`}
                                        onClick={() => handleSort(o.value)}
                                    >{o.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ─────────── MAIN ─────────── */}
                <main className={styles.mainContent}>
                    {/* Top Bar */}
                    <div className={styles.topBar}>
                        <div className={styles.topLeft}>
                            {selectedCat ? (
                                <div className={styles.activeCatPill}>
                                    <span dangerouslySetInnerHTML={{ __html: selectedCat.name }} />
                                    <button onClick={clearCategory} className={styles.pillClear}><X size={12} /></button>
                                </div>
                            ) : (
                                <span className={styles.resultCount}>{totalProducts.toLocaleString()} Products</span>
                            )}
                        </div>
                        <div className={styles.topRight}>
                            <select
                                value={sortBy}
                                onChange={(e) => handleSort(e.target.value)}
                                className={styles.sortSelect}
                            >
                                {SORT_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <div className={styles.viewToggle}>
                                <button
                                    className={`${styles.viewBtn} ${viewType === 'grid' ? styles.viewActive : ''}`}
                                    onClick={() => setViewType('grid')}
                                    aria-label="Grid view"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    className={`${styles.viewBtn} ${viewType === 'list' ? styles.viewActive : ''}`}
                                    onClick={() => setViewType('list')}
                                    aria-label="List view"
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active filter chips */}
                    {(selectedCategory || priceMin > 0 || priceMax < 400 || search) && (
                        <div className={styles.activeFiltersRow}>
                            <span className={styles.filterRowLabel}>Active:</span>
                            {selectedCategory && (
                                <span className={styles.activeFilterChip}>
                                    {decodeHTML(selectedCat?.name || selectedCategory)}
                                    <button onClick={clearCategory}><X size={10} /></button>
                                </span>
                            )}
                            {(priceMin > 0 || priceMax < 400) && (
                                <span className={styles.activeFilterChip}>
                                    ${priceMin} - ${priceMax}
                                    <button onClick={() => { setPriceMin(0); setPriceMax(400); runFilter({ pmn: 0, pmx: 400 }); }}><X size={10} /></button>
                                </span>
                            )}
                            {search && (
                                <span className={styles.activeFilterChip}>
                                    &ldquo;{search}&rdquo;
                                    <button onClick={() => { setSearch(''); runFilter({ s: '' }); }}><X size={10} /></button>
                                </span>
                            )}
                            <button
                                className={styles.clearAllBtn}
                                onClick={() => {
                                    setSearch('');
                                    setSelectedCategory('');
                                    setPriceMin(0);
                                    setPriceMax(400);
                                    runFilter({ s: '', cat: '', pmn: 0, pmx: 400 });
                                }}
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* Product Grid */}
                    {loading ? (
                        <div className={styles.loader}>
                            <div className={styles.loaderSpinner} />
                            <span>Loading fragrances...</span>
                        </div>
                    ) : products.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🌿</div>
                            <h3>No products found</h3>
                            <p>Try adjusting your filters or search term</p>
                            <button className={styles.resetBtn} onClick={() => { setSearch(''); setSelectedCategory(''); setPriceMin(0); setPriceMax(400); runFilter({ s: '', cat: '', pmn: 0, pmx: 400 }); }}>
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={viewType === 'grid' ? styles.grid : styles.list}>
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} viewType={viewType} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        disabled={page === 1}
                                        onClick={() => handlePageChange(page - 1)}
                                        className={styles.pageArrow}
                                        aria-label="Previous"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (page <= 3) pageNum = i + 1;
                                        else if (page > totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = page - 2 + i;
                                        if (pageNum <= 0 || pageNum > totalPages) return null;
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`${styles.pageBtn} ${page === pageNum ? styles.pageActive : ''}`}
                                                onClick={() => handlePageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        disabled={page === totalPages}
                                        onClick={() => handlePageChange(page + 1)}
                                        className={styles.pageArrow}
                                        aria-label="Next"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
