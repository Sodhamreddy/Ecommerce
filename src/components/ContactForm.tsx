"use client";

import React, { useState } from 'react';
import styles from './ContactForm.module.css';
import { API_BASE_URL } from '@/lib/config';

export default function ContactForm() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [responseMsg, setResponseMsg] = useState('');
    const [formData, setFormData] = useState({
        "your-name": '',
        "your-email": '',
        "your-subject": '',
        "your-message": ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const body = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                body.append(key, value);
            });

            // Using standard CF7 REST API endpoint
            // Jersey Perfume Form ID is 54
            const res = await fetch(`${API_BASE_URL}/contact-form-7/v1/contact-forms/54/feedback`, {
                method: 'POST',
                body: body,
            });

            const data = await res.json();

            if (data.status === 'mail_sent') {
                setStatus('success');
                setResponseMsg(data.message || 'Thank you for your message. It has been sent.');
                setFormData({ "your-name": '', "your-email": '', "your-subject": '', "your-message": '' });
            } else {
                setStatus('error');
                setResponseMsg(data.message || 'One or more fields have an error. Please check and try again.');
            }
        } catch (err) {
            console.error('Contact form error:', err);
            setStatus('error');
            setResponseMsg('Something went wrong. Please try again later.');
        }
    };

    return (
        <div className="container">
            <div className={styles.infoCards}>
                <div className={styles.infoCard}>
                    <span className={styles.infoIcon}>✉️</span>
                    <h3 className={styles.infoTitle}>Email Us</h3>
                    <p className={styles.infoText}>info@jerseyperfume.com<br/>24/7 Response Rate</p>
                </div>
                <div className={styles.infoCard}>
                    <span className={styles.infoIcon}>📞</span>
                    <h3 className={styles.infoTitle}>Call Support</h3>
                    <p className={styles.infoText}>+1 (732) 361-4489<br/>Mon - Fri, 9am - 6pm EST</p>
                </div>
            </div>

            <div className={styles.contactFormContainer}>
                <h2 className={styles.formTitle}>Get In Touch</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Your Name (required)</label>
                            <input
                                type="text"
                                name="your-name"
                                value={formData['your-name']}
                                onChange={handleChange}
                                required
                                className={styles.input}
                                placeholder="Full Name"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Your Email (required)</label>
                            <input
                                type="email"
                                name="your-email"
                                value={formData['your-email']}
                                onChange={handleChange}
                                required
                                className={styles.input}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.label}>Subject</label>
                            <input
                                type="text"
                                name="your-subject"
                                value={formData['your-subject']}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="What is this regarding?"
                            />
                        </div>
                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.label}>Your Message</label>
                            <textarea
                                name="your-message"
                                value={formData['your-message']}
                                onChange={handleChange}
                                required
                                className={styles.textarea}
                                placeholder="Write your message here..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className={styles.submitBtn}
                    >
                        {status === 'loading' ? 'Sending...' : 'Send Message Now'}
                    </button>

                    {status === 'success' && (
                        <div className={`${styles.message} ${styles.success}`}>
                            {responseMsg}
                        </div>
                    )}
                    {status === 'error' && (
                        <div className={`${styles.message} ${styles.error}`}>
                            {responseMsg}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
