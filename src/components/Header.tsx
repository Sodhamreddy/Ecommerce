"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Search, User, Heart, Truck, Menu, Home, X, ChevronDown } from 'lucide-react';
import styles from './Header.module.css';
import AutoSuggestSearch from './AutoSuggestSearch';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';

type NavChild = { label: string; href: string };
type NavItem = { label: string; href: string; children?: NavChild[]; mega?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: 'Men', href: '/product-category/mens-fragrances' },
  { label: 'Women', href: '/product-category/womens-fragrances' },
  { label: 'Unisex', href: '/product-category/unisex-fragrances' },
  {
    label: 'Gift Sets',
    href: '/product-category/gift-sets',
    children: [
      { label: 'Men', href: '/product-category/men-gift-sets' },
      { label: 'Women', href: '/product-category/womens-fragrances' },
    ],
  },
  { label: 'Bundle', href: '/product-category/bundles' },
  { label: 'Best Seller', href: '/product-category/best-sellers' },
  { label: 'Hot Products', href: '/product-category/hot-products' },
  {
    label: 'Brands',
    href: '/shop',
    mega: true,
    children: [
      { label: 'GIORGIO ARMANI', href: '/shop?search=armani' },
      { label: 'BURBERRY', href: '/shop?search=burberry' },
      { label: 'PACO RABANNE', href: '/shop?search=paco+rabanne' },
      { label: 'GIVENCHY', href: '/shop?search=givenchy' },
      { label: 'JIMMY CHOO', href: '/shop?search=jimmy+choo' },
      { label: 'DIOR', href: '/shop?search=dior' },
      { label: 'CHANEL', href: '/shop?search=chanel' },
      { label: 'VERSACE', href: '/shop?search=versace' },
      { label: 'BVLGARI', href: '/shop?search=bvlgari' },
      { label: 'CREED', href: '/shop?search=creed' },
      { label: 'TOM FORD', href: '/shop?search=tom+ford' },
      { label: 'DUMONT PARIS', href: '/shop?search=dumont' },
      { label: 'LATTAFA', href: '/product/lattafa-angham-second-song-eau-de-parfum-100ml-unisex-oriental-vanilla-fragrance-long-lasting-sweet-creamy-scent/' },
      { label: 'RASASI', href: '/shop?search=rasasi' },
      { label: 'ARMAF', href: '/shop?search=armaf' },
      { label: 'MAISON ALHAMBRA', href: '/shop?search=maison+alhambra' },
      { label: 'AL HARAMAIN', href: '/shop?search=al+haramain' },
      { label: 'AHMED AL MAGHRIBI', href: '/shop?search=ahmed+al+maghribi' },
    ],
  },
  { label: 'Blog', href: '/blog' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileOpenMenu, setMobileOpenMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { cart } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <>
      <div className={styles.headerWrapper}>
        <div className={styles.topBar}>
          <Truck size={14} /> Free Shipping Over $59.99
          <Link href="/shop" className={styles.topBarLink}>Go shop</Link>
        </div>

        <div className={`container ${styles.mainHeader}`}>
          <div
            className={styles.mobileMenuTrigger}
            style={{ position: 'absolute', left: '20px', cursor: 'pointer' }}
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={24} />
          </div>

          <Link href="/" className={styles.logo}>
            <Image
              src="/jersey-logo.png"
              alt="Jersey Perfume"
              width={260}
              height={78}
              style={{ objectFit: 'contain', maxWidth: '100%' }}
              priority
            />
          </Link>

          <div className={styles.searchContainer}>
            <AutoSuggestSearch />
          </div>

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
                {mounted && cartCount > 0 && <span className={styles.cartCountText}>{cartCount}</span>}
              </Link>
              <div className={styles.cartDropdown}>
                {cart.length === 0 ? (
                  <p className={styles.emptyCartMsg}>Your cart is currently empty.</p>
                ) : (
                  <>
                    <div className={styles.cartDropdownItems}>
                      {cart.filter(item => item?.product?.id).map((item) => (
                        <div key={item.product.id} className={styles.cartDropdownItem}>
                          <div className={styles.cartDropdownItemImg}>
                            {item.product.images?.[0]?.src && (
                              <Image src={item.product.images[0].src} alt={item.product.name} width={60} height={60} style={{ objectFit: 'cover' }} />
                            )}
                          </div>
                          <div className={styles.cartDropdownItemInfo}>
                            <h4>{item.product.name}</h4>
                            <p>{item.quantity} × <span dangerouslySetInnerHTML={{ __html: item.product.prices?.currency_symbol || '$' }}></span>{(parseInt(item.product.prices?.price || '0') / Math.pow(10, item.product.prices?.currency_minor_unit || 2)).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.cartDropdownFooter}>
                      <div className={styles.cartDropdownTotal}>
                        <span>Subtotal:</span>
                        <span>${cart.filter(item => item?.product?.prices?.price).reduce((total, item) => {
                          const price = parseFloat(item.product.prices.price) / Math.pow(10, item.product.prices?.currency_minor_unit || 2);
                          return isNaN(price) ? total : total + (price * item.quantity);
                        }, 0).toFixed(2)}</span>
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

        {/* Desktop Nav */}
        <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className={styles.navBar}>
            <nav className={styles.navLinks}>
              {NAV_ITEMS.map((item) =>
                item.children ? (
                  <div key={item.label} className={styles.navDropdownWrapper}>
                    <Link href={item.href} className={styles.navLink}>
                      {item.label} <ChevronDown size={13} />
                    </Link>
                    {item.mega ? (
                      <div className={styles.navMegaMenu}>
                        {item.children.map((child) => (
                          <Link key={child.label} href={child.href} className={styles.navMegaItem}>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.navDropdown}>
                        {item.children.map((child) => (
                          <Link key={child.label} href={child.href} className={styles.navDropdownItem}>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={item.label} href={item.href} className={styles.navLink}>{item.label}</Link>
                )
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`} onClick={() => setIsMenuOpen(false)}>
        <div className={styles.mobileMenuContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>
            <X size={24} />
          </div>
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label}>
                <div
                  className={`${styles.mobileNavLink} ${styles.mobileNavDropdownToggle}`}
                  onClick={() => setMobileOpenMenu(prev => prev === item.label ? null : item.label)}
                >
                  {item.label}
                  <ChevronDown size={16} style={{ transform: mobileOpenMenu === item.label ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </div>
                {mobileOpenMenu === item.label && (
                  <div className={`${styles.mobileSubLinks} ${item.mega ? styles.mobileSubLinksMega : ''}`}>
                    <Link href={item.href} className={styles.mobileSubLink} onClick={() => setIsMenuOpen(false)}>All {item.label}</Link>
                    {item.children.map((child) => (
                      <Link key={child.label} href={child.href} className={styles.mobileSubLink} onClick={() => setIsMenuOpen(false)}>{child.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.label} href={item.href} className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                {item.label}
              </Link>
            )
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className={styles.mobileBottomNav}>
        <Link href="/" className={styles.mobileNavItem}><Home size={22} strokeWidth={1.5} /><span>Home</span></Link>
        <Link href="/shop" className={styles.mobileNavItem}><Search size={22} strokeWidth={1.5} /><span>Shop</span></Link>
        <Link href="/wishlist" className={styles.mobileNavItem}><Heart size={22} strokeWidth={1.5} /><span>Wishlist</span></Link>
        <Link href="/account" className={styles.mobileNavItem}><User size={22} strokeWidth={1.5} /><span>Account</span></Link>
        <Link href="/cart" className={styles.mobileNavItem}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <ShoppingBag size={22} strokeWidth={1.5} />
            {mounted && cartCount > 0 && <span className={styles.mobileCartBadge}>{cartCount > 99 ? '99+' : cartCount}</span>}
          </span>
          <span>Cart</span>
        </Link>
      </div>
    </>
  );
}
