import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
    return (
        <div className={styles.wrapper}>
            {/* Background decorative elements */}
            <div className={styles.bgCircle1} />
            <div className={styles.bgCircle2} />

            <div className={styles.content}>
                {/* Big 404 */}
                <div className={styles.errorCode}>
                    <span className={styles.digit}>4</span>
                    <span className={styles.bottle}>
                        {/* Perfume bottle SVG */}
                        <svg viewBox="0 0 60 100" className={styles.bottleSvg}>
                            <rect x="22" y="8" width="16" height="10" rx="3" fill="#d4a853" />
                            <rect x="18" y="18" width="24" height="4" rx="2" fill="#b8902d" />
                            <rect x="10" y="22" width="40" height="64" rx="8" fill="#1a1a2e" />
                            <rect x="14" y="26" width="32" height="56" rx="6" fill="#16213e" />
                            <rect x="18" y="30" width="8" height="45" rx="4" fill="rgba(212,168,83,0.15)" />
                            <rect x="30" y="50" width="6" height="20" rx="3" fill="rgba(255,255,255,0.06)" />
                            <ellipse cx="30" cy="46" rx="10" ry="4" fill="rgba(212,168,83,0.18)" />
                            <text x="30" y="68" textAnchor="middle" fill="#d4a853" fontSize="7" fontWeight="bold" fontFamily="serif">JERSEY</text>
                            <text x="30" y="76" textAnchor="middle" fill="rgba(212,168,83,0.7)" fontSize="4.5" fontFamily="serif">PERFUME</text>
                        </svg>
                    </span>
                    <span className={styles.digit}>4</span>
                </div>

                <h1 className={styles.headline}>Page Not Found</h1>
                <p className={styles.subline}>
                    The scent you&apos;re looking for has drifted away.<br />
                    Let us guide you back to our collection.
                </p>

                <div className={styles.actions}>
                    <Link href="/" className={styles.primaryBtn}>
                        Back to Home
                    </Link>
                    <Link href="/shop" className={styles.secondaryBtn}>
                        Browse Shop
                    </Link>
                </div>

                <div className={styles.suggestions}>
                    <p className={styles.suggestLabel}>Popular categories</p>
                    <div className={styles.chips}>
                        <Link href="/product-category/mens-fragrances" className={styles.chip}>Men&apos;s</Link>
                        <Link href="/product-category/womens-fragrances" className={styles.chip}>Women&apos;s</Link>
                        <Link href="/product-category/gift-sets" className={styles.chip}>Gift Sets</Link>
                        <Link href="/product-category/best-sellers" className={styles.chip}>Best Sellers</Link>
                        <Link href="/product-category/bundles" className={styles.chip}>Bundles</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
