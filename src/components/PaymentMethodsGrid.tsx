import styles from './PaymentMethodsGrid.module.css';

export default function PaymentMethodsGrid() {
    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <h3 className={styles.title}>PAYMENT METHODS</h3>
                
                <div className={styles.methodsRow}>
                    {/* VISA */}
                    <div className={`${styles.badge} ${styles.visa}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <text x="50%" y="58%" fill="white" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="13" textAnchor="middle" alignmentBaseline="middle">VISA</text>
                            {/* Visa signature wing */}
                            <path d="M12 9 L15 9 L13 15 L10 15 Z" fill="#F7B600" opacity="0" />
                        </svg>
                    </div>

                    {/* MASTERCARD */}
                    <div className={`${styles.badge} ${styles.mastercard}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <circle cx="18" cy="12" r="7" fill="#EB001B"/>
                            <circle cx="30" cy="12" r="7" fill="#F79E1B"/>
                            <path d="M24 12c.5-1.5.5-3.2 0-4.8a7 7 0 0 0 0 9.6z" fill="#FF5F00"/>
                        </svg>
                    </div>

                    {/* AMEX */}
                    <div className={`${styles.badge} ${styles.amex}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <text x="50%" y="58%" fill="white" fontFamily="Arial Black, Arial, sans-serif" fontWeight="bold" fontSize="10" textAnchor="middle" alignmentBaseline="middle" letterSpacing="-0.5px">AMEX</text>
                        </svg>
                    </div>

                    {/* DISCOVER */}
                    <div className={`${styles.badge} ${styles.discover}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <text x="50%" y="58%" fill="black" fontFamily="Arial Black, Arial, sans-serif" fontWeight="bold" fontSize="6.5" textAnchor="middle" alignmentBaseline="middle" letterSpacing="0">DISCOVER</text>
                            <circle cx="37.5" cy="11.5" r="3.5" fill="#E55C20"/>
                        </svg>
                    </div>

                    {/* JCB */}
                    <div className={`${styles.badge} ${styles.jcb}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <rect x="10" y="6" width="28" height="12" rx="2" fill="white" />
                            <text x="50%" y="58%" fill="#1A1F71" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="8" textAnchor="middle" alignmentBaseline="middle">JCB</text>
                            <path d="M11 6h8v12h-8z" fill="#0035A0" opacity="0.1"/>
                            <path d="M20 6h8v12h-8z" fill="#E01155" opacity="0.1"/>
                            <path d="M29 6h8v12h-8z" fill="#008000" opacity="0.1"/>
                        </svg>
                    </div>

                    {/* DINERS CLUB */}
                    <div className={`${styles.badge} ${styles.diners}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <circle cx="24" cy="9" r="4.5" fill="none" stroke="#004C97" strokeWidth="1.2"/>
                            <circle cx="24" cy="9" r="2" fill="none" stroke="#004C97" strokeWidth="0.8"/>
                            <text x="50%" y="75%" fill="#004C97" fontFamily="Times New Roman, serif" fontSize="5" textAnchor="middle">Diners Club</text>
                            <text x="50%" y="85%" fill="#004C97" fontFamily="Times New Roman, serif" fontSize="3" textAnchor="middle">INTERNATIONAL</text>
                        </svg>
                    </div>
                </div>

                <div className={styles.methodsRow}>
                    {/* PAYPAL */}
                    <div className={`${styles.badge} ${styles.paypal}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <text x="50%" y="58%" fill="#003087" fontFamily="Arial, sans-serif" fontWeight="bold" fontStyle="italic" fontSize="10" textAnchor="middle" alignmentBaseline="middle" letterSpacing="-0.5px">PayPal</text>
                        </svg>
                    </div>

                    {/* AMAZON PAY */}
                    <div className={`${styles.badge} ${styles.amazon}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <text x="50%" y="55%" fill="black" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="7" textAnchor="middle" alignmentBaseline="middle">amazon pay</text>
                            <path d="M18 16 Q24 19 30 16" fill="none" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </div>

                    {/* APPLE PAY */}
                    <div className={`${styles.badge} ${styles.apple}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <path d="M18 12.5 C18 10 19.5 9 19.5 9 C18.5 7.5 16.5 7 15.5 7 C14 6.8 12.5 7.8 11.8 7.8 C11 7.8 9.5 6.8 8.2 6.8 C6.5 6.8 5 7.8 4 9.2 C2 12.8 3.5 18 5.5 21 C6.5 22.5 7.5 24 9.2 24 C11 24 11.5 23 13.5 23 C15.5 23 16 24 18 24 C19.8 24 21 22.5 22 21 C23.2 19.2 23.5 17.5 23.5 17.5 C23.5 17.2 18 15.2 18 12.5 M15 6.5 C16 5.2 16.8 3.5 16.5 1.5 C15 1.8 13 2.8 12 4 C11 5 10.2 6.8 10.5 8.5 C12.2 8.8 14 7.8 15 6.5" fill="black" transform="scale(0.4) translate(25, 10)"/>
                            <text x="65%" y="60%" fill="black" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="10" textAnchor="middle" alignmentBaseline="middle">Pay</text>
                        </svg>
                    </div>

                    {/* GOOGLE PAY */}
                    <div className={`${styles.badge} ${styles.gpay}`}>
                        <svg viewBox="0 0 48 24" className={styles.svgFill}>
                            <text x="35%" y="60%" fill="#5F6368" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="10" textAnchor="middle" alignmentBaseline="middle">G</text>
                            <text x="65%" y="60%" fill="#5F6368" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="10" textAnchor="middle" alignmentBaseline="middle">Pay</text>
                            <path d="M15 12 h4 M15 8 a4 4 0 0 0 0 8 M19 12 a4 4 0 0 0 0 -4" stroke="none" fill="none" />
                            {/* Colorful G Approximation */}
                            <circle cx="16.5" cy="12" r="3.5" fill="none" stroke="#4285F4" strokeWidth="1.5" strokeDasharray="18 4" transform="rotate(-45 16.5 12)"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
