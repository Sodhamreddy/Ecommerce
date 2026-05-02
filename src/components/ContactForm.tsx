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
                            <a href="https://www.instagram.com/jerseyperfumeusa/" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                            </a>
                            <a href="https://www.facebook.com/profile.php?id=61576907750503" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Facebook">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                            </a>
                            <a href="https://www.youtube.com/@jerseyperfume" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="YouTube">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
                            </a>
                            <a href="https://x.com/JerseyPerfume" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Twitter / X">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </a>
                            <a href="https://www.pinterest.com/jerseyperfumeofficial/" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Pinterest">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.641 1.267 1.408 0 .858-.548 2.143-.83 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.566 0-2.386-1.716-4.054-4.165-4.054-2.837 0-4.502 2.128-4.502 4.328 0 .857.33 1.775.741 2.276a.3.3 0 0 1 .069.285c-.076.312-.244.995-.277 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
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
