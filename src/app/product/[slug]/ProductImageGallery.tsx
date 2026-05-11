"use client";

import { useState } from "react";
import Image from "next/image";
import ImageZoom from "@/components/ImageZoom";
import styles from "./ProductPage.module.css";

interface ProductImage {
    id: number;
    src: string;
    alt?: string;
}

interface ProductImageGalleryProps {
    images: ProductImage[];
    productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedImage = images[selectedIndex] || images[0];

    if (!selectedImage) return null;

    return (
        <div className={styles.imageGallery}>
            {images.length > 1 && (
                <div className={styles.thumbnailList}>
                    {images.slice(0, 5).map((img, idx) => (
                        <button
                            key={img.id || idx}
                            type="button"
                            className={`${styles.thumbnailItem} ${idx === selectedIndex ? styles.thumbnailItemActive : ""}`}
                            onClick={() => setSelectedIndex(idx)}
                            aria-label={`Show image ${idx + 1}`}
                        >
                            <Image
                                src={img.src}
                                alt={img.alt || productName}
                                width={70}
                                height={70}
                                style={{ objectFit: "contain", borderRadius: "8px" }}
                            />
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.mainImageBlock}>
                <div className={styles.galleryImageContainer}>
                    <ImageZoom
                        src={selectedImage.src}
                        alt={selectedImage.alt || productName}
                    />
                </div>
            </div>
        </div>
    );
}
