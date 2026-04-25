import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { API_BASE_URL } from '@/lib/config';
import { fetchWithRetry, delay } from '@/lib/fetch-utils';
import styles from './Blog.module.css';

export const revalidate = 300;

export const metadata: Metadata = {
    title: 'The Fragrance Blog | Jersey Perfume',
    description: 'Read the latest trends, guides, and stories about luxury fragrances.',
};

async function getPosts() {
    try {
        const res = await fetchWithRetry(`${API_BASE_URL}/wp/v2/posts?_embed`, { next: { revalidate: 3600 } }, 3, 1000, 'Blog');
        if (!res.ok) {
            console.warn('[Blog] Failed to fetch posts:', res.status);
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error('[Blog Error]', error);
        return [];
    }
}

export default async function BlogPage() {
    const posts = await getPosts();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>The Fragrance Blog</h1>
                <p className={styles.subtitle}>Discover scent stories, expert advice, and the latest arrivals.</p>
            </div>

            <div className={styles.blogGrid}>
                {posts.length > 0 ? (
                    posts.map((post: any) => {
                        // Extract embedded featured image if exists
                        const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
                        const imgUrl = featuredMedia?.source_url || '/images/hero.png';

                        return (
                            <Link href={`/blog/${post.slug}`} key={post.id} className={styles.postCard}>
                                <div className={styles.imageContainer}>
                                    <Image
                                        src={imgUrl}
                                        alt={post.title.rendered}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <div className={styles.postContent}>
                                    <div className={styles.postMeta}>
                                        <span className={styles.date}>{new Date(post.date).toLocaleDateString()}</span>
                                    </div>
                                    <h2
                                        className={styles.postTitle}
                                        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                                    />
                                    <div
                                        className={styles.postExcerpt}
                                        dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                                    />
                                    <span className={styles.readMore}>Read Article</span>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <p>No posts found. Please check back later!</p>
                )}
            </div>
        </div>
    );
}
