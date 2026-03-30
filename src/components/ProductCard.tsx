"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/api';
import { ShoppingBag, Plus, Minus, Heart, Eye, Star, Zap, CheckCircle } from 'lucide-react';
import styles from './ProductCard.module.css';
import { useState, useCallback } from 'react';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
    product: Product;
    viewType?: 'grid' | 'list';
}

// Simple pseudo-rating from product ID (deterministic 4-5 stars)
function getPseudoRating(id: number) {
    return (((id * 7) % 10) / 10) + 4; // Always 4.0–4.9
}

export default function ProductCard({ product, viewType = 'grid' }: ProductCardProps) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [wishlisted, setWishlisted] = useState(() => {
        if (typeof window !== 'undefined') {
            const wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
            return wl.includes(product.id);
        }
        return false;
    });
    const [imageIdx, setImageIdx] = useState(0);

    const mainImage = product.images[imageIdx]?.src || product.images[0]?.src || '/placeholder.jpg';
    const hoverImage = product.images[1]?.src || product.images[0]?.src || '/placeholder.jpg';
    const minorUnit = product.prices.currency_minor_unit ?? 2;
    const price = (parseInt(product.prices.price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const regularPrice = (parseInt(product.prices.regular_price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const salePrice = (parseInt(product.prices.sale_price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const currencySymbol = product.prices.currency_symbol || '$';

    const discountPercent = product.on_sale && regularPrice !== "0.00"
        ? Math.round(((parseFloat(regularPrice) - parseFloat(salePrice)) / parseFloat(regularPrice)) * 100)
        : 0;

    const rating = getPseudoRating(product.id);
    const reviewCount = (product.id % 90) + 10; // 10–99

    const handleAdd = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    }, [product, quantity, addToCart]);

    const toggleWishlist = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const wl: number[] = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (wishlisted) {
            const updated = wl.filter(id => id !== product.id);
            localStorage.setItem('wishlist', JSON.stringify(updated));
        } else {
            wl.push(product.id);
            localStorage.setItem('wishlist', JSON.stringify(wl));
        }
        setWishlisted(!wishlisted);
    }, [wishlisted, product.id]);

    // Strip HTML tags for short description
    const shortDesc = product.short_description
        ? product.short_description.replace(/<[^>]*>/g, '').slice(0, 120)
        : '';

    const cardClass = viewType === 'list' ? `${styles.card} ${styles.listCard}` : styles.card;

    return (
        <div className={cardClass}>
            {/* Image Block */}
            <div className={styles.imageContainer}>
                <Link href={`/product/${product.slug}`} className={styles.imageLink}>
                    <Image
                        src={mainImage}
                        alt={product.images[0]?.alt || product.name}
                        width={400}
                        height={400}
                        className={styles.image}
                    />
                </Link>

                {/* Badges */}
                <div className={styles.badgeRow}>
                    {product.on_sale && discountPercent > 0 && (
                        <span className={styles.saleBadge}>-{discountPercent}%</span>
                    )}
                    {!product.is_in_stock && (
                        <span className={styles.outOfStockBadge}>Out of Stock</span>
                    )}
                    {product.on_sale && discountPercent >= 40 && (
                        <span className={styles.hotBadge}><Zap size={10} /> Hot</span>
                    )}
                </div>

                {/* Hover Actions */}
                <div className={styles.hoverActions}>
                    <button
                        className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlisted : ''}`}
                        onClick={toggleWishlist}
                        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
                    </button>
                    <Link
                        href={`/product/${product.slug}`}
                        className={styles.quickViewBtn}
                        aria-label="Quick view"
                        title="View product"
                        onClick={e => e.stopPropagation()}
                    >
                        <Eye size={15} />
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {/* Category */}
                {product.categories?.[0] && (
                    <span className={styles.categoryTag}>{product.categories[0].name}</span>
                )}

                <h3 className={styles.name}>
                    <Link href={`/product/${product.slug}`}>{product.name}</Link>
                </h3>

                {/* Rating */}
                <div className={styles.ratingRow}>
                    <div className={styles.stars}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star
                                key={s}
                                size={12}
                                fill={s <= Math.round(rating) ? '#f59e0b' : 'none'}
                                stroke={s <= Math.round(rating) ? '#f59e0b' : '#ddd'}
                            />
                        ))}
                    </div>
                    <span className={styles.ratingCount}>({reviewCount})</span>
                </div>

                {shortDesc && viewType === 'list' && (
                    <p className={styles.shortDesc}>{shortDesc}</p>
                )}

                <div className={styles.priceContainer}>
                    {parseFloat(regularPrice) > parseFloat(salePrice) ? (
                        <>
                            <span className={styles.newPrice}>{currencySymbol}{salePrice}</span>
                            <span className={styles.oldPrice}>{currencySymbol}{regularPrice}</span>
                        </>
                    ) : (
                        <span className={styles.price}>{currencySymbol}{price}</span>
                    )}
                </div>

                <div className={styles.actions}>
                    {product.is_in_stock && (
                        <div className={styles.quantity}>
                            <button onClick={(e) => { e.preventDefault(); setQuantity(Math.max(1, quantity - 1)); }} className={styles.qBtn} type="button">
                                <Minus size={14} />
                            </button>
                            <input type="number" value={quantity} readOnly className={styles.qInput} />
                            <button onClick={(e) => { e.preventDefault(); setQuantity(quantity + 1); }} className={styles.qBtn} type="button">
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                    <button
                        className={`${styles.bagBtn} ${added ? styles.bagBtnAdded : ''}`}
                        aria-label="Add to bag"
                        type="button"
                        onClick={handleAdd}
                        disabled={!product.is_in_stock}
                    >
                        {added ? <CheckCircle size={18} /> : <ShoppingBag size={18} />}
                        <span className={styles.bagBtnText}>
                            {!product.is_in_stock ? 'Sold Out' : ''}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
