import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './BlogPost.module.css';

interface Props {
    params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
    try {
        const res = await fetch(`https://jerseyperfume.com/wp-json/wp/v2/posts?slug=${slug}&_embed`, {
            next: { revalidate: 3600 }
        });
        const posts = await res.json();
        return posts.length > 0 ? posts[0] : null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);

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
    const post = await getPost(slug);

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
