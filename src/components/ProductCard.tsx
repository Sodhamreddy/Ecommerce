"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/api';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import styles from './ProductCard.module.css';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const mainImage = product.images[0]?.src || '/placeholder.jpg';
    const minorUnit = product.prices.currency_minor_unit ?? 2;
    const price = (parseInt(product.prices.price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const regularPrice = (parseInt(product.prices.regular_price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const salePrice = (parseInt(product.prices.sale_price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const currencySymbol = product.prices.currency_symbol || '$';

    const discountPercent = product.on_sale && regularPrice !== "0.00"
        ? Math.round(((parseFloat(regularPrice) - parseFloat(salePrice)) / parseFloat(regularPrice)) * 100)
        : 0;

    return (
        <div className={styles.card}>
            <Link href={`/product/${product.slug}`} className={styles.imageLink}>
                <div className={styles.imageContainer}>
                    <Image
                        src={mainImage}
                        alt={product.images[0]?.alt || product.name}
                        width={400}
                        height={400}
                        className={styles.image}
                    />
                    {product.on_sale && <span className={styles.saleBadge}>SALE</span>}
                </div>
            </Link>

            <div className={styles.content}>
                <h3 className={styles.name}>
                    <Link href={`/product/${product.slug}`}>{product.name}</Link>
                </h3>

                <div className={styles.priceContainer}>
                    {product.on_sale ? (
                        <>
                            <span className={styles.newPrice}>{currencySymbol}{price}</span>
                            <span className={styles.oldPrice}>{currencySymbol}{regularPrice}</span>
                            {discountPercent > 0 && <span className={styles.discountText}>{discountPercent}% off</span>}
                        </>
                    ) : (
                        <span className={styles.price}>{currencySymbol}{price}</span>
                    )}
                </div>

                <div className={styles.actions}>
                    <div className={styles.quantity}>
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={styles.qBtn} type="button">
                            <Minus size={14} />
                        </button>
                        <input type="number" value={quantity} readOnly className={styles.qInput} />
                        <button onClick={() => setQuantity(quantity + 1)} className={styles.qBtn} type="button">
                            <Plus size={14} />
                        </button>
                    </div>
                    <button
                        className={styles.bagBtn}
                        aria-label="Add to bag"
                        type="button"
                        onClick={() => {
                            addToCart(product, quantity);
                            alert(`${product.name} added to cart!`);
                        }}
                    >
                        <ShoppingBag size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
