"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ChevronLeft } from "lucide-react";
import styles from "./HomeClient.module.css";
import ProductCard from "./ProductCard";
import { Product, Category } from "@/lib/api";
import { SlideData } from "@/lib/woocommerce";
import BrandLogo from "./BrandLogo";
import InstagramEmbed from "./InstagramEmbed";
import { SITE_DOMAIN } from "@/lib/config";

interface Props {
    bestSellers: Product[];
    newArrivals: Product[];
    gourmandProducts: Product[];
    onSaleProducts: Product[];
    blogPosts: any[];
    categories: Category[];
    slides: SlideData[];
}

// Fallback slides — mirrors fetchSmartSliderSlides, used only if that function throws
const FALLBACK_SLIDES: SlideData[] = [
    {
        title: "LUXURY\nFRAGRANCES",
        subtitle: "UP TO 80% OFF RETAIL PRICES",
        bg: `https://backend.jerseyperfume.com/wp-content/uploads/2025/02/Banner-1-1.jpg`,
        href: "/shop",
        cta: "SHOP COLLECTION",
        accent: '#d4a853'
    },
    {
        title: "EXCLUSIVE\nDEALS",
        subtitle: "AUTHENTIC SCENTS FOR EVERY OCCASION",
        bg: `https://backend.jerseyperfume.com/wp-content/uploads/2025/02/Banner-2-1.jpg`,
        href: "/shop",
        cta: "DISCOVER MORE",
        accent: '#d4a853'
    },
    {
        title: "NEW\nARRIVALS",
        subtitle: "EXPLORE THE LATEST FROM TOP BRANDS",
        bg: `https://backend.jerseyperfume.com/wp-content/uploads/2025/02/Banner-3-1.jpg`,
        href: "/shop",
        cta: "SHOP NOW",
        accent: '#d4a853'
    }
];


// Fallback images keyed by slug fragment if the API has no image
const categoryFallbacks: Record<string, string> = {
    "womens-fragrances": "/cat-womens-fragrances.jpg",
    "mens-fragrances": "/images/cat_men.png",
    "best-sellers": "/cat-best-sellers.jpg",
    "womens": "/images/cat_women.png",
    "mens": "/images/cat_men.png",
    "women": "/images/cat_women.png",
    "men": "/images/cat_men.png",
    "dumont": "/images/p1.png",
    "lattafa": "/images/white1.png",
    "ahmed": "/images/white2.png",
    "niche": "/images/p3.png",
    "cosmetics": "/images/cat_women.png",
};

function decodeHTML(html: string) {
    if (!html) return '';
    return html
        .replace(/&#8217;/g, "'")
        .replace(/&#8211;/g, "-")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}



function getCategoryImage(cat: Category): string {
    const slug = cat.slug.toLowerCase();
    
    // Hardcoded overrides for key homepage categories
    if (slug.includes('best-sellers')) return "/cat-best-sellers.jpg";
    if (slug.includes('womens-fragrances') || slug === 'womens') return "/cat-womens-fragrances.jpg";
    if (slug.includes('mens-fragrances') || slug === 'mens') return "https://backend.jerseyperfume.com/wp-content/uploads/2026/04/91laFHfKyL._SL1500_.jpg";

    // Default to API image if available
    if (cat.image?.src) return cat.image.src;
    
    // Traditional fallbacks
    for (const key of Object.keys(categoryFallbacks)) {
        if (slug.includes(key)) return categoryFallbacks[key];
    }
    
    return "/images/cat_men.png";
}

const brandNames = [
    "GIORGIO ARMANI", "BURBERRY", "PACO RABANNE", "GIVENCHY", "JIMMY CHOO",
    "DUMONT PARIS", "LATTAFA", "RASASI", "BVLGARI", "VERSACE", "DIOR", "CHANEL",
    "CREED", "TOM FORD", "ARMAF", "MAISON ALHAMBRA", "AL HARAMAIN"
];

export default function HomeClient({ bestSellers, newArrivals, gourmandProducts, onSaleProducts, blogPosts, categories, slides }: Props) {
    const activeSlides = slides.length > 0 ? slides : FALLBACK_SLIDES;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [brokenSlides, setBrokenSlides] = useState<Set<number>>(new Set());
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef<number | null>(null);
    const slidesLenRef = useRef(activeSlides.length);
    slidesLenRef.current = activeSlides.length;
    const brokenSlidesRef = useRef(brokenSlides);
    brokenSlidesRef.current = brokenSlides;

    // Category scroll indicator
    const catGridRef = useRef<HTMLDivElement>(null);
    const [activeCatDot, setActiveCatDot] = useState(0);
    // Only show top-level categories (parent === 0) to avoid duplicates like "Men" + "Men's Fragrances"
    const visibleCats = categories.filter(c => 
        c.count > 0 && 
        c.parent === 0 && 
        c.slug !== 'uncategorized' &&
        c.slug !== 'men' &&
        c.slug !== 'women'
    );
    const catDotCount = Math.min(visibleCats.length, 8);

    const handleCatScroll = () => {
        const el = catGridRef.current;
        if (!el) return;
        const pct = el.scrollLeft / (el.scrollWidth - el.clientWidth || 1);
        setActiveCatDot(Math.round(pct * (catDotCount - 1)));
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCurrentSlide((prev) => {
                let next = (prev + 1) % slidesLenRef.current;
                let guard = slidesLenRef.current;
                while (brokenSlidesRef.current.has(next) && guard-- > 0) next = (next + 1) % slidesLenRef.current;
                return next;
            });
        }, 5000);
    };

    useEffect(() => {
        startTimer();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // Auto-advance past any slide whose image failed to load
    useEffect(() => {
        if (!brokenSlides.has(currentSlide) || brokenSlides.size >= slidesLenRef.current) return;
        setCurrentSlide((prev) => (prev + 1) % slidesLenRef.current);
    }, [brokenSlides, currentSlide]);

    const goToSlide = (i: number) => {
        setCurrentSlide(i);
        startTimer();
    };

    const prevSlide = () => {
        let prev = (currentSlide - 1 + slidesLenRef.current) % slidesLenRef.current;
        let guard = slidesLenRef.current;
        while (brokenSlidesRef.current.has(prev) && guard-- > 0) prev = (prev - 1 + slidesLenRef.current) % slidesLenRef.current;
        goToSlide(prev);
    };
    const nextSlide = () => {
        let next = (currentSlide + 1) % slidesLenRef.current;
        let guard = slidesLenRef.current;
        while (brokenSlidesRef.current.has(next) && guard-- > 0) next = (next + 1) % slidesLenRef.current;
        goToSlide(next);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
        touchStartX.current = null;
    };

    return (
        <div className={styles.homeWrapper}>

            {/* HERO SLIDER */}
            <section
                className={styles.heroSlider}
                aria-label="Hero Slider"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {activeSlides.map((slide, index) => (
                    <div
                        key={index}
                        className={`${styles.slide} ${index === currentSlide ? styles.activeSlide : ""}`}
                    >
                        <Link href={slide.href} className={styles.slideLink}>
                            {/* unoptimized: load directly from WordPress, bypassing /_next/image proxy */}
                            <Image
                                src={slide.bg}
                                alt={decodeHTML(slide.title ?? "")}
                                fill
                                unoptimized
                                priority={index === 0}
                                className={styles.slideImg}
                                onError={() => setBrokenSlides(prev => {
                                    if (prev.has(index)) return prev;
                                    const s = new Set(prev);
                                    s.add(index);
                                    return s;
                                })}
                            />

                            <div className={styles.slideOverlay} />
                        </Link>
                    </div>
                ))}

                <button className={`${styles.slideArrow} ${styles.slideArrowLeft}`} onClick={prevSlide} aria-label="Previous slide">
                    <ChevronLeft size={24} />
                </button>
                <button className={`${styles.slideArrow} ${styles.slideArrowRight}`} onClick={nextSlide} aria-label="Next slide">
                    <ChevronRight size={24} />
                </button>

                <div className={styles.slideDots}>
                    {activeSlides.map((_, i) => brokenSlides.has(i) ? null : (
                        <button
                            key={i}
                            className={`${styles.slideDot} ${i === currentSlide ? styles.activeDot : ""}`}
                            onClick={() => goToSlide(i)}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* CATEGORIES */}
            <section className={styles.section}>
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionEyebrow}>Explore</span>
                        <h2 className={styles.sectionTitle}>Shop By Category</h2>
                    </div>
                    <div className={styles.catScrollWrapper}>
                        <div
                            className={styles.categoryGrid}
                            ref={catGridRef}
                            onScroll={handleCatScroll}
                        >
                            {visibleCats.map((cat) => (
                                <Link href={`/product-category/${cat.slug}`} key={cat.id} className={styles.categoryCard}>
                                    <div className={styles.catImageWrapper}>
                                        <Image
                                            src={getCategoryImage(cat)}
                                            alt={cat.name}
                                            fill
                                            className={styles.catImage}
                                            sizes="(max-width:600px) 38vw, (max-width:1200px) 14vw, 160px"
                                        />
                                        <div className={styles.catOverlay} />
                                        <div className={styles.catNameOverlay}>{decodeHTML(cat.name)}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {/* Scroll dots — visible on mobile only via CSS */}
                        <div className={styles.catDots}>
                            {Array.from({ length: catDotCount }).map((_, i) => (
                                <span key={i} className={`${styles.catDot} ${i === activeCatDot ? styles.catDotActive : ""}`} />
                            ))}
                        </div>
                        <div className={styles.catSwipeHint}>
                            <ChevronLeft size={12} /> swipe to explore <ChevronRight size={12} />
                        </div>
                    </div>
                </div>
            </section>

            {/* PROMO BANNERS GRID */}
            <section className={styles.section} style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
                <div className={styles.editorialSection}>
                    <Link href="/product/lattafa-angham-second-song-eau-de-parfum-100ml-unisex-oriental-vanilla-fragrance-long-lasting-sweet-creamy-scent/" className={styles.editorialLeft}>
                        <Image src="/images/lattafa.jpeg" alt="Angham Second Song by Lattafa" fill style={{ objectFit: "cover" }} />
                        <div className={styles.editorialOverlay} />
                        <div className={styles.editorialContent}>
                            <span className={styles.editorialTag}>Trending Now</span>
                            <h2 className={styles.editorialHeading}>ANGHAM SECOND SONG</h2>
                            <p className={styles.editorialSub}>by Lattafa</p>
                            <span className={styles.editorialCta}>Shop Now <ChevronRight size={14} /></span>
                        </div>
                    </Link>

                    <div className={styles.editorialRight}>
                        <Link href="/shop?search=ahmed+al+maghribi" className={styles.editorialSmall}>
                            <Image src={`${SITE_DOMAIN}/wp-content/uploads/2026/01/Jersey-Banner-23-01.png`} alt="Ahmed Al Maghribi" fill style={{ objectFit: "cover" }} />
                            <div className={styles.editorialOverlay} />
                            <div className={styles.editorialContent}>
                                <span className={styles.editorialTag}>Featured Brand</span>
                                <h3 className={styles.editorialHeadingSm}>THE LUXURY COLLECTION</h3>
                                <p className={styles.editorialSub} style={{ fontStyle: 'normal', fontSize: '0.7rem' }}>Ahmed Al Maghribi</p>
                                <span className={styles.editorialCta}>Explore Collection <ChevronRight size={14} /></span>
                            </div>
                        </Link>

                        <Link href="/shop?search=tumi" className={styles.editorialSmall}>
                            <Image src={`${SITE_DOMAIN}/wp-content/uploads/2026/01/Tumi-Product-Banner.png`} alt="TUMI" fill style={{ objectFit: "cover" }} />
                            <div className={styles.editorialOverlay} />
                            <div className={styles.editorialContent}>
                                <span className={styles.editorialTag}>Exclusive</span>
                                <h3 className={styles.editorialHeadingSm}>TUMI SIGNATURE</h3>
                                <p className={styles.editorialSub} style={{ fontStyle: 'normal', fontSize: '0.7rem' }}>Luxury Travel Scents</p>
                                <span className={styles.editorialCta}>Shop Now <ChevronRight size={14} /></span>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* BEST SELLERS */}
            {bestSellers.length > 0 && (
                <section className={styles.section}>
                    <div className="container">
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Best Sellers</h2>
                        </div>
                        <div className={styles.productsGrid}>
                            {bestSellers.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                        <div className={styles.sectionCta}>
                            <Link href="/shop" className={styles.outlineBtn}>View All Products <ChevronRight size={16} /></Link>
                        </div>
                    </div>
                </section>
            )}

            {/* TRUST BAR */}
            <div className={styles.trustBar}>
                <div className="container">
                    <div className={styles.trustGrid}>
                        <div className={styles.trustItem}>
                            <div className={styles.trustIcon}>🚛</div>
                            <div>
                                <div className={styles.trustTitle}>Free Shipping</div>
                                <div className={styles.trustSub}>On orders over $59.99</div>
                            </div>
                        </div>
                        <div className={styles.trustDivider} />
                        <div className={styles.trustItem}>
                            <div className={styles.trustIcon}>✅</div>
                            <div>
                                <div className={styles.trustTitle}>100% Authentic</div>
                                <div className={styles.trustSub}>Certified original brands</div>
                            </div>
                        </div>
                        <div className={styles.trustDivider} />
                        <div className={styles.trustItem}>
                            <div className={styles.trustIcon}>🔄</div>
                            <div>
                                <div className={styles.trustTitle}>Easy Returns</div>
                                <div className={styles.trustSub}>30-day return policy</div>
                            </div>
                        </div>
                        <div className={styles.trustDivider} />
                        <div className={styles.trustItem}>
                            <div className={styles.trustIcon}>🔒</div>
                            <div>
                                <div className={styles.trustTitle}>Secure Payment</div>
                                <div className={styles.trustSub}>Safe & encrypted checkout</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW ARRIVALS */}
            {newArrivals.length > 0 && (
                <section className={styles.sectionDark}>
                    <div className="container">
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionEyebrowLight}>Just Dropped</span>
                            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}>New Arrivals</h2>
                        </div>
                        <div className={styles.productsGrid}>
                            {newArrivals.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                        <div className={styles.sectionCta}>
                            <Link href="/shop" className={styles.solidBtn}>Shop All New Arrivals <ChevronRight size={16} /></Link>
                        </div>
                    </div>
                </section>
            )}

            {/* WATCH & SHOP — Instagram Reels */}
            <section className={styles.reelsSection}>
                <div className="container">
                    <div className={styles.reelsHeader}>
                        <div className={styles.reelsHeadingBlock}>
                            <span className={styles.reelsEyebrow}>Social</span>
                            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}>Watch &amp; Shop</h2>
                        </div>
                        <a
                            href="https://www.instagram.com/jerseyperfumeusa/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.igFollowBtn}
                        >
                            Follow @jerseyperfumeusa on Instagram
                        </a>
                    </div>
                    <div className={styles.igGrid}>
                        <div className={styles.reelWrapper}>
                            <InstagramEmbed url="https://www.instagram.com/reel/DUOGFMrDU3Q/" />
                            <h3 className={styles.reelTitle}>Lattafa Angham Second Song</h3>
                            <Link href="/product/lattafa-angham-second-song-eau-de-parfum-100ml-unisex-oriental-vanilla-fragrance-long-lasting-sweet-creamy-scent/" className={styles.reelShopBtn} style={{ background: 'linear-gradient(135deg, #ce1126 0%, #d4a853 100%)', color: '#fff', margin: '0 auto', width: 'fit-content', padding: '0.6rem 2rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none', gap: '4px' }}>Shop Now <ChevronRight size={14} /></Link>
                        </div>
                        <div className={styles.reelWrapper}>
                            <InstagramEmbed url="https://www.instagram.com/p/DNDnLzfC0-Z/" />
                            <h3 className={styles.reelTitle}>Jean Lowe Vibe</h3>
                            <Link href="/product/jean-lowe-vibe-perfume-by-maison-alhambra-100-ml-edp-unisex-3-4-fl-oz/" className={styles.reelShopBtn} style={{ background: 'linear-gradient(135deg, #ce1126 0%, #d4a853 100%)', color: '#fff', margin: '0 auto', width: 'fit-content', padding: '0.6rem 2rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none', gap: '4px' }}>Shop Now <ChevronRight size={14} /></Link>
                        </div>
                        <div className={styles.reelWrapper}>
                            <InstagramEmbed url="https://www.instagram.com/reel/DQXk3C6k0pl/" />
                            <h3 className={styles.reelTitle}>Ahmed Al Maghribi</h3>
                            <Link href="/shop?search=ahmed+al+maghribi" className={styles.reelShopBtn} style={{ background: 'linear-gradient(135deg, #ce1126 0%, #d4a853 100%)', color: '#fff', margin: '0 auto', width: 'fit-content', padding: '0.6rem 2rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none', gap: '4px' }}>Shop Now <ChevronRight size={14} /></Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* REVIEWS */}
            <section className={styles.reviewsSection}>
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionEyebrowLight}>Testimonials</span>
                        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}>What Our Customers Say</h2>
                    </div>
                    <div className={styles.reviewsGrid}>
                        {[
                            { text: '"Absolutely the best place to buy perfumes. 100% authentic and the shipping was incredibly fast. Will definitely order again!"', author: "Sarah M.", stars: 5 },
                            { text: '"I was skeptical at first due to the low prices, but the Lattafa Khamrah I received is genuine and smells divine."', author: "James R.", stars: 5 },
                            { text: '"Great customer service and amazing packaging. Everything arrived safe and sound. Highly recommended!"', author: "Emily C.", stars: 5 },
                        ].map((review, i) => (
                            <div key={i} className={styles.reviewCard}>
                                <div className={styles.reviewStars}>
                                    {"★".repeat(review.stars)}
                                </div>
                                <p className={styles.reviewText}>{review.text}</p>
                                <div className={styles.reviewAuthorRow}>
                                    <div className={styles.reviewAvatar}>{review.author[0]}</div>
                                    <span className={styles.reviewAuthor}>{review.author}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BRAND CAROUSEL */}
            <section className={styles.brandsSection}>
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionEyebrow}>Curated For You</span>
                        <h2 className={styles.sectionTitle}>Premium Brands</h2>
                    </div>
                </div>
                <div className={styles.brandCarousel}>
                    <div className={styles.brandTrack}>
                        {[...brandNames, ...brandNames].map((brand, i) => (
                            <BrandLogo key={i} brand={brand} />
                        ))}
                    </div>
                </div>
            </section>

            {/* BLOG SECTION */}
            {blogPosts.length > 0 && (
                <section className={styles.section}>
                    <div className="container">
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionEyebrow}>Insights</span>
                            <h2 className={styles.sectionTitle}>The Fragrance Journal</h2>
                        </div>
                        <div className={styles.blogGrid}>
                            {blogPosts.map((post) => {
                                const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
                                const imgUrl = featuredMedia?.source_url || "/images/hero.png";
                                return (
                                    <Link href={`/blog/${post.slug}`} key={post.id} className={styles.blogCard}>
                                        <div className={styles.blogImgWrapper}>
                                            <Image src={imgUrl} alt={post.title.rendered} fill style={{ objectFit: "cover" }} />
                                            <div className={styles.blogCardOverlay} />
                                        </div>
                                        <div className={styles.blogContent}>
                                            <span className={styles.blogDate}>{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                                            <h3 className={styles.blogTitle} dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                                            <span className={styles.blogReadBtn}>Read Story <ChevronRight size={14} /></span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                        <div className={styles.sectionCta}>
                            <Link href="/blog" className={styles.outlineBtn}>Read All Articles <ChevronRight size={16} /></Link>
                        </div>
                    </div>
                </section>
            )}

            {/* FOOTER HERO BANNER */}
            <section className={styles.footerBanner}>
                <Image src="/images/hero.png" alt="Exclusive Collection" fill style={{ objectFit: "cover" }} />
                <div className={styles.footerBannerOverlay} />
                <div className={styles.footerBannerContent}>
                    <span className={styles.footerBannerEyebrow}>Limited Time Offer</span>
                    <h2 className={styles.footerBannerTitle}>THE EXCLUSIVE COLLECTION</h2>
                    <p className={styles.footerBannerSub}>Dive into a world of rare and exotic scents. Uncover your signature essence today.</p>
                    <Link href="/product-category/hot-products" className={styles.footerBannerBtn}>DISCOVER MORE <ChevronRight size={16} /></Link>
                </div>
            </section>

            <div style={{ height: "60px" }} />
        </div>
    );
}
