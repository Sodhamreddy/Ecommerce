import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
    brand: string;
}

const BRAND_LINKS: Record<string, string> = {
    'DUMONT PARIS': '/shop?category=dumont',
    'LATTAFA': '/shop?category=lattafa',
    'RASASI': '/shop?category=rasasi',
    'AHMED AL MAGHRIBI': '/shop?category=ahmed-al-maghribi',
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
            default:
                return { fontFamily: 'sans-serif', fontWeight: 'bold' };
        }
    };

    const href = BRAND_LINKS[brand.toUpperCase()] || `/shop?search=${encodeURIComponent(brand.toLowerCase())}`;

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
                <span style={{ fontSize: '1.2rem', textAlign: 'center', ...getStyle(brand) }}>
                    {brand}
                </span>
            </div>
        </Link>
    );
}
