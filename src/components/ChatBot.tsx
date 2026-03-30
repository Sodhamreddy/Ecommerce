"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import styles from './ChatBot.module.css';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! Welcome to Jersey Perfume. I am your AI fragrance assistant. How can I help you find your perfect scent today?',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulated AI Bot response logic
        // In a real prod environment, you would POST to a /api/chat route connected to OpenAI/Claude
        setTimeout(() => {
            const query = userMsg.text.toLowerCase();
            let botReply = "I can definitely help you with that! At Jersey Perfume, we offer a wide range of luxury fragrances.";

            if (query.includes('shipping') || query.includes('delivery') || query.includes('track')) {
                botReply = "We offer <strong>FREE shipping</strong> on all US orders over $59! We dispatch orders on the same day if placed before 2 PM EST. Delivery typically takes 2-4 business days.";
            } else if (query.includes('return') || query.includes('refund')) {
                botReply = "We have a 14-day return policy. If you're not completely satisfied with your fragrance, you can return it within 14 days of receipt for a full refund (items must be unused/sealed).";
            } else if (query.includes('contact') || query.includes('support')) {
                botReply = "You can reach our customer support team via email at support@jerseyperfume.com or through our <a href='/contact' style='text-decoration:underline'>Contact Us page</a>. We aim to respond to within 24 hours.";
            } else if (query.includes('authentic') || query.includes('fake') || query.includes('original')) {
                botReply = "Absolutely. We 100% guarantee the authenticity of every fragrance we sell. We source directly from authorized distributors and the brands themselves.";
            } else if (query.includes('link') && (query.includes('80') || query.includes('discount') || query.includes('offer') || query.includes('sale'))) {
                botReply = "Here is the direct link to our best-selling deals section! <br/><br/><a href='/shop?category=best-sellers' style='display:inline-block; padding:8px 12px; background:#fff; color:#2874f0; text-decoration:none; border-radius:4px; font-weight:bold; font-size:13px;'>SHOP UP TO 80% OFF SCENTS</a>";
            } else if (query.includes('offer') || query.includes('sale') || query.includes('discount') || query.includes('price') || query.includes('80%') || query.includes('off')) {
                botReply = "Currently, we have our Valentine's Sale with up to <strong>80% off on luxury scents</strong>! Would you like me to send you a <strong>link</strong> to the special collection?";
            } else if (query.includes('best') || query.includes('popular') || query.includes('recommend') || query.includes('top')) {
                botReply = "Our current top best-sellers include Lattafa Khamrah, Afnan Turathi Electric, and Dumont Nitro Red. <br/><a href='/shop?category=best-sellers' style='text-decoration:underline'>Click here to view our Best Sellers!</a>";
            } else if (query.includes('men') || query.includes('cologne') || query.includes('boy')) {
                botReply = "For men, we have an incredible selection including Creed, Dior Sauvage, and popular Arabian scents. <a href='/shop?category=men' style='text-decoration:underline'>Browse Men's Collection here</a>.";
            } else if (query.includes('women') || query.includes('girl')) {
                botReply = "For women, our Floral and Gourmand collections are highly requested! Yara Pink by Lattafa and Burberry Her are excellent choices right now. <a href='/shop?category=women' style='text-decoration:underline'>Browse Women's Collection here</a>.";
            } else if (query.includes('perfume') || query.includes('fragrance') || query.includes('scent')) {
                botReply = "We have hundreds of designer and niche perfumes! Are you looking for men's, women's, or unisex fragrances? Or you can check our <a href='/shop' style='text-decoration:underline'>Master Shop Directory</a>.";
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: botReply,
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <div className={styles.chatContainer}>
            {/* Toggle Button */}
            <button
                className={`${styles.toggleButton} ${isOpen ? styles.hidden : ''}`}
                onClick={() => setIsOpen(true)}
                aria-label="Open chat"
            >
                <div className={styles.iconWrapper}>
                    <MessageSquare size={28} />
                </div>
            </button>

            {/* Chat Window */}
            <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
                <div className={styles.chatHeader}>
                    <div className={styles.headerInfo}>
                        <div className={styles.avatar}>JP</div>
                        <div>
                            <h3>Jersey Assistant</h3>
                            <span className={styles.onlineStatus}>Online</span>
                        </div>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={() => setIsOpen(false)}
                        aria-label="Close chat"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.chatMessages}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper}`}
                        >
                            <div className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.userBubble : styles.botBubble}`}>
                                {msg.sender === 'bot' ? (
                                    <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                                ) : (
                                    msg.text
                                )}
                            </div>
                            <span className={styles.timestamp} suppressHydrationWarning>
                                {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                        </div>
                    ))}

                    {isTyping && (
                        <div className={`${styles.messageWrapper} ${styles.botMessageWrapper}`}>
                            <div className={`${styles.messageBubble} ${styles.botBubble} ${styles.typingIndicator}`}>
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className={styles.chatInputArea}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask me anything..."
                        className={styles.chatInput}
                    />
                    <button
                        type="submit"
                        className={styles.sendBtn}
                        disabled={!inputValue.trim() || isTyping}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
