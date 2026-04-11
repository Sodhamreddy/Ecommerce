'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Youtube, ArrowRight, Pin } from 'lucide-react';

// Official X (Twitter) logo SVG
function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import styles from './Footer.module.css';
import { useState, useEffect } from 'react';
import PaymentMethodsGrid from './PaymentMethodsGrid';

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className={styles.footer}>

      {/* ── CTA Strip ── */}
      <div className={styles.footerCta}>
        <div className={styles.footerCtaInner}>
          <span className={styles.footerCtaLabel}>Limited Time</span>
          <p className={styles.footerCtaHeadline}>Best Offers Luxury Fragrances All Brands</p>
          <Link href="/offers" className={styles.footerCtaBtn}>
            Shop the Sale <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className={`container ${styles.footerGrid}`}>

        {/* Brand Column */}
        <div className={styles.brandColumn}>
          <div>
            <Image src="/jersey-logo.png" alt="Jersey Perfume" width={220} height={66} style={{ objectFit: 'contain' }} />
          </div>
          <p>
            Redefining luxury with every scent. Crafted for the bold, the elegant, and the unique. 100% authentic fragrances at unbeatable prices.
          </p>
          <div className={styles.socialIcons}>
            <a href="https://www.facebook.com/profile.php?id=61576907750503" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Facebook">
              <Facebook size={18} />
            </a>
            <a href="https://www.instagram.com/jerseyperfumeusa/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="https://www.youtube.com/@jerseyperfume" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="YouTube">
              <Youtube size={18} />
            </a>
            <a href="https://x.com/JerseyPerfume" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Twitter/X">
              <XIcon size={18} />
            </a>
            <a href="https://www.pinterest.com/jerseyperfumeofficial/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Pinterest">
              <Pin size={18} />
            </a>
          </div>
        </div>

        {/* Useful Links */}
        <div>
          <h4 className={styles.colTitle}>Useful Links</h4>
          <ul className={styles.linkList}>
            {[
              { label: 'Privacy Policy', href: '/info/privacy-policy-2' },
              { label: 'Refund Policy', href: '/info/refund-policy' },
              { label: 'Cookie Policy', href: '/info/cookie-policy' },
              { label: 'Blog', href: '/blog' },
            ].map(item => (
              <li key={item.label} className={styles.linkItem}>
                <Link href={item.href} className={styles.link}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className={styles.colTitle}>Customer Service</h4>
          <ul className={styles.linkList}>
            {[
              { label: 'Contact Us', href: '/info/contact-us' },
              { label: 'Shipping Policy', href: '/info/shipping-policy' },
              { label: 'Terms & Conditions', href: '/info/terms-of-service' },
              { label: 'About Us', href: '/info/about-us' },
            ].map(item => (
              <li key={item.label} className={styles.linkItem}>
                <Link href={item.href} className={styles.link}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* My Account */}
        <div>
          <h4 className={styles.colTitle}>My Account</h4>
          <ul className={styles.linkList}>
            {[
              { label: 'My Account', href: '/account' },
              { label: 'Order History', href: '/account' },
              { label: 'Wishlist', href: '/wishlist' },
              { label: 'Refund Policy', href: '/info/refund-policy' },
            ].map(item => (
              <li key={item.label} className={styles.linkItem}>
                <Link href={item.href} className={styles.link}>{item.label}</Link>
              </li>
            ))}
          </ul>
          
          <PaymentMethodsGrid />
        </div>
      </div>

      {/* ── Bottom Footer ── */}
      <div className={`container ${styles.bottomFooter}`}>
        <div className={styles.copyright}>
          &copy; {mounted ? new Date().getFullYear() : '2026'} JerseyPerfume. All rights reserved. | Powered by Jersey Perfume USA
        </div>
      </div>
    </footer>
  );
}
