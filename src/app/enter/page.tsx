"use client";

import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { useState } from "react";
import { Terminal } from "lucide-react";

export default function EnterPage() {
    const [mode, setMode] = useState<"signin" | "signup">("signin");

    return (
        <div className="min-h-screen bg-black grid-pattern">
            {/* Minimal Navbar */}
            <nav className="navbar">
                <div className="container navbar-container">
                    <Link href="/" className="navbar-logo">
                        UNDERGROUND<span className="navbar-logo-suffix">_0x1</span>
                    </Link>
                </div>
            </nav>

            {/* Auth Container */}
            <div className="auth-page">
                <div style={{ width: '100%', maxWidth: '480px' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <Terminal size={48} className="text-yellow" style={{ marginBottom: '16px' }} />
                        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
                            <span className="text-gradient">UNDERGROUND</span>_0x1
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {mode === "signin" ? "Welcome back, operator" : "Join the underground"}
                        </p>
                    </div>

                    {/* Mode Switcher */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        <button
                            onClick={() => setMode("signin")}
                            className={`btn ${mode === "signin" ? "btn-primary" : "btn-secondary"}`}
                            style={{ flex: 1 }}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setMode("signup")}
                            className={`btn ${mode === "signup" ? "btn-primary" : "btn-secondary"}`}
                            style={{ flex: 1 }}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Clerk Component */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                    }}>
                        {mode === "signin" ? (
                            <SignIn
                                routing="hash"
                                forceRedirectUrl="/dashboard"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        card: "bg-[#0d0d0d] border border-[#1a1a1a] shadow-none",
                                        headerTitle: "hidden",
                                        headerSubtitle: "hidden",
                                        socialButtonsBlockButton: "bg-[#111] border-[#1a1a1a] hover:border-[#facc15] text-white",
                                        socialButtonsBlockButtonText: "text-white",
                                        dividerLine: "bg-[#1a1a1a]",
                                        dividerText: "text-[#525252]",
                                        formFieldLabel: "text-[#a3a3a3]",
                                        formFieldInput: "bg-[#111] border-[#1a1a1a] text-white focus:border-[#facc15]",
                                        formButtonPrimary: "bg-[#facc15] hover:bg-[#eab308] text-black font-semibold",
                                        footerActionLink: "text-[#facc15] hover:text-[#fde047]",
                                        identityPreviewText: "text-white",
                                        identityPreviewEditButton: "text-[#facc15]",
                                    },
                                }}
                            />
                        ) : (
                            <SignUp
                                routing="hash"
                                forceRedirectUrl="/dashboard"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        card: "bg-[#0d0d0d] border border-[#1a1a1a] shadow-none",
                                        headerTitle: "hidden",
                                        headerSubtitle: "hidden",
                                        socialButtonsBlockButton: "bg-[#111] border-[#1a1a1a] hover:border-[#facc15] text-white",
                                        socialButtonsBlockButtonText: "text-white",
                                        dividerLine: "bg-[#1a1a1a]",
                                        dividerText: "text-[#525252]",
                                        formFieldLabel: "text-[#a3a3a3]",
                                        formFieldInput: "bg-[#111] border-[#1a1a1a] text-white focus:border-[#facc15]",
                                        formButtonPrimary: "bg-[#facc15] hover:bg-[#eab308] text-black font-semibold",
                                        footerActionLink: "text-[#facc15] hover:text-[#fde047]",
                                        identityPreviewText: "text-white",
                                        identityPreviewEditButton: "text-[#facc15]",
                                    },
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
