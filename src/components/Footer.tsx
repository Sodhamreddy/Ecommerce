import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Mail, ArrowRight, CreditCard } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>

        {/* Brand Column */}
        <div className={styles.brandColumn}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Image src="/jersey-logo.png" alt="Jersey Perfume" width={180} height={54} style={{ objectFit: 'contain' }} />
          </div>
          <p>
            Redefining luxury with every scent. Crafted for the bold, the elegant, and the unique.
          </p>
          <div className={styles.socialIcons}>
            <Link href="#" className={styles.socialIcon}><Instagram size={20} /></Link>
            <Link href="#" className={styles.socialIcon}><Facebook size={20} /></Link>
            <Link href="#" className={styles.socialIcon}><Twitter size={20} /></Link>
          </div>
        </div>

        {/* Shop Links */}
        <div>
          <h4 className={styles.colTitle}>Shop</h4>
          <ul className={styles.linkList}>
            {['All Collections', 'New Arrivals', 'Best Sellers', 'Gift Sets', 'Samples'].map(item => (
              <li key={item} className={styles.linkItem}>
                <Link href="#" className={styles.link}>{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support Links */}
        <div>
          <h4 className={styles.colTitle}>Support</h4>
          <ul className={styles.linkList}>
            {[
              { label: 'About Us', slug: 'about-us' },
              { label: 'Contact Us', slug: 'contact-us' },
              { label: 'Shipping & Returns', slug: 'shipping-returns' },
              { label: 'FAQ', slug: 'faq' },
              { label: 'Privacy Policy', slug: 'privacy-policy' },
              { label: 'Terms of Service', slug: 'terms-of-service' }
            ].map(item => (
              <li key={item.slug} className={styles.linkItem}>
                <Link href={`/info/${item.slug}`} className={styles.link}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className={styles.colTitle}>Newsletter</h4>
          <p className={styles.newsletterText}>Subscribe for exclusive offers and updates.</p>
          <div className={styles.newsletterForm}>
            <input
              type="email"
              placeholder="Your email address"
              className={styles.input}
            />
            <button className={styles.submitBtn}>
              <Mail size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className={`container ${styles.bottomFooter}`}>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} JerseyPerfume. All rights reserved.
        </div>
        <div className={styles.payments}>
          <CreditCard size={24} />
          <div className={styles.payIcon}></div>
          <div className={styles.payIcon}></div>
        </div>
      </div>
    </footer>
  );
}
