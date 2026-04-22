import { fetchWPPostBySlug, fetchAllWPPosts, fetchWPCategories, fetchWPPosts } from '@/lib/woocommerce';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './BlogPost.module.css';

interface Props {
    params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
    try {
        const posts = await fetchAllWPPosts();
        return posts.map((post) => ({ slug: post.slug }));
    } catch (error) {
        console.error("Error generating static params for blog:", error);
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await fetchWPPostBySlug(slug);

    if (!post) return { title: 'Post Not Found' };

    const yoast = post.yoast_head_json;
    const title = yoast?.title || `${post.title.rendered.replace(/<[^>]+>/g, '')} | Jersey Perfume Blog`;
    const description = yoast?.description || post.excerpt.rendered.replace(/<[^>]+>/g, '').substring(0, 160);
    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const ogImages = yoast?.og_image?.map(img => img.url) || (featuredImage ? [featuredImage] : []);

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

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;

    const [post, categories, { posts: recentPosts }] = await Promise.all([
        fetchWPPostBySlug(slug),
        fetchWPCategories(),
        fetchWPPosts(1, 5),
    ]);

    if (!post) notFound();

    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
    const imgUrl = featuredMedia?.source_url;

    // Filter out "Uncategorized" and empty categories
    const visibleCategories = categories.filter(
        (c: any) => c.count > 0 && c.slug !== 'uncategorized'
    );

    return (
        <div className={styles.pageWrapper}>
            {/* ─── Main Article ─── */}
            <article className={styles.articleContainer}>
                <header className={styles.header}>
                    <div className={styles.meta}>
                        {new Date(post.date).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric',
                        })}
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
                            alt={featuredMedia?.alt_text || 'Featured image'}
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

            {/* ─── Sidebar ─── */}
            <aside className={styles.sidebar}>
                {/* Categories */}
                {visibleCategories.length > 0 && (
                    <div className={styles.sidebarWidget}>
                        <h3 className={styles.widgetTitle}>Categories</h3>
                        <ul className={styles.categoryList}>
                            {visibleCategories.map((cat: any) => (
                                <li key={cat.id} className={styles.categoryItem}>
                                    <Link
                                        href={`/blog?category=${cat.id}`}
                                        className={styles.categoryLink}
                                    >
                                        <span>{cat.name}</span>
                                        <span className={styles.categoryCount}>{cat.count}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recent Posts */}
                {recentPosts.length > 0 && (
                    <div className={styles.sidebarWidget}>
                        <h3 className={styles.widgetTitle}>Recent Posts</h3>
                        <ul className={styles.recentPostList}>
                            {recentPosts
                                .filter((p: any) => p.slug !== slug)
                                .slice(0, 4)
                                .map((p: any) => {
                                    const thumb = p._embedded?.['wp:featuredmedia']?.[0]?.source_url;
                                    return (
                                        <li key={p.id} className={styles.recentPostItem}>
                                            <Link href={`/blog/${p.slug}`}>
                                                {thumb && (
                                                    <div className={styles.recentPostThumb}>
                                                        <Image
                                                            src={thumb}
                                                            alt={p.title.rendered.replace(/<[^>]+>/g, '')}
                                                            fill
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                )}
                                                <div className={styles.recentPostInfo}>
                                                    <span
                                                        className={styles.recentPostTitle}
                                                        dangerouslySetInnerHTML={{ __html: p.title.rendered }}
                                                    />
                                                    <span className={styles.recentPostDate}>
                                                        {new Date(p.date).toLocaleDateString('en-GB', {
                                                            day: 'numeric', month: 'short', year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                        </ul>
                    </div>
                )}
            </aside>
        </div>
    );
}
