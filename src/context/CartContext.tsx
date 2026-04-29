"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/lib/api';
import {
    addToWCCart,
    updateWCCartItem,
    removeFromWCCart,
    getWCCart,
    applyCoupon,
    removeCoupon,
    updateCartCustomer,
    WCCart,
    WCCartItem,
} from '@/lib/woocommerce';

interface CartItem {
    product: Product;
    quantity: number;
    wcKey?: string; // WooCommerce cart item key for sync
}

interface CartContextType {
    cart: CartItem[];
    wcCart: WCCart | null;
    addToCart: (product: Product, quantity: number) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    syncing: boolean;
    syncError: string | null;
    applyCouponToCart: (code: string) => Promise<{ success: boolean; message?: string }>;
    removeCouponFromCart: (code: string) => Promise<{ success: boolean; message?: string }>;
    updateCustomerAddress: (data: { country?: string; state?: string; postcode?: string; city?: string }) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [wcCart, setWcCart] = useState<WCCart | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch {
                setCart([]);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Try to sync with WooCommerce cart on mount
    useEffect(() => {
        const syncWCCart = async () => {
            try {
                const wcCartData = await getWCCart();
                if (wcCartData && 'items' in wcCartData) {
                    setWcCart(wcCartData);
                }
            } catch {
                // WC cart sync is optional, fail silently
            }
        };
        syncWCCart();
    }, []);

    const addToCart = useCallback((product: Product, quantity: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity }];
        });

        // Sync with WooCommerce in background
        (async () => {
            try {
                setSyncing(true);
                setSyncError(null);
                const wcResult = await addToWCCart(product.id, quantity);
                if (wcResult && 'items' in wcResult) {
                    setWcCart(wcResult);
                    const addedItem = wcResult.items.find((item: WCCartItem) => item.id === product.id);
                    if (addedItem) {
                        setCart(prev => prev.map(item =>
                            item.product.id === product.id
                                ? { ...item, wcKey: addedItem.key }
                                : item
                        ));
                    }
                }
            } catch {
                // WC sync optional
            } finally {
                setSyncing(false);
            }
        })();
    }, []);

    const removeFromCart = useCallback((productId: number) => {
        const item = cart.find(i => i.product.id === productId);
        setCart(prev => prev.filter(item => item.product.id !== productId));

        // Sync with WooCommerce
        if (item?.wcKey) {
            (async () => {
                try {
                    const wcResult = await removeFromWCCart(item.wcKey!);
                    if (wcResult) setWcCart(wcResult);
                } catch {
                    // WC sync optional
                }
            })();
        }
    }, [cart]);

    const updateQuantity = useCallback((productId: number, quantity: number) => {
        const item = cart.find(i => i.product.id === productId);
        setCart(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
        ));

        // Sync with WooCommerce
        if (item?.wcKey) {
            (async () => {
                try {
                    const wcResult = await updateWCCartItem(item.wcKey!, quantity);
                    if (wcResult) setWcCart(wcResult);
                } catch {
                    // WC sync optional
                }
            })();
        }
    }, [cart]);

    const clearCart = useCallback(() => {
        setCart([]);
        setWcCart(null);
    }, []);

    const cartTotal = cart.reduce((total, item) => {
        const price = parseInt(item.product.prices.price) / Math.pow(10, item.product.prices.currency_minor_unit || 2);
        return total + price * item.quantity;
    }, 0);

    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    const applyCouponToCart = async (code: string) => {
        setSyncing(true);
        try {
            const result = await applyCoupon(code);
            if (result && 'items' in result) {
                setWcCart(result);
                return { success: true };
            }
            return { success: false, message: 'Invalid or expired coupon' };
        } catch (e: any) {
            return { success: false, message: e.message || 'Error applying coupon' };
        } finally {
            setSyncing(false);
        }
    };

    const updateCustomerAddress = async (addr: { country?: string; state?: string; postcode?: string; city?: string }) => {
        try {
            const result = await updateCartCustomer({
                billing_address: addr,
                shipping_address: addr,
            });
            if (result && 'items' in result) {
                setWcCart(result);
            }
        } catch {
            // tax update is best-effort
        }
    };

    const removeCouponFromCart = async (code: string) => {
        setSyncing(true);
        try {
            const result = await removeCoupon(code);
            if (result && 'items' in result) {
                setWcCart(result);
                return { success: true };
            }
            // Result was null but no exception — refresh cart to get true server state
            const fresh = await getWCCart();
            if (fresh) setWcCart(fresh);
            return { success: true };
        } catch (e: any) {
            // Even on error, refresh so the UI reflects WC reality
            try {
                const fresh = await getWCCart();
                if (fresh) setWcCart(fresh);
            } catch { /* best-effort */ }
            return { success: false, message: e.message || 'Failed to remove coupon' };
        } finally {
            setSyncing(false);
        }
    };

    return (
        <CartContext.Provider value={{
            cart, wcCart, addToCart, removeFromCart, updateQuantity,
            clearCart, cartTotal, cartCount, syncing, syncError,
            applyCouponToCart, removeCouponFromCart, updateCustomerAddress
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        console.warn('useCart must be used within a CartProvider - returning default dummy context');
        return {
            cart: [],
            wcCart: null,
            addToCart: () => {},
            removeFromCart: () => {},
            updateQuantity: () => {},
            clearCart: () => {},
            cartTotal: 0,
            cartCount: 0,
            syncing: false,
            syncError: null,
            applyCouponToCart: async () => ({ success: false }),
            removeCouponFromCart: async () => ({ success: false }),
            updateCustomerAddress: async () => {}
        };
    }
    return context;
}
