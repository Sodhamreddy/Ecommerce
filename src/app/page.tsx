"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Star, Truck, ShieldCheck, Lock, ChevronRight } from "lucide-react";
import styles from "./page.module.css";
import { useState, useEffect } from "react";
import BrandLogo from "@/components/BrandLogo";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/api";
import { fetchProductsAction, fetchBlogPostsAction } from "@/app/actions";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "VALENTINE'S SALE",
      subtitle: "UP TO 80% OFF LUXURY SCENTS",
      bg: "url('/images/hero.png') center/cover no-repeat"
    },
    {
      title: "NEW ARRIVALS",
      subtitle: "DISCOVER THE LATEST TRENDS",
      bg: "url('/images/p3.png') center/cover no-repeat"
    }
  ];

  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivalsCards, setNewArrivalsCards] = useState<Product[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    const loadProducts = async () => {
      try {
        const best = await fetchProductsAction(1, 4, '', '', '', '', 'popularity', 'desc');
        if (best && best.products) setBestSellers(best.products);

        const newArr = await fetchProductsAction(1, 4, '', '', '', '', 'date', 'desc');
        if (newArr && newArr.products) setNewArrivalsCards(newArr.products);

        const blogs = await fetchBlogPostsAction(3);
        if (blogs && Array.isArray(blogs)) setBlogPosts(blogs);
      } catch (error) {
        console.error("Failed to load products or blogs for homepage", error);
      }
    };
    loadProducts();

    return () => clearInterval(timer);
  }, []);

  const categories = [
    { name: "Men's Fragrances", image: "/images/cat_men.png", url: "/shop?category=mens-fragrances" },
    { name: "Women's Fragrances", image: "/images/cat_women.png", url: "/shop?category=womens-fragrances" },
    { name: "Dumont Fragrances", image: "/images/p1.png", url: "/shop?search=dumont" },
    { name: "Lattafa Pride", image: "/images/white1.png", url: "/shop?search=lattafa" },
    { name: "Ahmed Al Maghribi", image: "/images/white2.png", url: "/shop?search=ahmed-al-maghribi" },
    { name: "Niche Fragrances", image: "/images/p3.png", url: "/shop?category=best-sellers" }, // Fallback to best sellers
  ];



  const brandNames = [
    "GIORGIO ARMANI", "BURBERRY", "PACO RABANNE", "GIVENCHY", "JIMMY CHOO", "DUMONT PARIS", "LATTAFA",
    "RASASI", "BVLGARI", "VERSACE", "DIOR", "CHANEL", "CREED", "TOM FORD"
  ];

  return (
    <div className='homeWrapper'>

      {/* Hero Slider */}
      <div className={styles.heroSlider}>
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`${styles.slide} ${index === currentSlide ? styles.activeSlide : ''}`}
            style={{ background: slide.bg }}
          >
            <div className={styles.slideContent}>
              <h1 className={styles.sliderTitle}>{slide.title}</h1>
              <p className={styles.sliderSubtitle}>{slide.subtitle}</p>
              <button className={styles.sliderBtn}>EXPLORE COLLECTION</button>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Ticker */}
      <div className={styles.promoTicker}>
        <div className={styles.tickerContent}>
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} style={{ display: 'flex' }}>
              <div className={styles.tickerItem}>🔥 VALENTINE'S SALE IS LIVE</div>
              <div className={styles.tickerItem}>✨ FREE SHIPPING ON ALL ORDERS OVER $59</div>
              <div className={styles.tickerItem}>💎 100% AUTHENTIC BRANDS</div>
              <div className={styles.tickerItem}>🚀 SAME DAY DISPATCH</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Shop By Category</h2>
          <div className={styles.categoryGrid}>
            {categories.map((cat, i) => (
              <Link href={cat.url} key={i} className={styles.categoryCard}>
                <div className={styles.catImageWrapper}>
                  <Image src={cat.image} alt={cat.name} fill className={styles.catImage} />
                </div>
                <div className={styles.catName}>{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* Two Column Promo */}
      <section className={styles.sectionAlt}>
        <div className={styles.perfumeDecoTL}></div>
        <div className={styles.perfumeDecoBR}></div>
        <div className="container">
          <div className={styles.twoColBanner}>
            <Link href="/shop?search=dumont" className={styles.twoColItem}>
              <Image src="/images/p3.png" alt="Dumont" fill style={{ objectFit: 'cover' }} />
              <div className={styles.twoColItemOverlay}>
                <div className={styles.twoColBrand}>DUMONT</div>
                <h3 className={styles.twoColTitle}>DUMONT'S BEST-SELLING LUXURY PERFUMES</h3>
                <p className={styles.twoColSub}>Elevate Your Fragrance Collection!</p>
              </div>
            </Link>
            <Link href="/shop?search=lattafa" className={styles.twoColItem}>
              <Image src="/images/cat_women.png" alt="Lattafa" fill style={{ objectFit: 'cover' }} />
              <div className={styles.twoColItemOverlay}>
                <div className={styles.twoColBrand}>LATTAFA</div>
                <h3 className={styles.twoColTitle}>BEST SELLING & NEWEST ARRIVAL</h3>
                <p className={styles.twoColSub}>Discover the Trending Scents!</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Best Sellers</h2>
          <div className={styles.productsGrid}>
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className={styles.sectionAlt}>
        <div className={styles.perfumeDecoTL}></div>
        <div className={styles.perfumeDecoBR} style={{ borderColor: 'rgba(0,0,0,0.05)' }}></div>
        <div className="container">
          <h2 className={styles.sectionTitle}>New Arrivals</h2>
          <div className={styles.productsGrid}>
            {newArrivalsCards.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
          <div className={styles.reviewsGrid}>
            <div className={styles.reviewCard}>
              <div className={styles.stars}>★★★★★</div>
              <p className={styles.reviewText}>"Absolutely the best place to buy perfumes. 100% authentic and the shipping was incredibly fast. Will definitely order again!"</p>
              <div className={styles.reviewAuthor}>- Sarah Mitchell</div>
            </div>
            <div className={styles.reviewCard}>
              <div className={styles.stars}>★★★★★</div>
              <p className={styles.reviewText}>"I was skeptical at first due to the low prices, but the Lattafa Khamrah I received is genuine and smells divine."</p>
              <div className={styles.reviewAuthor}>- James Rodriguez</div>
            </div>
            <div className={styles.reviewCard}>
              <div className={styles.stars}>★★★★★</div>
              <p className={styles.reviewText}>"Great customer service and amazing packaging. Everything arrived safe and sound. Highly recommended!"</p>
              <div className={styles.reviewAuthor}>- Emily Chen</div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Carousel */}
      <section className={styles.sectionAlt} style={{ padding: '3rem 0' }}>
        <div className={styles.perfumeDecoTL}></div>
        <div className="container" style={{ overflow: 'hidden' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '2rem', marginBottom: '2rem' }}>Expertly Curated Brands</h2>
          <div className={styles.brandCarousel}>
            <div className={styles.brandTrack}>
              {[...brandNames, ...brandNames].map((brand, i) => (
                <BrandLogo key={i} brand={brand} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Commercial Banner */}
      <section className={styles.commercialBanner}>
        <div className="container">
          <div style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '500', marginBottom: '1rem' }}>
            Your Perfect Scent at the Perfect Price
          </div>
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: '1.1rem', marginBottom: '4rem' }}>
            Over 1 million packages shipped
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '1000px', margin: '0 auto', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', flex: 1, minWidth: '200px' }}>
              <Truck size={48} style={{ marginBottom: '1.5rem' }} strokeWidth={1} />
              <div style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.05em' }}>FREE SHIPPING OVER $59</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1, minWidth: '200px' }}>
              <Star size={48} style={{ marginBottom: '1.5rem' }} strokeWidth={1} />
              <div style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.05em' }}>SATISFACTION GUARANTEED</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1, minWidth: '200px' }}>
              <ShieldCheck size={48} style={{ marginBottom: '1.5rem' }} strokeWidth={1} />
              <div style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.05em' }}>100% AUTHENTIC</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1, minWidth: '200px' }}>
              <Lock size={48} style={{ marginBottom: '1.5rem' }} strokeWidth={1} />
              <div style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.05em' }}>SAFE AND SECURE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Reels Section (TikTok / Instagram style) - MOVED ABOVE BLOG */}
      <section className={styles.sectionAlt} style={{ padding: '4rem 0 6rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
            <div>
              <h2 style={{
                margin: 0,
                background: '#dcdcdc',
                padding: '6px 16px',
                display: 'inline-block',
                fontFamily: 'var(--font-serif)',
                fontSize: '2.5rem',
                letterSpacing: '0.15em',
                color: '#333'
              }}>WATCH &amp; SHOP</h2>
              <div style={{ width: '80px', height: '1px', background: '#000', marginTop: '10px', marginLeft: '6px' }} />
            </div>
            <Link href="/shop" style={{ textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem', color: '#111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>View all reels</Link>
          </div>

          <div className={styles.reelsTrack}>
            {newArrivalsCards.length > 0 ? newArrivalsCards.map((product, i) => {
              const originalPrice = parseInt(product.prices.regular_price) / 100;
              const currentPrice = parseInt(product.prices.price) / 100;

              // More reliable Pexels and raw MP4 links
              const freeVideoReels = [
                "https://videos.pexels.com/video-files/5607310/5607310-hd_1080_1920_30fps.mp4",
                "https://videos.pexels.com/video-files/6987595/6987595-uhd_2160_4096_25fps.mp4",
                "https://videos.pexels.com/video-files/7036224/7036224-uhd_2160_3840_25fps.mp4",
                "https://videos.pexels.com/video-files/8782337/8782337-uhd_2160_3840_25fps.mp4"
              ];
              const videoSrc = freeVideoReels[i % freeVideoReels.length];
              const posterImg = product.images?.[0]?.src || '/images/hero.png';

              return (
                <div key={`reel-${i}`} className={styles.reelSlot}>
                  <div className={styles.reelVideoBox}>

                    {/* TRUE HTML5 Auto-playing Video Tag with Poster Fallback */}
                    <video
                      src={videoSrc}
                      poster={posterImg}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className={styles.realReelVideo}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                    />
                    <div className={styles.reelOverlay}></div>

                    <div className={styles.reelMuteBtn}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                    </div>

                    {/* Product Card Tag Inside Video */}
                    <div className={styles.reelProductTag}>
                      <div className={styles.reelProdImg}>
                        <Image src={product.images?.[0]?.src || '/images/hero.png'} alt="thumb" fill style={{ objectFit: 'cover' }} />
                      </div>
                      <div className={styles.reelProdInfo}>
                        <h4 className={styles.reelProdTitle} dangerouslySetInnerHTML={{ __html: product.name }} />
                        <div className={styles.reelPrices}>
                          {originalPrice > currentPrice && <span className={styles.reelOldPrice}>${originalPrice.toFixed(2)}</span>}
                          <span className={styles.reelPrice}>${currentPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div style={{ textAlign: 'center', width: '100%', padding: '2rem' }}>Loading Reels...</div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className={styles.section} style={{ backgroundColor: '#fdfdfd' }}>
        <div className="container">
          <h2 className={styles.sectionTitle}>The Fragrance Journal</h2>
          <div className={styles.blogHomeGrid}>
            {blogPosts.map((post) => {
              const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
              const imgUrl = featuredMedia?.source_url || '/images/hero.png';
              return (
                <Link href={`/blog/${post.slug}`} key={post.id} className={styles.blogHomeCard}>
                  <div className={styles.blogHomeImgWrapper}>
                    <Image src={imgUrl} alt={post.title.rendered} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div className={styles.blogHomeContent}>
                    <span className={styles.blogHomeDate}>{new Date(post.date).toLocaleDateString()}</span>
                    <h3 className={styles.blogHomeTitle} dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                    <span className={styles.blogHomeReadBtn}>Read Story <ChevronRight size={14} /></span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/blog" className={styles.sliderBtn} style={{ background: '#000', color: '#fff', padding: '15px 40px' }}>
              READ ALL ARTICLES
            </Link>
          </div>
        </div>
      </section>

      {/* Banner Above Footer (Updated with Overlay) */}
      <section className={styles.footerBanner}>
        <Image src="/images/hero.png" alt="Collection" fill style={{ objectFit: 'cover' }} />
        <div className={styles.footerBannerOverlay}></div> {/* Dark overlay */}
        <div className={styles.footerBannerContent}>
          <h2 className={styles.footerBannerTitle}>THE EXCLUSIVE COLLECTION</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#fff' }}>Dive into a world of rare and exotic scents. Uncover your signature essence today.</p>
          <button className={styles.sliderBtn} style={{ background: 'transparent', border: '2px solid white', color: 'white' }}>DISCOVER MORE</button>
        </div>
      </section>

      <div className={styles.footerSpace}></div>
    </div>
  );
}
