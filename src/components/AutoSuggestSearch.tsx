"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { fetchProductsAction } from '@/app/actions';
import { Product } from '@/lib/api';
import styles from './AutoSuggestSearch.module.css';

export default function AutoSuggestSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [fallbackResults, setFallbackResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const router = useRouter();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.trim().length === 0) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setIsLoading(true);
            setIsOpen(true);
            try {
                // Fetch exact matches based on query string
                const data = await fetchProductsAction(1, 5, query, '', '', '', 'popularity', 'desc');

                if (data && data.products && data.products.length > 0) {
                    setResults(data.products);
                } else {
                    // If no matches are found, fetch recommended/bestselling failover perfumes
                    setResults([]);
                    if (fallbackResults.length === 0) {
                        const fallbackData = await fetchProductsAction(1, 4, '', '', '', '', 'popularity', 'desc');
                        if (fallbackData && fallbackData.products) {
                            setFallbackResults(fallbackData.products);
                        }
                    }
                }
            } catch (error) {
                console.error("Autosuggest Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchSuggestions();
        }, 300); // 300ms debounce to avoid spamming the backend

        return () => clearTimeout(timeoutId);
    }, [query, fallbackResults.length]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/shop?search=${encodeURIComponent(query)}`);
            setIsOpen(false);
        }
    };

    const handleProductClick = (slug: string) => {
        router.push(`/product/${slug}`);
        setIsOpen(false);
        setQuery('');
    };

    const formatPrice = (priceStr: string, minorUnit: number = 2, symbol: string = '$') => {
        const val = parseInt(priceStr) / Math.pow(10, minorUnit);
        return `${symbol}${val.toFixed(2)}`;
    };

    return (
        <div className={styles.searchWrapper} ref={wrapperRef}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                    type="text"
                    placeholder="Search for perfumes, brands or notes"
                    className={styles.searchInput}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (query.length > 0) setIsOpen(true) }}
                />
                <button type="submit" className={styles.searchBtn}>
                    <Search size={20} />
                </button>
            </form>

            {isOpen && (
                <div className={styles.dropdown}>
                    {isLoading ? (
                        <div className={styles.dropdownMessage}>Searching...</div>
                    ) : results.length > 0 ? (
                        <div className={styles.resultsList}>
                            {results.map((product) => (
                                <div
                                    key={product.id}
                                    className={styles.resultItem}
                                    onClick={() => handleProductClick(product.slug)}
                                >
                                    <div className={styles.resultImage}>
                                        <Image
                                            src={product.images[0]?.src || '/placeholder.jpg'}
                                            alt={product.name}
                                            width={40}
                                            height={40}
                                            style={{ objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div className={styles.resultInfo}>
                                        <div className={styles.resultName}>{product.name}</div>
                                        <div className={styles.resultPrice}>
                                            {formatPrice(product.prices.price, product.prices.currency_minor_unit, product.prices.currency_symbol)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className={styles.viewAllBtn} onClick={handleSearch}>
                                View all results for "{query}"
                            </button>
                        </div>
                    ) : (
                        <div className={styles.resultsList}>
                            <div className={styles.dropdownMessage}>
                                No exact matches found for "{query}". <br />
                                <strong>Try these popular scents instead:</strong>
                            </div>
                            {fallbackResults.map((product) => (
                                <div
                                    key={product.id}
                                    className={styles.resultItem}
                                    onClick={() => handleProductClick(product.slug)}
                                >
                                    <div className={styles.resultImage}>
                                        <Image
                                            src={product.images[0]?.src || '/placeholder.jpg'}
                                            alt={product.name}
                                            width={40}
                                            height={40}
                                            style={{ objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div className={styles.resultInfo}>
                                        <div className={styles.resultName}>{product.name}</div>
                                        <div className={styles.resultPrice}>
                                            {formatPrice(product.prices.price, product.prices.currency_minor_unit, product.prices.currency_symbol)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
