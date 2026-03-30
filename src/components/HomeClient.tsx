"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Play, Pause } from "lucide-react";
import styles from "./HomeClient.module.css";
import ProductCard from "./ProductCard";
import { Product, Category } from "@/lib/api";
import { SlideData } from "@/lib/woocommerce";
import BrandLogo from "./BrandLogo";

interface Props {
    bestSellers: Product[];
    newArrivals: Product[];
    gourmandProducts: Product[];
    blogPosts: any[];
    categories: Category[];
    slides: SlideData[];
}

// Fallback slides used when SmartSlider API is unavailable
const FALLBACK_SLIDES: SlideData[] = [
    {
        title: "EASTER\nSALE 2026",
        subtitle: "CELEBRATE WITH OUR LATEST FRAGRANCE DEALS",
        cta: "SHOP THE SALE",
        href: "/shop",
        bg: "https://jerseyperfume.com/wp-content/uploads/2026/03/JERSEY-PERFUME-BANNER-EASTER.jpg",
        accent: "#d4a853",
    },
    {
        title: "TUMI\nEXCLUSIVE",
        subtitle: "DIVE INTO RARE AND EXOTIC SCENTS",
        cta: "SHOP NOW",
        href: "/shop",
        bg: "https://jerseyperfume.com/wp-content/uploads/2026/01/Tumi-Product-Banner.png",
        accent: "#ffffff",
    },
    {
        title: "LUXURY\nFRAGRANCE",
        subtitle: "AUTHENTIC DESIGNER SCENTS AT UNBEATABLE PRICES",
        cta: "EXPLORE NOW",
        href: "/shop",
        bg: "https://jerseyperfume.com/wp-content/uploads/2026/01/Jersey-Banner-23-01.png",
        accent: "#d4a853",
    },
];


// Fallback images keyed by slug fragment if the API has no image
const categoryFallbacks: Record<string, string> = {
    "mens": "/images/cat_men.png",
    "womens": "/images/cat_women.png",
    "women": "/images/cat_women.png",
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
    if (cat.image?.src) return cat.image.src;
    const slug = cat.slug.toLowerCase();
    for (const key of Object.keys(categoryFallbacks)) {
        if (slug.includes(key)) return categoryFallbacks[key];
    }
    return "/images/cat_men.png";
}

const brandNames = [
    "GIORGIO ARMANI", "BURBERRY", "PACO RABANNE", "GIVENCHY", "JIMMY CHOO",
    "DUMONT PARIS", "LATTAFA", "RASASI", "BVLGARI", "VERSACE", "DIOR", "CHANEL",
    "CREED", "TOM FORD",
];

const freeVideos = [
    "https://assets.mixkit.co/videos/preview/mixkit-female-hand-with-a-perfume-bottle-40443-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-woman-spraying-her-neck-with-perfume-4183-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-pouring-perfume-from-a-bottle-on-a-marble-table-25063-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-female-hands-applying-body-lotion-42858-large.mp4",
];

export default function HomeClient({ bestSellers, newArrivals, gourmandProducts, blogPosts, categories, slides }: Props) {
    const activeSlides = slides.length > 0 ? slides : FALLBACK_SLIDES;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [playingReel, setPlayingReel] = useState<number | null>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef<number | null>(null);
    const slidesLenRef = useRef(activeSlides.length);
    slidesLenRef.current = activeSlides.length;

    // Category scroll indicator
    const catGridRef = useRef<HTMLDivElement>(null);
    const [activeCatDot, setActiveCatDot] = useState(0);
    const visibleCats = categories.filter(c => c.count > 0);
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
            setCurrentSlide((prev) => (prev + 1) % slidesLenRef.current);
        }, 5000);
    };

    useEffect(() => {
        startTimer();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const goToSlide = (i: number) => {
        setCurrentSlide(i);
        startTimer();
    };

    const prevSlide = () => goToSlide((currentSlide - 1 + activeSlides.length) % activeSlides.length);
    const nextSlide = () => goToSlide((currentSlide + 1) % activeSlides.length);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
        touchStartX.current = null;
    };

    const toggleReel = (i: number) => {
        const video = videoRefs.current[i];
        if (!video) return;
        if (playingReel === i) {
            video.pause();
            setPlayingReel(null);
        } else {
            videoRefs.current.forEach((v, idx) => { if (v && idx !== i) v.pause(); });
            video.play().catch(() => { });
            setPlayingReel(i);
        }
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
                            <Image
                                src={slide.bg}
                                alt={decodeHTML(slide.title ?? "")}
                                fill
                                priority={index === 0}
                                style={{ objectFit: "cover" }}
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
                    {activeSlides.map((_, i) => (
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
                        <span className={styles.sectionEyebrow}>Browse</span>
                        <h2 className={styles.sectionTitle}>Shop By Category</h2>
                    </div>
                    <div className={styles.catScrollWrapper}>
                        <div
                            className={styles.categoryGrid}
                            ref={catGridRef}
                            onScroll={handleCatScroll}
                        >
                            {visibleCats.map((cat) => (
                                <Link href={`/shop?category=${cat.slug}`} key={cat.id} className={styles.categoryCard}>
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

            {/* EDITORIAL SPLIT BANNER */}
            <section className={styles.editorialSection}>
                <Link href="/shop?category=dumont" className={styles.editorialLeft}>
                    <Image src="https://jerseyperfume.com/wp-content/uploads/2026/01/Jersey-Banner-23-01.png" alt="Dumont" fill style={{ objectFit: "cover" }} />
                    <div className={styles.editorialOverlay} />
                    <div className={styles.editorialContent}>
                        <span className={styles.editorialTag}>Featured Brand</span>
                        <h3 className={styles.editorialHeading}>DUMONT PARIS</h3>
                        <p className={styles.editorialSub}>Best-Selling Luxury Perfumes</p>
                        <span className={styles.editorialCta}>Explore Collection <ChevronRight size={14} /></span>
                    </div>
                </Link>
                <div className={styles.editorialRight}>
                    <Link href="/shop?category=lattafa" className={styles.editorialSmall}>
                        <Image src="https://jerseyperfume.com/wp-content/uploads/2026/01/Jersey-banner-23-01-03.png" alt="Lattafa" fill style={{ objectFit: "cover" }} />
                        <div className={styles.editorialOverlay} />
                        <div className={styles.editorialContent}>
                            <span className={styles.editorialTag}>Trending Now</span>
                            <h3 className={styles.editorialHeadingSm}>LATTAFA</h3>
                            <span className={styles.editorialCta}>Shop Now <ChevronRight size={14} /></span>
                        </div>
                    </Link>
                    <Link href="/shop?category=ahmed-al-maghribi" className={styles.editorialSmall}>
                        <Image src="https://jerseyperfume.com/wp-content/uploads/2026/01/Tumi-Product-Banner.png" alt="Ahmed Al Maghribi" fill style={{ objectFit: "cover" }} />
                        <div className={styles.editorialOverlay} />
                        <div className={styles.editorialContent}>
                            <span className={styles.editorialTag}>Exclusive</span>
                            <h3 className={styles.editorialHeadingSm}>AHMED AL MAGHRIBI</h3>
                            <span className={styles.editorialCta}>Shop Now <ChevronRight size={14} /></span>
                        </div>
                    </Link>
                </div>
            </section>


            {/* BEST SELLERS */}
            {bestSellers.length > 0 && (
                <section className={styles.section}>
                    <div className="container">
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionEyebrow}>Top Picks</span>
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
                                <div className={styles.trustSub}>On orders over $59</div>
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
                                <div className={styles.trustSub}>14-day return policy</div>
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

            {/* WATCH & SHOP */}
            {newArrivals.length > 0 && (
                <section className={styles.reelsSection}>
                    <div className="container">
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionEyebrowLight}>Social</span>
                            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}>Watch &amp; Shop</h2>
                        </div>
                    </div>
                    <div className={styles.reelsScroll}>
                        {newArrivals.slice(0, 4).map((product, i) => {
                            const minorUnit = product.prices.currency_minor_unit ?? 2;
                            const originalPrice = parseInt(product.prices.regular_price) / Math.pow(10, minorUnit);
                            const currentPrice = parseInt(product.prices.price) / Math.pow(10, minorUnit);
                            const badges = ["🔥 Trending", "⚡ New Drop", "💎 Premium", "🌟 Fan Fave"];
                            const imgSrc = product.images?.[0]?.src || "/images/hero.png";
                            const isPlaying = playingReel === i;

                            return (
                                <div key={`reel-${i}`} className={`${styles.reelCard} ${isPlaying ? styles.reelIsPlaying : ''}`}>
                                    <video
                                        ref={(el) => { videoRefs.current[i] = el; }}
                                        src={freeVideos[i % freeVideos.length]}
                                        poster={imgSrc}
                                        loop
                                        muted
                                        playsInline
                                        className={styles.reelVideo}
                                    />
                                    <div className={styles.reelCardOverlay} />
                                    <span className={styles.reelBadge}>{badges[i % badges.length]}</span>
                                    <button
                                        className={styles.reelPlayBtn}
                                        onClick={(e) => { e.stopPropagation(); toggleReel(i); }}
                                        aria-label={isPlaying ? 'Pause' : 'Play'}
                                    >
                                        {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                                    </button>
                                    <Link href={`/product/${product.slug}`} className={styles.reelCardInfo}>
                                        <h4 className={styles.reelCardName} dangerouslySetInnerHTML={{ __html: product.name }} />
                                        <div className={styles.reelCardPrices}>
                                            {originalPrice > currentPrice && (
                                                <span className={styles.reelCardOld}>${originalPrice.toFixed(2)}</span>
                                            )}
                                            <span className={styles.reelCardPrice}>${currentPrice.toFixed(2)}</span>
                                        </div>
                                        <span className={styles.reelCardBtn}>Shop Now →</span>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

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
                    <Link href="/shop" className={styles.footerBannerBtn}>DISCOVER MORE <ChevronRight size={16} /></Link>
                </div>
            </section>

            <div style={{ height: "60px" }} />
        </div>
    );
}
