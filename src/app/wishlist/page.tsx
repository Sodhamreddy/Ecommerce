import React from 'react';

export const metadata = {
    title: 'Wishlist | Jersey Perfume',
    description: 'Your saved luxury fragrances.',
};

export default function WishlistPage() {
    return (
        <div className="container" style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Your Wishlist</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>You haven't added any items to your wishlist yet.</p>
            <a href="/shop" style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '10px 20px', textDecoration: 'none', borderRadius: '4px' }}>
                Continue Shopping
            </a>
        </div>
    );
}
