"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Search, User, Heart, Truck, Menu, Home, X } from 'lucide-react';
import styles from './Header.module.css';
import AutoSuggestSearch from './AutoSuggestSearch';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useCart();
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <div className={styles.headerWrapper}>
        <div className={styles.topBar}>
          SPEND $59 TO UNLOCK FREE SHIPPING FOR U.S.A ORDERS <Link href="/shop" style={{ textDecoration: 'underline', marginLeft: '5px' }}>SHOP NOW</Link>
        </div>

        <div className={`container ${styles.mainHeader}`}>
          <div
            className={styles.mobileMenuTrigger}
            style={{ display: 'none', position: 'absolute', left: '20px', cursor: 'pointer' }}
            onClick={toggleMenu}
          >
            <Menu size={24} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="/" className={styles.logo}>
              <Image src="/jersey-logo.png" alt="Jersey Perfume" width={200} height={60} style={{ objectFit: 'contain' }} priority />
            </Link>
          </div>

          <AutoSuggestSearch />

          <div className={styles.headerActions}>
            <Link href="/wishlist" className={styles.iconBtn}>
              <Heart size={24} strokeWidth={1.5} />
            </Link>
            <Link href="/account" className={styles.iconBtn}>
              <User size={24} strokeWidth={1.5} />
            </Link>
            <div className={styles.cartContainer}>
              <Link href="/cart" className={styles.iconBtn} style={{ gap: '6px' }}>
                <ShoppingBag size={24} strokeWidth={1.5} />
                <span className={styles.cartCountText}>{cartCount}</span>
              </Link>

              <div className={styles.cartDropdown}>
                {cart.length === 0 ? (
                  <p className={styles.emptyCartMsg}>Your cart is currently empty.</p>
                ) : (
                  <>
                    <div className={styles.cartDropdownItems}>
                      {cart.map((item) => (
                        <div key={item.product.id} className={styles.cartDropdownItem}>
                          <div className={styles.cartDropdownItemImg}>
                            {item.product.images?.[0]?.src && (
                              <Image
                                src={item.product.images[0].src}
                                alt={item.product.name}
                                width={60}
                                height={60}
                                style={{ objectFit: 'cover' }}
                              />
                            )}
                          </div>
                          <div className={styles.cartDropdownItemInfo}>
                            <h4>{item.product.name}</h4>
                            <p>{item.quantity} × <span dangerouslySetInnerHTML={{ __html: item.product.prices.currency_symbol || '$' }}></span>{(parseInt(item.product.prices.price) / Math.pow(10, item.product.prices.currency_minor_unit || 2)).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.cartDropdownFooter}>
                      <div className={styles.cartDropdownTotal}>
                        <span>Subtotal:</span>
                        <span>${cart.reduce((total, item) => total + (parseInt(item.product.prices.price) / Math.pow(10, item.product.prices.currency_minor_unit || 2)) * item.quantity, 0).toFixed(2)}</span>
                      </div>
                      <div className={styles.cartDropdownActions}>
                        <Link href="/cart" className={styles.viewCartBtn}>View Cart</Link>
                        <Link href="/checkout" className={styles.checkoutBtn}>Checkout</Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className={styles.navBar}>
            <nav className={styles.navLinks}>
              <Link href="/shop?category=best-sellers" className={styles.navLink}>Best Sellers</Link>
              <Link href="/shop?category=hot-products" className={styles.navLink}>Hot Products</Link>
              <Link href="/shop?category=bundles" className={styles.navLink}>Bundles</Link>
              <Link href="/shop?category=gift-sets" className={styles.navLink}>Gift Sets</Link>
              <Link href="/shop?category=mens-fragrances" className={styles.navLink}>Men</Link>
              <Link href="/shop?category=womens-fragrances" className={styles.navLink}>Women</Link>
              <Link href="/shop?category=unisex-fragrances" className={styles.navLink}>Unisex</Link>
              <Link href="/blog" className={styles.navLink}>Blog</Link>
            </nav>
            <div className={styles.trackOrder}>
              <Truck size={16} /> Track Order
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Sidebar */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenuContent}>
          <div className={styles.closeBtn} onClick={toggleMenu}>
            <X size={24} />
          </div>
          <Link href="/shop?category=best-sellers" className={styles.mobileNavLink} onClick={toggleMenu}>Best Sellers</Link>
          <Link href="/shop?category=hot-products" className={styles.mobileNavLink} onClick={toggleMenu}>Hot Products</Link>
          <Link href="/shop?category=bundles" className={styles.mobileNavLink} onClick={toggleMenu}>Bundles</Link>
          <Link href="/shop?category=gift-sets" className={styles.mobileNavLink} onClick={toggleMenu}>Gift Sets</Link>
          <Link href="/shop?category=mens-fragrances" className={styles.mobileNavLink} onClick={toggleMenu}>Men</Link>
          <Link href="/shop?category=womens-fragrances" className={styles.mobileNavLink} onClick={toggleMenu}>Women</Link>
          <Link href="/shop?category=unisex-fragrances" className={styles.mobileNavLink} onClick={toggleMenu}>Unisex</Link>
          <Link href="/blog" className={styles.mobileNavLink} onClick={toggleMenu}>Blog</Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className={styles.mobileBottomNav}>
        <Link href="/" className={styles.mobileNavItem}>
          <Home size={22} strokeWidth={1.5} />
          <span>Home</span>
        </Link>
        <Link href="/shop" className={styles.mobileNavItem}>
          <Search size={22} strokeWidth={1.5} />
          <span>Shop</span>
        </Link>
        <Link href="/wishlist" className={styles.mobileNavItem}>
          <Heart size={22} strokeWidth={1.5} />
          <span>Wishlist</span>
        </Link>
        <Link href="/account" className={styles.mobileNavItem}>
          <User size={22} strokeWidth={1.5} />
          <span>Account</span>
        </Link>
        <Link href="/cart" className={styles.mobileNavItem}>
          <ShoppingBag size={22} strokeWidth={1.5} />
          <span>Cart</span>
        </Link>
      </div>
    </>
  );
}
