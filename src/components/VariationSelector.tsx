"use client";

import { useState } from 'react';
import { ProductAttribute } from '@/lib/api';
import styles from './VariationSelector.module.css';

interface VariationSelectorProps {
    attributes: ProductAttribute[];
    onVariationChange?: (selected: Record<string, string>) => void;
}

export default function VariationSelector({ attributes, onVariationChange }: VariationSelectorProps) {
    const [selected, setSelected] = useState<Record<string, string>>({});

    const handleSelect = (attrName: string, termSlug: string) => {
        const newSelected = { ...selected, [attrName]: termSlug };
        setSelected(newSelected);
        onVariationChange?.(newSelected);
    };

    if (!attributes || attributes.length === 0) return null;

    return (
        <div className={styles.container}>
            {attributes.map((attr) => {
                const selectedTermSlug = selected[attr.name];
                const selectedTerm = attr.terms.find(t => t.slug === selectedTermSlug);

                return (
                    <div key={attr.id} className={styles.attributeGroup}>
                        <div className={styles.attributeHeader}>
                            <h4 className={styles.attributeName}>{attr.name}</h4>
                            {selectedTerm && (
                                <span className={styles.selectedValue}>{selectedTerm.name}</span>
                            )}
                        </div>
                        <div className={styles.termGrid}>
                            {attr.terms.map((term) => (
                                <button
                                    key={term.id}
                                    className={`${styles.termBtn} ${selectedTermSlug === term.slug ? styles.active : ''}`}
                                    onClick={() => handleSelect(attr.name, term.slug)}
                                >
                                    {term.name}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
