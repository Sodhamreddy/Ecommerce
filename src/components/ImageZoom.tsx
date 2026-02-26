"use client";

import React, { useState, MouseEvent, useRef } from 'react';
import Image from 'next/image';
import styles from './ImageZoom.module.css';

interface ImageZoomProps {
    src: string;
    alt: string;
}

export default function ImageZoom({ src, alt }: ImageZoomProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [showZoom, setShowZoom] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;
        const { left, top, width, height } = imageRef.current.getBoundingClientRect();

        // Calculate position percentage
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;

        // Bound the percentages (no panning completely off image)
        setPosition({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y))
        });
    };

    return (
        <div
            className={styles.zoomContainer}
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
            onMouseMove={handleMouseMove}
        >
            <Image
                ref={imageRef}
                src={src}
                alt={alt}
                width={800}
                height={800}
                className={styles.mainImage}
                priority
            />
            {showZoom && (
                <div
                    className={styles.zoomLens}
                    style={{
                        backgroundImage: `url(${src})`,
                        backgroundPosition: `${position.x}% ${position.y}%`
                    }}
                />
            )}
        </div>
    );
}
