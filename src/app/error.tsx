"use client";

import { useEffect } from "react";
import Link from "next/link";

interface Props {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
    useEffect(() => {
        console.error("[App Error]", error);
    }, [error]);

    return (
        <div
            style={{
                minHeight: "60vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem 1rem",
                textAlign: "center",
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
            {error?.message && (
                <p
                    style={{
                        fontSize: "0.8rem",
                        color: "#c00",
                        marginBottom: "0.75rem",
                        maxWidth: "480px",
                        fontFamily: "monospace",
                        background: "#fff0f0",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "4px",
                        wordBreak: "break-word",
                    }}
                >
                    {error.message}
                </p>
            )}
            <p
                style={{
                    fontSize: "0.95rem",
                    color: "#666",
                    marginBottom: "1.75rem",
                    maxWidth: "420px",
                    lineHeight: 1.6,
                }}
            >
                We hit an unexpected error. Try refreshing the page — if the problem
                persists, please contact us.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                    onClick={reset}
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
                    Try Again
                </button>
                <Link
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
                    }}
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
