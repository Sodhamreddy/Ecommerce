"use client";

interface Props {
    url: string;
}

export default function InstagramEmbed({ url }: Props) {
    const isReel = url.includes('/reel/');
    
    // Ensure URL ends with a slash and append embed/
    const embedUrl = url.endsWith('/') ? `${url}embed/` : `${url}/embed/`;

    return (
        <div style={{
            position: "relative",
            overflow: "hidden",
            width: "100%",
            aspectRatio: "9/16",
            borderRadius: "16px",
            background: "#0a0a0a",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}>
            {/* Top Mask - Hides the Instagram profile header */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "54px",
                background: "#0a0a0a",
                zIndex: 10,
                pointerEvents: "none"
            }} />
            
            <iframe
                src={`${embedUrl}?hidecaption=true`}
                scrolling="no"
                allow="encrypted-media"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                }}
            />

            {/* Bottom Mask - Hides the Instagram footer */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "65px",
                background: "#0a0a0a",
                zIndex: 10,
                pointerEvents: "none"
            }} />
        </div>
    );
}
