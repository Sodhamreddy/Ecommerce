import React from 'react';
import AccountContent from './AccountContent';

export const metadata = {
    title: 'My Account | Jersey Perfume',
    description: 'Manage your profile and orders.',
};

export default function AccountPage() {
    return (
        <div style={{ minHeight: '70vh' }}>
            <AccountContent />
        </div>
    );
}
