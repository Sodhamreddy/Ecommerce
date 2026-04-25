"use client";

import React, { useState } from 'react';
import styles from './ContactForm.module.css';
import { submitContactFormAction } from '@/app/actions';

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
            const data = await submitContactFormAction(formData);
            if (data.status === 'mail_sent') {
                setStatus('success');
                setResponseMsg(data.message || 'Thank you! Your message has been sent.');
                setFormData({ "your-name": '', "your-email": '', "your-subject": '', "your-message": '' });
            } else {
                setStatus('error');
                setResponseMsg(data.message || 'Something went wrong. Please try again.');
            }
        } catch {
            setStatus('error');
            setResponseMsg('Something went wrong. Please try again later.');
        }
    };

    return (
        <div className={styles.pageWrapper}>
            {/* Hero */}
            <div className={styles.hero}>
                <h1 className={styles.heroTitle}>Get In Touch</h1>
                <p className={styles.heroSubtitle}>We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>
            </div>

            <div className="container">
                <div className={styles.splitLayout}>
                    {/* Left: Info Panel */}
                    <div className={styles.infoPanel}>
                        <div className={styles.infoBlock}>
                            <div className={styles.infoIconWrap}>
                                <span className={styles.infoIcon}>✉</span>
                            </div>
                            <div>
                                <h3 className={styles.infoTitle}>Email Us</h3>
                                <p className={styles.infoValue}>
                                    <a href="mailto:info@jerseyperfume.com" className={styles.infoLink}>
                                        info@jerseyperfume.com
                                    </a>
                                </p>
                                <p className={styles.infoNote}>24/7 Response Rate</p>
                            </div>
                        </div>

                        <div className={styles.infoDivider} />

                        <div className={styles.infoBlock}>
                            <div className={styles.infoIconWrap}>
                                <span className={styles.infoIcon}>📞</span>
                            </div>
                            <div>
                                <h3 className={styles.infoTitle}>Call Support</h3>
                                <p className={styles.infoValue}>
                                    <a href="tel:+17323614489" className={styles.infoLink}>
                                        +1 (732) 361-4489
                                    </a>
                                </p>
                                <p className={styles.infoNote}>Mon – Fri, 9am – 6pm EST</p>
                            </div>
                        </div>

                        <div className={styles.infoDivider} />

                        <div className={styles.infoBlock}>
                            <div className={styles.infoIconWrap}>
                                <span className={styles.infoIcon}>🕒</span>
                            </div>
                            <div>
                                <h3 className={styles.infoTitle}>Business Hours</h3>
                                <p className={styles.infoValue}>Mon – Fri: 9am – 6pm EST</p>
                                <p className={styles.infoNote}>Weekends: Email only</p>
                            </div>
                        </div>

                        <div className={styles.infoDivider} />

                        <div className={styles.socialRow}>
                            <a href="https://www.instagram.com/jerseyperfume" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                            </a>
                            <a href="https://www.facebook.com/jerseyperfume" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Facebook">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                            </a>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className={styles.formPanel}>
                        <h2 className={styles.formTitle}>Send Us a Message</h2>

                        {status === 'success' ? (
                            <div className={styles.successState}>
                                <div className={styles.successIcon}>✓</div>
                                <h3 className={styles.successTitle}>Message Sent!</h3>
                                <p className={styles.successText}>{responseMsg}</p>
                                <button className={styles.resetBtn} onClick={() => setStatus('idle')}>
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Your Name *</label>
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
                                        <label className={styles.label}>Email Address *</label>
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
                                </div>

                                <div className={styles.formGroup}>
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

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Your Message *</label>
                                    <textarea
                                        name="your-message"
                                        value={formData['your-message']}
                                        onChange={handleChange}
                                        required
                                        className={styles.textarea}
                                        placeholder="Write your message here..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className={styles.submitBtn}
                                >
                                    {status === 'loading' ? (
                                        <span className={styles.loadingDots}>Sending<span>.</span><span>.</span><span>.</span></span>
                                    ) : 'Send Message'}
                                </button>

                                {status === 'error' && (
                                    <div className={styles.errorMsg}>
                                        ⚠ {responseMsg}
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
