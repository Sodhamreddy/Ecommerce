import React from 'react';
import { notFound } from 'next/navigation';
import { fetchWPPageAction } from '@/app/actions';
import styles from './InfoPage.module.css';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { fetchAllWPPages } from '@/lib/woocommerce';

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

    return {
        title: `${page.title.rendered} | Jersey Perfume`,
        description: `Read more about ${page.title.rendered} on Jersey Perfume.`,
    };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await fetchWPPageAction(slug);

    if (!page) {
        return notFound();
    }

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

            {/* Rich Text Body Content Extracted from WordPress */}
            <section className={styles.infoPageContent}>
                <div className="container">
                    <div className={styles.contentBox} dangerouslySetInnerHTML={{ __html: page.content.rendered }}>
                    </div>
                </div>
            </section>
        </div>
    );
}
