"use client";

import { useEffect, useRef } from "react";

interface Props {
    url: string;
}

export default function InstagramEmbed({ url }: Props) {
    // Ensure the URL ends with /embed/ for reliable loading
    const embedUrl = url.split('?')[0].replace(/\/+$/, '') + '/embed/';
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load Instagram's embed script if not already present
        if (!(window as any).instgrm) {
            const script = document.createElement("script");
            script.src = "https://www.instagram.com/embed.js";
            script.async = true;
            document.body.appendChild(script);
        } else {
            // If already present, process the embeds
            try {
                (window as any).instgrm.Embeds.process();
            } catch (e) {}
        }
    }, []);

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "relative",
                width: "100%",
                // Padding-bottom hack for 9:16 aspect ratio (16 / 9 * 100 = 177.77%)
                paddingBottom: "177.77%", 
                borderRadius: "16px",
                background: "#111",
                overflow: "hidden",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
        >
            <iframe
                src={`${embedUrl}?hidecaption=true`}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                title="Instagram Reel"
                scrolling="no"
                frameBorder="0"
                loading="lazy"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                    zIndex: 1,
                }}
            />

            {/* View on IG fallback link — only visible if iframe is blocked or fails */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 0,
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.8rem",
                textAlign: "center",
                padding: "20px"
            }}>
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                    View Reel on Instagram
                </a>
            </div>

            {/* Subtle top overlay to clean up the embed UI */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "40px",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)",
                zIndex: 2,
                pointerEvents: "none",
            }} />

            {/* Subtle bottom overlay — gradient instead of solid block */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60px",
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                zIndex: 2,
                pointerEvents: "none",
            }} />
        </div>
    );
}
