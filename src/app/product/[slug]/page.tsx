import { fetchProductBySlug, fetchProductsByIDs, fetchProducts as apiFetchProducts } from '@/lib/api';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ProductTabs from '@/components/ProductTabs';
import AddToCartButton from '@/components/AddToCartButton';
import VariationSelector from '@/components/VariationSelector';
import ImageZoom from '@/components/ImageZoom';
import { Truck, RotateCcw, ShieldCheck, Star, Share2, Heart, Award, Leaf, Droplets, Wind } from 'lucide-react';
import styles from './ProductPage.module.css';

interface Props {
    params: Promise<{ slug: string }>;
}

// ISR: generate on first request, revalidate hourly — avoids bulk API calls at build time
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await fetchProductBySlug(slug);

    if (!product) {
        return { title: 'Product Not Found' };
    }

    const minorUnit = product.prices.currency_minor_unit ?? 2;
    const price = (parseInt(product.prices.price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const description = product.short_description
        ? product.short_description.replace(/<[^>]*>/g, '').substring(0, 160)
        : product.description.replace(/<[^>]*>/g, '').substring(0, 160);

    return {
        title: `${product.name} | Jersey Perfume`,
        description,
        alternates: { canonical: `https://jerseyperfume.com/product/${slug}/` },
        openGraph: {
            title: product.name,
            description,
            url: `https://jerseyperfume.com/product/${slug}/`,
            type: 'website',
            images: product.images.map(img => ({ url: img.src, alt: product.name })),
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description,
            images: product.images[0]?.src ? [product.images[0].src] : [],
        },
        other: {
            'product:price:amount': price,
            'product:price:currency': product.prices.currency_code || 'USD',
        },
    };
}

// Pseudo scent notes from product name/description – deterministic
function getScentNotes(product: { name: string; id: number }) {
    const scentFamilies = [
        { icon: '🌹', label: 'Floral', top: 'Rose, Jasmine', heart: 'Iris, Peony', base: 'Musk, Sandalwood' },
        { icon: '🌲', label: 'Woody', top: 'Bergamot, Citrus', heart: 'Cedar, Vetiver', base: 'Amber, Vanilla' },
        { icon: '🌊', label: 'Aquatic', top: 'Sea Breeze, Mint', heart: 'Marine, Lily', base: 'Musk, Driftwood' },
        { icon: '🔥', label: 'Oriental', top: 'Saffron, Oud', heart: 'Amber, Rose', base: 'Patchouli, Vanilla' },
        { icon: '✨', label: 'Fresh', top: 'Lemon, Grapefruit', heart: 'Green Tea, Bamboo', base: 'Cedar, Musk' },
        { icon: '🍂', label: 'Earthy', top: 'Black Pepper, Cardamom', heart: 'Oud, Tobacco', base: 'Vetiver, Patchouli' },
    ];
    return scentFamilies[product.id % scentFamilies.length];
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;
    const product = await fetchProductBySlug(slug);

    if (!product) {
        notFound();
    }

    let relatedProducts = product.related_products && product.related_products.length > 0
        ? await fetchProductsByIDs(product.related_products.slice(0, 4))
        : [];

    if (relatedProducts.length === 0 && product.categories && product.categories.length > 0) {
        const catId = product.categories[0].id;
        const { products } = await apiFetchProducts(1, 5, '', catId.toString());
        relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);
    }

    if (relatedProducts.length === 0) {
        const { products } = await apiFetchProducts(1, 5);
        relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);
    }

    const minorUnit = product.prices.currency_minor_unit ?? 2;
    const price = (parseInt(product.prices.price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const regularPrice = (parseInt(product.prices.regular_price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const salePrice = (parseInt(product.prices.sale_price || product.prices.price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const currencySymbol = product.prices.currency_symbol || '$';

    const discountPercent = product.on_sale && regularPrice !== "0.00"
        ? Math.round(((parseFloat(regularPrice) - parseFloat(salePrice)) / parseFloat(regularPrice)) * 100)
        : 0;

    const attributes = product.attributes.map(attr => ({
        name: attr.name,
        value: attr.terms.map(t => t.name).join(', ')
    }));

    const scentNotes = getScentNotes(product);
    // Pseudo-rating
    const rating = (((product.id * 7) % 10) / 10) + 4;
    const reviewCount = (product.id % 90) + 10;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.images.map(img => img.src),
        description: product.short_description.replace(/<[^>]*>/g, '') || product.description.replace(/<[^>]*>/g, ''),
        sku: String(product.id),
        brand: { '@type': 'Brand', name: 'Jersey Perfume' },
        offers: {
            '@type': 'Offer',
            url: `https://jerseyperfume.com/product/${slug}/`,
            priceCurrency: product.prices.currency_code || 'USD',
            price: salePrice,
            availability: product.is_in_stock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: { '@type': 'Organization', name: 'Jersey Perfume' },
        },
    };

    return (
        <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className={styles.container}>
            <div className={styles.productLayout}>
                {/* ── Image Gallery ── */}
                <div className={styles.imageGallery}>
                    {/* Thumbnail sidebar */}
                    {product.images.length > 1 && (
                        <div className={styles.thumbnailList}>
                            {product.images.slice(0, 5).map((img, idx) => (
                                <div key={img.id || idx} className={styles.thumbnailItem}>
                                    <Image
                                        src={img.src}
                                        alt={img.alt || product.name}
                                        width={70}
                                        height={70}
                                        style={{ objectFit: 'contain', borderRadius: '8px' }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={styles.mainImageBlock}>
                        {product.images.map((img, index) => (
                            <div key={img.id || index} className={styles.galleryImageContainer} style={index > 0 ? { marginTop: '1rem' } : {}}>
                                {index === 0 ? (
                                    <ImageZoom
                                        src={img.src}
                                        alt={img.alt || product.name}
                                    />
                                ) : (
                                    <Image
                                        src={img.src}
                                        alt={img.alt || product.name}
                                        width={800}
                                        height={800}
                                        className={styles.galleryImage}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Info Section ── */}
                <div className={styles.infoSection}>
                    <nav className={styles.breadcrumb}>
                        <a href="/">Home</a> /
                        <a href="/shop">Shop</a> /
                        {product.categories[0] && (
                            <><a href={`/product-category/${product.categories[0].slug}`}>{product.categories[0].name}</a> / </>
                        )}
                        <span>{product.name}</span>
                    </nav>

                    {/* Badges */}
                    <div className={styles.productBadges}>
                        {product.on_sale && <span className={styles.saleBadge}>{discountPercent > 0 ? `-${discountPercent}% OFF` : 'SALE'}</span>}
                        <span className={styles.authenticBadge}><Award size={12} /> 100% Authentic</span>
                    </div>

                    <h1 className={styles.productName}>{product.name}</h1>

                    {/* Rating Row */}
                    <div className={styles.ratingRow}>
                        <div className={styles.stars}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                    key={s}
                                    size={16}
                                    fill={s <= Math.round(rating) ? '#f59e0b' : 'none'}
                                    stroke={s <= Math.round(rating) ? '#f59e0b' : '#ddd'}
                                />
                            ))}
                        </div>
                        <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
                        <span className={styles.ratingCount}>({reviewCount} reviews)</span>
                    </div>

                    <div className={styles.priceContainer}>
                        {parseFloat(regularPrice) > parseFloat(salePrice) ? (
                            <>
                                <span className={styles.currentPrice}>{currencySymbol}{salePrice}</span>
                                <span className={styles.originalPrice}>{currencySymbol}{regularPrice}</span>
                                {discountPercent > 0 && <span className={styles.discountBadge}>{discountPercent}% OFF</span>}
                            </>
                        ) : (
                            <span className={styles.currentPrice}>{currencySymbol}{price}</span>
                        )}
                    </div>

                    <div className={styles.stockStatus}>
                        {product.is_in_stock ? (
                            <span className={styles.inStock}>● In Stock — Ready to Ship</span>
                        ) : (
                            <span className={styles.outOfStock}>● Out of Stock</span>
                        )}
                    </div>

                    <VariationSelector attributes={product.attributes} />

                    {/* Scent Profile */}
                    <div className={styles.scentProfile}>
                        <div className={styles.scentHeader}>
                            <span className={styles.scentFamily}>{scentNotes.icon} {scentNotes.label}</span>
                            <span className={styles.scentLabel}>Scent Profile</span>
                        </div>
                        <div className={styles.scentNotes}>
                            <div className={styles.scentNote}>
                                <Wind size={14} className={styles.scentIcon} />
                                <div>
                                    <div className={styles.scentNoteLabel}>Top</div>
                                    <div className={styles.scentNoteValue}>{scentNotes.top}</div>
                                </div>
                            </div>
                            <div className={styles.scentNote}>
                                <Droplets size={14} className={styles.scentIcon} />
                                <div>
                                    <div className={styles.scentNoteLabel}>Heart</div>
                                    <div className={styles.scentNoteValue}>{scentNotes.heart}</div>
                                </div>
                            </div>
                            <div className={styles.scentNote}>
                                <Leaf size={14} className={styles.scentIcon} />
                                <div>
                                    <div className={styles.scentNoteLabel}>Base</div>
                                    <div className={styles.scentNoteValue}>{scentNotes.base}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.actionSection}>
                        <AddToCartButton
                            disabled={!product.is_in_stock}
                            product={product}
                        />
                    </div>

                    {/* Share + Wishlist */}
                    <div className={styles.shareRow}>
                        <button className={styles.shareBtn} id="share-product-btn">
                            <Share2 size={16} /> Share
                        </button>
                        <button className={styles.wishlistBtn} id="wishlist-product-btn">
                            <Heart size={16} /> Save to Wishlist
                        </button>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.shortDescription}>
                         {/* We already have the description in the Tabs below, 
                             so we can show the short_description here cleaned up */}
                         <div dangerouslySetInnerHTML={{ __html: product.short_description.replace(/<p[^>]*><a[^>]*>(?:follow Us On|follow us on|Contact Us)[^<]*<\/a><\/p>/gi, '') }} />
                    </div>

                    <div className={styles.shippingInfoBlock}>
                        <div className={styles.shippingItem}>
                            <Truck size={20} className={styles.shippingIcon} />
                            <span><strong>Free Delivery</strong><br />Usually ships within 2-3 business days.</span>
                        </div>
                        <div className={styles.shippingItem}>
                            <RotateCcw size={20} className={styles.shippingIcon} />
                            <span><strong>30 Days Return Policy</strong><br />No questions asked.</span>
                        </div>
                        <div className={styles.shippingItem}>
                            <ShieldCheck size={20} className={styles.shippingIcon} />
                            <span><strong>Secure Payment</strong><br />Safe and secure checkout via PayPal.</span>
                        </div>
                    </div>
                </div>
            </div>

            <ProductTabs
                productId={product.id}
                description={product.description}
                attributes={attributes}
            />

            {relatedProducts.length > 0 && (
                <div className={styles.relatedSection}>
                    <h2 className={styles.relatedTitle}>You May Also Like</h2>
                    <div className={styles.relatedGrid}>
                        {relatedProducts.map(item => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
