import React from 'react';

interface BrandLogoProps {
    brand: string;
}

export default function BrandLogo({ brand }: BrandLogoProps) {
    // varied styles to mimic different brand identities
    const getStyle = (name: string) => {
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

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80px',
            width: '160px',
            background: 'white',
            border: '1px solid #eee',
            margin: '0 10px'
        }}>
            <span style={{ fontSize: '1.2rem', textAlign: 'center', ...getStyle(brand) }}>
                {brand}
            </span>
        </div>
    );
}
