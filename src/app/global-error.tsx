"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        const isChunkError =
            error?.name === "ChunkLoadError" ||
            error?.message?.includes("ChunkLoadError") ||
            error?.message?.includes("Loading chunk") ||
            error?.message?.includes("Failed to load chunk");

        if (isChunkError) {
            const KEY = "__cle_ts";
            const last = +(sessionStorage.getItem(KEY) || 0);
            if (Date.now() - last > 15000) {
                sessionStorage.setItem(KEY, String(Date.now()));
                window.location.reload();
                return;
            }
        }
        console.error("[Global Error]", error);
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    fontFamily: "sans-serif",
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem 1rem",
                    textAlign: "center",
                    background: "#fff",
                }}
            >
                <h2
                    style={{
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        marginBottom: "0.75rem",
                        color: "#111",
                    }}
                >
                    Something went wrong
                </h2>
                <p
                    style={{
                        fontSize: "0.95rem",
                        color: "#666",
                        marginBottom: "1.75rem",
                        maxWidth: "420px",
                        lineHeight: 1.6,
                    }}
                >
                    We hit an unexpected error. Try refreshing the page — if the
                    problem persists, please contact us.
                </p>
                <div
                    style={{
                        display: "flex",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                        justifyContent: "center",
                    }}
                >
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: "0.75rem 1.75rem",
                            background: "#151c39",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Reload Page
                    </button>
                    <a
                        href="/"
                        style={{
                            padding: "0.75rem 1.75rem",
                            background: "transparent",
                            color: "#111",
                            border: "2px solid #111",
                            borderRadius: "4px",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            letterSpacing: "0.04em",
                            textDecoration: "none",
                        }}
                    >
                        Go Home
                    </a>
                </div>
            </body>
        </html>
    );
}
