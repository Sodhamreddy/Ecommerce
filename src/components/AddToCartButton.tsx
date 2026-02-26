"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/api';
import { ShoppingBag } from 'lucide-react';
import styles from '../app/product/[slug]/ProductPage.module.css';

interface AddToCartButtonProps {
    disabled: boolean;
    product: Product;
}

export default function AddToCartButton({ disabled, product }: AddToCartButtonProps) {
    const { addToCart } = useCart();
    const [adding, setAdding] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = () => {
        setAdding(true);
        addToCart(product, quantity);
        // Simulate adding to cart
        setTimeout(() => {
            setAdding(false);
            // Optional: You could implement a nice toast here instead of an alert
        }, 500);
    };

    const decrement = () => setQuantity(prev => Math.max(1, prev - 1));
    const increment = () => setQuantity(prev => (product.is_in_stock ? prev + 1 : prev));

    return (
        <div className={styles.cartActions}>
            <div className={styles.quantitySelector}>
                <button className={styles.qtyBtn} onClick={decrement} disabled={disabled}>-</button>
                <input className={styles.qtyInput} type="number" value={quantity} readOnly />
                <button className={styles.qtyBtn} onClick={increment} disabled={disabled}>+</button>
            </div>
            <button
                className={styles.addToCart}
                disabled={disabled || adding}
                onClick={handleAddToCart}
            >
                <ShoppingBag size={20} />
                {adding ? 'Adding...' : 'Add to Cart'}
            </button>
        </div>
    );
}
