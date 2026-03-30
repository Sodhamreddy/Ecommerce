"use client";

import { useState, useEffect } from 'react';
import { fetchReviewsAction } from '@/app/actions';
import { Facebook, Instagram, MessageSquare, ExternalLink } from 'lucide-react';
import styles from './ProductTabs.module.css';

interface Review {
    reviewer: string;
    review: string;
    rating: number;
    date_created: string;
}

interface ProductTabsProps {
    productId: number;
    description: string;
    attributes: { name: string; value: string }[];
}

export default function ProductTabs({ productId, description, attributes }: ProductTabsProps) {
    const [activeTab, setActiveTab] = useState('description');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    // Transform text links to icons
    const renderDescription = (html: string) => {
        if (!html) return '';
        
        let processed = html;
        
        // Remove those specific follow links from the text and we'll append icons instead
        const followRegex = /<p[^>]*><a[^>]*>(?:follow Us On|follow us on|Contact Us)[^<]*<\/a><\/p>/gi;
        const hasFollowLinks = followRegex.test(html);
        processed = processed.replace(followRegex, '');

        return (
            <>
                <div dangerouslySetInnerHTML={{ __html: processed }} />
                {hasFollowLinks && (
                    <div className={styles.socialFollowRow}>
                        <span className={styles.followLabel}>Connect with us:</span>
                        <div className={styles.followIcons}>
                            <a href="https://www.facebook.com/profile.php?id=61576907750503" target="_blank" className={styles.socialLink} title="Facebook"><Facebook size={18} /></a>
                            <a href="https://www.instagram.com/jerseyperfumeusa/" target="_blank" className={styles.socialLink} title="Instagram"><Instagram size={18} /></a>
                            <a href="/info/contact-us" className={styles.socialLink} title="Contact Us"><MessageSquare size={18} /></a>
                        </div>
                    </div>
                )}
            </>
        );
    };

    useEffect(() => {
        if (activeTab === 'reviews' && reviews.length === 0) {
            const fetchReviews = async () => {
                setLoadingReviews(true);
                try {
                    const data = await fetchReviewsAction(productId);
                    if (data && Array.isArray(data)) {
                        setReviews(data);
                    }
                } catch (error) {
                    console.error("Failed to fetch reviews:", error);
                } finally {
                    setLoadingReviews(false);
                }
            };
            fetchReviews();
        }
    }, [activeTab, productId, reviews.length]);

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabList}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'description' ? styles.active : ''}`}
                    onClick={() => setActiveTab('description')}
                >
                    Description
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'specifications' ? styles.active : ''}`}
                    onClick={() => setActiveTab('specifications')}
                >
                    Specifications
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'reviews' ? styles.active : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    Reviews
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'description' && (
                    <div className={styles.description}>
                        {renderDescription(description)}
                    </div>
                )}

                {activeTab === 'specifications' && (
                    <div className={styles.specifications}>
                        {attributes.length > 0 ? (
                            <table className={styles.specTable}>
                                <tbody>
                                    {attributes.map((attr, index) => (
                                        <tr key={index}>
                                            <th>{attr.name}</th>
                                            <td>{attr.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No specifications available for this product.</p>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className={styles.reviews}>
                        {loadingReviews ? (
                            <p>Loading reviews...</p>
                        ) : reviews.length > 0 ? (
                            <div className={styles.reviewList}>
                                {reviews.map((rev, index) => (
                                    <div key={index} className={styles.reviewItem}>
                                        <div className={styles.reviewHeader}>
                                            <span className={styles.reviewer}>{rev.reviewer}</span>
                                            <span className={styles.rating}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                                        </div>
                                        <div
                                            className={styles.reviewBody}
                                            dangerouslySetInnerHTML={{ __html: rev.review }}
                                        />
                                        <span className={styles.reviewDate}>{new Date(rev.date_created).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No reviews yet. Be the first to review!</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
