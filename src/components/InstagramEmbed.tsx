"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
    url: string;
}

export default function InstagramEmbed({ url }: Props) {
    const embedUrl = url.endsWith('/') ? `${url}embed/` : `${url}/embed/`;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [iframeKey, setIframeKey] = useState(0);

    // Pause video when scrolled out of view by resetting the iframe src
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper || typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        // Reset iframe to stop video playback
                        setIframeKey((k) => k + 1);
                    }
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(wrapper);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                aspectRatio: "9/16",
                borderRadius: "16px",
                background: "#0a0a0a",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
        >
            {/* Top mask — hides Instagram profile header and blocks clicks on it */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "54px",
                background: "#0a0a0a",
                zIndex: 10,
                pointerEvents: "all",
                cursor: "default",
            }} />

            <iframe
                key={iframeKey}
                ref={iframeRef}
                src={`${embedUrl}?hidecaption=true`}
                allow="encrypted-media; autoplay"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                    overflow: "hidden",
                    pointerEvents: "auto",
                }}
            />

            {/* Bottom mask — hides likes, comments, share buttons and blocks clicks on them */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "110px",
                background: "#0a0a0a",
                zIndex: 10,
                pointerEvents: "all",
                cursor: "default",
            }} />
        </div>
    );
}
