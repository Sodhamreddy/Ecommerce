import { fetchWPPostBySlug, fetchAllWPPosts } from '@/lib/woocommerce';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './BlogPost.module.css';

interface Props {
    params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
    try {
        const posts = await fetchAllWPPosts();
        return posts.map((post) => ({
            slug: post.slug,
        }));
    } catch (error) {
        console.error("Error generating static params for blog:", error);
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
        const post = await fetchWPPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: `${post.title.rendered.replace(/<[^>]+>/g, '')} | Jersey Perfume Blog`,
        description: post.excerpt.rendered.replace(/<[^>]+>/g, '').substring(0, 160),
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
        const post = await fetchWPPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
    const imgUrl = featuredMedia?.source_url;

    return (
        <article className={styles.articleContainer}>
            <header className={styles.header}>
                <div className={styles.meta}>
                    <span className={styles.date}>{new Date(post.date).toLocaleDateString()}</span>
                </div>
                <h1
                    className={styles.title}
                    dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                />
            </header>

            {imgUrl && (
                <div className={styles.featuredImage}>
                    <Image
                        src={imgUrl}
                        alt="Featured"
                        fill
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                </div>
            )}

            <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: post.content.rendered }}
            />
        </article>
    );
}
