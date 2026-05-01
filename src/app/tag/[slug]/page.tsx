import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchWPPosts, fetchWPTags } from '@/lib/woocommerce';
import styles from '@/app/blog/Blog.module.css';

interface Props {
    params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
    try {
        const tags = await fetchWPTags();
        return tags.map((t: { slug: string }) => ({ slug: t.slug }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const name = slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    return {
        title: `${name} | Jersey Perfume Blog`,
        description: `Browse all fragrance articles tagged "${name}" on the Jersey Perfume blog.`,
        alternates: { canonical: `https://jerseyperfume.com/tag/${slug}/` },
        openGraph: {
            title: `${name} | Jersey Perfume Blog`,
            description: `Browse all fragrance articles tagged "${name}".`,
            url: `https://jerseyperfume.com/tag/${slug}/`,
        },
    };
}

export default async function TagPage({ params }: Props) {
    const { slug } = await params;

    const tags = await fetchWPTags();
    const tag = tags.find((t: { slug: string }) => t.slug === slug);

    if (!tag) notFound();

    const { posts } = await fetchWPPosts(1, 20, undefined, tag.id);
    const tagName = tag.name || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{tagName}</h1>
                <p className={styles.subtitle}>
                    Fragrance articles and guides tagged &ldquo;{tagName}&rdquo;
                </p>
            </div>

            <div className={styles.blogGrid}>
                {posts.length > 0 ? (
                    posts.map((post: any) => {
                        const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
                        const imgUrl = featuredMedia?.source_url || '/images/hero.png';
                        return (
                            <Link href={`/blog/${post.slug}`} key={post.id} className={styles.postCard}>
                                <div className={styles.imageContainer}>
                                    <Image
                                        src={imgUrl}
                                        alt={post.title.rendered.replace(/<[^>]*>/g, '')}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <div className={styles.postContent}>
                                    <div className={styles.postMeta}>
                                        <span className={styles.date}>
                                            {new Date(post.date).toLocaleDateString()}
                                        </span>
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
                    <p>No articles found for this tag.</p>
                )}
            </div>
        </div>
    );
}
