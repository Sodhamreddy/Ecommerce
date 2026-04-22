import React from 'react';
import { notFound } from 'next/navigation';
import { fetchWPPageAction } from '@/app/actions';
import styles from './InfoPage.module.css';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchAllWPPages } from '@/lib/woocommerce';
import ContactForm from '@/components/ContactForm';

export const dynamicParams = false;

export async function generateStaticParams() {
    try {
        const pages = await fetchAllWPPages();
        return pages.map((page) => ({
            slug: page.slug,
        }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await fetchWPPageAction(slug);
    if (!page) return { title: 'Page Not Found | Jersey Perfume' };

    const yoast = page.yoast_head_json;
    const title = yoast?.title || `${page.title.rendered} | Jersey Perfume`;
    const description = yoast?.description
        || page.excerpt?.rendered.replace(/<[^>]+>/g, '').substring(0, 160)
        || page.content.rendered.replace(/<[^>]+>/g, '').substring(0, 160);
    const featuredImage = page._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const ogImages = yoast?.og_image?.map((img: { url: string }) => img.url) || (featuredImage ? [featuredImage] : []);

    return {
        title,
        description,
        openGraph: {
            title: yoast?.og_title || title,
            description: yoast?.og_description || description,
            images: ogImages,
        },
        twitter: {
            card: 'summary_large_image',
            title: yoast?.og_title || title,
            description: yoast?.og_description || description,
            images: ogImages,
        },
    };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await fetchWPPageAction(slug);

    if (!page) {
        return notFound();
    }

    const isContactPage = slug === 'contact-us';

    return (
        <div className={styles.infoPageWrapper}>
            {/* Minimalist Page Header */}
            <header className={styles.infoPageHeader}>
                <div className="container">
                    <nav className={styles.breadcrumbs}>
                        <Link href="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>{page.title.rendered}</span>
                    </nav>
                    <h1 className={styles.pageTitle} dangerouslySetInnerHTML={{ __html: page.title.rendered }} />
                </div>
            </header>

            {/* Content Section */}
            <section className={styles.infoPageContent}>
                {isContactPage ? (
                    <ContactForm />
                ) : slug === 'about-us' ? (
                    <div className="container">
                        <div className={styles.aboutHero}>
                            <div className={styles.aboutHeroText}>
                                <h2>Our Journey to Excellence</h2>
                                <p>Founded on a passion for exquisite scents, Jersey Perfume has grown from a boutique vision into a premier destination for fragrance enthusiasts worldwide. Based in the USA, we curate the world's most prestigious perfume houses to bring luxury within reach.</p>
                            </div>
                            <div className={styles.aboutHeroImage}>
                                <Image src="/editorial-woman.jpg" alt="Luxury Fragrance" width={600} height={400} style={{ objectFit: 'cover' }} />
                            </div>
                        </div>

                        <div className={styles.valuesGrid}>
                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>🏆</div>
                                <h3>100% Authenticity</h3>
                                <p>We guarantee that every bottle in our collection is 100% original. We source directly from authorized distributors to ensure the highest quality standards.</p>
                            </div>
                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>🌐</div>
                                <h3>Global Prestige</h3>
                                <p>From the heart of New Jersey to the global stage, we deliver curated collections of designer, niche, and rare Arabian fragrances to over 50 countries.</p>
                            </div>
                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>💎</div>
                                <h3>Luxury for Everyone</h3>
                                <p>Our mission is to democratize high-end perfumery. By maintaining efficient operations, we offer premium brands at prices that remain accessible.</p>
                            </div>
                        </div>

                        <div className={styles.brandStorySection}>
                            <div className={styles.storyContent}>
                                <h3>The Jersey Perfume Story</h3>
                                <p>Jersey Perfume started with a simple belief: that a signature scent is a powerful form of self-expression. We understood that finding the perfect fragrance should be an experience of discovery and trust.</p>
                                <p>Today, we host over 1,000 unique fragrances, ranging from timeless European classics like Dior and Versace to the opulent and trending scents of the Middle East, such as Lattafa and Ahmed Al Maghribi.</p>
                                <p>Our dedicated team of fragrance experts carefully inspects every shipment, ensuring that when you open a package from Jersey Perfume, you are experiencing the true essence of luxury.</p>
                            </div>
                        </div>

                        <div className={styles.aboutHero} style={{ gridTemplateColumns: '1fr 1.1fr', marginTop: '5rem' }}>
                            <div className={styles.aboutHeroImage}>
                                <Image src="https://backend.jerseyperfume.com/wp-content/uploads/2026/04/91laFHfKyL._SL1500_.jpg" alt="Curated Classics" width={600} height={600} style={{ objectFit: 'cover' }} />
                            </div>
                            <div className={styles.aboutHeroText}>
                                <h2>Curation Without Borders</h2>
                                <p>We believe that the world of fragrance is vast and should be explored without limits. Our collection spans from the historic parfumeries of France and Italy to the rising stars of artisanal Middle Eastern design.</p>
                                <p style={{ marginTop: '1.5rem' }}>Whether you seek the crisp freshness of a European citrus or the deep, oud-heavy mystery of the desert, we bring the entire olfactory world to your doorstep with rigorous quality control and unparalleled service.</p>
                            </div>
                        </div>

                        <div className={styles.aboutHero} style={{ marginTop: '5rem' }}>
                            <div className={styles.aboutHeroText}>
                                <h2>A Signature for Every Soul</h2>
                                <p>A scent is more than a product—it is a memory, a mood, and a statement. At Jersey Perfume, we take pride in helping you find the fragrance that speaks your name before you even enter the room.</p>
                                <p style={{ marginTop: '1.5rem' }}>Our diverse range ensures that every individual, every occasion, and every emotion has a corresponding note in our symphony of scents.</p>
                            </div>
                            <div className={styles.aboutHeroImage}>
                                <Image src="/cat-womens-fragrances.jpg" alt="Exquisite Details" width={600} height={400} style={{ objectFit: 'cover' }} />
                            </div>
                        </div>
                    </div>
                ) : ( (page.content.rendered as string) ? (
                    <div className="container">
                        <div
                            className={styles.contentBox}
                            dangerouslySetInnerHTML={{
                                __html: (page.content.rendered as string)
                                    .replace(/https:\/\/backend\.jerseyperfume\.com/g, 'https://jerseyperfume.com')
                                    .replace(/info@backend\.jerseyperfume\.com/g, 'info@jerseyperfume.com')
                                    .replace(/info@jerseyparfums\.com/g, 'info@jerseyperfume.com')
                                    .replace(/support@jerseyperfume\.com/g, 'info@jerseyperfume.com')
                            }}
                        />
                    </div>
                ) : null )}
            </section>
        </div>
    );
}
