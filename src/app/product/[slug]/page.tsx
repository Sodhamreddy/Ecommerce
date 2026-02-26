import { fetchProductBySlug, fetchAllProducts, fetchProductsByIDs, fetchProducts as apiFetchProducts } from '@/lib/api';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ProductTabs from '@/components/ProductTabs';
import AddToCartButton from '@/components/AddToCartButton';
import VariationSelector from '@/components/VariationSelector';
import ImageZoom from '@/components/ImageZoom';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import styles from './ProductPage.module.css';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const products = await fetchAllProducts();
    return products.map((product) => ({
        slug: product.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await fetchProductBySlug(slug);

    if (!product) {
        return {
            title: 'Product Not Found',
        };
    }

    return {
        title: `${product.name} | Jersey Perfume`,
        description: product.short_description || product.description.replace(/<[^>]*>/g, '').substring(0, 160),
        openGraph: {
            title: product.name,
            description: product.short_description,
            images: product.images.map(img => img.src),
        },
    };
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;
    console.log('Fetching product with slug:', slug);
    const product = await fetchProductBySlug(slug);
    console.log('Fetched product:', product ? product.name : 'NOT FOUND');

    if (!product) {
        console.log('Product not found, calling notFound()');
        notFound();
    }

    let relatedProducts = product.related_products && product.related_products.length > 0
        ? await fetchProductsByIDs(product.related_products.slice(0, 4))
        : [];

    // Fallback: If no explicit related products, fetch from the same category
    if (relatedProducts.length === 0 && product.categories && product.categories.length > 0) {
        const catId = product.categories[0].id;
        const { products } = await apiFetchProducts(1, 5, '', catId.toString());
        relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);
    }

    // Ultimate Fallback: Just get recent products
    if (relatedProducts.length === 0) {
        const { products } = await apiFetchProducts(1, 5);
        relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);
    }

    const minorUnit = product.prices.currency_minor_unit ?? 2;
    const price = (parseInt(product.prices.price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const regularPrice = (parseInt(product.prices.regular_price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const salePrice = (parseInt(product.prices.sale_price || product.prices.price) / Math.pow(10, minorUnit)).toFixed(minorUnit);
    const currencySymbol = product.prices.currency_symbol || '$';

    // Calculate discount percentage if on sale
    const discountPercent = product.on_sale && regularPrice !== "0.00"
        ? Math.round(((parseFloat(regularPrice) - parseFloat(salePrice)) / parseFloat(regularPrice)) * 100)
        : 0;

    const attributes = product.attributes.map(attr => ({
        name: attr.name,
        value: attr.terms.map(t => t.name).join(', ')
    }));

    return (
        <div className={styles.container}>
            <div className={styles.productLayout}>
                <div className={styles.imageSection}>
                    <div className={styles.mainImageContainer}>
                        <ImageZoom
                            src={product.images[0]?.src || '/placeholder.jpg'}
                            alt={product.images[0]?.alt || product.name}
                        />
                    </div>
                    <div className={styles.thumbnailGrid}>
                        {product.images.slice(1).map((img, index) => (
                            <div key={img.id || index} className={styles.thumbnailContainer}>
                                <Image
                                    src={img.src}
                                    alt={img.alt || product.name}
                                    width={150}
                                    height={150}
                                    className={styles.thumbnail}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.infoSection}>
                    <nav className={styles.breadcrumb}>
                        <a href="/">Home</a> / <a href="/shop">Shop</a> / {product.categories[0]?.name}
                    </nav>

                    <h1 className={styles.productName}>{product.name}</h1>

                    <div className={styles.priceContainer}>
                        {product.on_sale ? (
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
                            <span className={styles.inStock}>● In Stock and ready to ship</span>
                        ) : (
                            <span className={styles.outOfStock}>● Out of Stock</span>
                        )}
                    </div>

                    <div
                        className={styles.shortDescription}
                        dangerouslySetInnerHTML={{ __html: product.short_description }}
                    />

                    <div className={styles.divider}></div>

                    <VariationSelector attributes={product.attributes} />

                    <AddToCartButton
                        disabled={!product.is_in_stock}
                        product={product}
                    />

                    <div className={styles.shippingInfoBlock}>
                        <div className={styles.shippingItem}>
                            <Truck size={20} className={styles.shippingIcon} />
                            <span><strong>Free Delivery</strong><br />Usually ships within 2-3 business days.</span>
                        </div>
                        <div className={styles.shippingItem}>
                            <RotateCcw size={20} className={styles.shippingIcon} />
                            <span><strong>14 Days Return Policy</strong><br />No questions asked.</span>
                        </div>
                        <div className={styles.shippingItem}>
                            <ShieldCheck size={20} className={styles.shippingIcon} />
                            <span><strong>Secure Payment</strong><br />Safe and secure checkout.</span>
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
    );
}
