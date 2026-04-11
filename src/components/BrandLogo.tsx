import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BrandLogoProps {
    brand: string;
}

const BRAND_LINKS: Record<string, string> = {
    'DUMONT PARIS': '/product-category/dumont',
    'LATTAFA': '/product-category/lattafa',
    'RASASI': '/product-category/rasasi',
    'AHMED AL MAGHRIBI': '/product-category/ahmed-al-maghribi',
    'GIORGIO ARMANI': '/shop?search=armani',
    'BURBERRY': '/shop?search=burberry',
    'PACO RABANNE': '/shop?search=paco+rabanne',
    'GIVENCHY': '/shop?search=givenchy',
    'JIMMY CHOO': '/shop?search=jimmy+choo',
    'BVLGARI': '/shop?search=bvlgari',
    'VERSACE': '/shop?search=versace',
    'DIOR': '/shop?search=dior',
    'CHANEL': '/shop?search=chanel',
    'CREED': '/shop?search=creed',
    'TOM FORD': '/shop?search=tom+ford',
    'ARMAF': '/shop?search=armaf',
    'MAISON ALHAMBRA': '/shop?search=maison+alhambra',
    'AL HARAMAIN': '/shop?search=al+haramain',
};

const BRAND_LOGOS: Record<string, string> = {
    'BVLGARI': 'https://perfumebox.com/cdn/shop/files/Bvlgari_1.webp?v=1729066736',
    'VERSACE': 'https://perfumebox.com/cdn/shop/files/versace-logo_1b327f70-835e-4f41-b3bf-d0abf8abc9c9.jpg?v=1729066736',
    'GIORGIO ARMANI': 'https://perfumebox.com/cdn/shop/files/Giorgio-Armani-logo.webp?v=1729066736',
    'BURBERRY': 'https://perfumebox.com/cdn/shop/files/Burberry_1.webp?v=1729066737',
    'PACO RABANNE': 'https://perfumebox.com/cdn/shop/files/Paco-Rabanne-logo.webp?v=1729066736',
    'GIVENCHY': 'https://perfumebox.com/cdn/shop/files/Givenchy-logo.webp?v=1729066736',
    'JIMMY CHOO': 'https://perfumebox.com/cdn/shop/files/jimmi-choo.webp?v=1729066736',
    'DUMONT PARIS': 'https://perfumebox.com/cdn/shop/files/dumont_logo.png?v=1729252435',
    'LATTAFA': 'https://perfumebox.com/cdn/shop/files/lattafa_logo.png?v=1729252435',
    'RASASI': 'https://perfumebox.com/cdn/shop/files/rasasi_logo.png?v=1729252434',
    'CHANEL': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Chanel_logo_interlocking_cs.svg/512px-Chanel_logo_interlocking_cs.svg.png' // Only kept one that works well, use text for rest
};

export default function BrandLogo({ brand }: BrandLogoProps) {
    const getStyle = (name: string): React.CSSProperties => {
        switch (name.toUpperCase()) {
            case 'GIORGIO ARMANI':
                return { fontFamily: 'Didot, serif', fontWeight: 'bold', letterSpacing: '2px' };
            case 'BURBERRY':
                return { fontFamily: 'Bodoni MT, serif', fontWeight: 'bold', letterSpacing: '1px' };
            case 'PACO RABANNE':
                return { fontFamily: 'Arial, sans-serif', fontWeight: '900', letterSpacing: '1px' };
            case 'GIVENCHY':
                return { fontFamily: 'Century Gothic, sans-serif', fontWeight: 'bold', letterSpacing: '3px' };
            case 'JIMMY CHOO':
                return { fontFamily: 'Times New Roman, serif', fontStyle: 'italic', fontWeight: 'bold' };
            case 'DUMONT PARIS':
                return { fontFamily: 'Playfair Display, serif', fontWeight: 'bold', border: '2px solid black', padding: '5px 10px' };
            case 'LATTAFA':
                return { fontFamily: 'Courier New, monospace', fontWeight: 'bold', letterSpacing: '-1px' };
            case 'DIOR':
                return { fontFamily: 'Didot, serif', fontWeight: 'bold', letterSpacing: '1px' };
            case 'CREED':
                return { fontFamily: 'Georgia, serif', fontWeight: 'bold', letterSpacing: '4px' };
            case 'TOM FORD':
                return { fontFamily: 'Arial, sans-serif', fontWeight: '800', letterSpacing: '2px' };
            case 'ARMAF':
                return { fontFamily: 'Impact, sans-serif', fontWeight: 'normal', letterSpacing: '1px' };
            case 'MAISON ALHAMBRA':
                return { fontFamily: 'Times New Roman, serif', fontWeight: 'bold', letterSpacing: '1px' };
            case 'AL HARAMAIN':
                return { fontFamily: 'Courier New, monospace', fontWeight: 'bold' };
            default:
                return { fontFamily: 'sans-serif', fontWeight: 'bold' };
        }
    };

    const href = BRAND_LINKS[brand.toUpperCase()] || `/shop?search=${encodeURIComponent(brand.toLowerCase())}`;
    const logoSrc = BRAND_LOGOS[brand.toUpperCase()];

    return (
        <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '80px',
                width: '160px',
                background: 'white',
                border: '1px solid #eee',
                margin: '0 10px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}>
                {logoSrc ? (
                    <img src={logoSrc} alt={brand} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                ) : (
                    <span style={{ fontSize: '1rem', textAlign: 'center', padding: '0 10px', ...getStyle(brand) }}>
                        {brand}
                    </span>
                )}
            </div>
        </Link>
    );
}
