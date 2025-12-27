"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignOutButton } from "@clerk/nextjs";
import { LogOut, Menu, X } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isActive = (path: string) => pathname === path;

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link href="/" className="navbar-logo">
                    UNDERGROUND<span className="navbar-logo-suffix">_0x1</span>
                </Link>

                {/* Desktop Menu */}
                <div className="navbar-menu">
                    <Link
                        href="/challenges"
                        className={`navbar-link ${isActive("/challenges") ? "active" : ""}`}
                    >
                        Challenges
                    </Link>
                    <Link
                        href="/leaderboard"
                        className={`navbar-link ${isActive("/leaderboard") ? "active" : ""}`}
                    >
                        Leaderboard
                    </Link>
                    <Link
                        href="/feedback"
                        className={`navbar-link ${isActive("/feedback") ? "active" : ""}`}
                    >
                        Feedback
                    </Link>

                    <SignedIn>
                        <Link
                            href="/dashboard"
                            className={`navbar-link ${isActive("/dashboard") ? "active" : ""}`}
                        >
                            Dashboard
                        </Link>
                        <SignOutButton>
                            <button className="btn btn-secondary btn-sm">
                                <LogOut size={16} />
                                <span className="hide-mobile">Sign Out</span>
                            </button>
                        </SignOutButton>
                    </SignedIn>

                    <SignedOut>
                        <Link href="/enter" className="btn btn-primary btn-sm">
                            Enter
                        </Link>
                    </SignedOut>
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    className="navbar-hamburger"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`navbar-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
                <div className="navbar-mobile-links">
                    <Link
                        href="/challenges"
                        className={`navbar-mobile-link ${isActive("/challenges") ? "active" : ""}`}
                    >
                        Challenges
                    </Link>
                    <Link
                        href="/leaderboard"
                        className={`navbar-mobile-link ${isActive("/leaderboard") ? "active" : ""}`}
                    >
                        Leaderboard
                    </Link>
                    <Link
                        href="/feedback"
                        className={`navbar-mobile-link ${isActive("/feedback") ? "active" : ""}`}
                    >
                        Feedback
                    </Link>

                    <SignedIn>
                        <Link
                            href="/dashboard"
                            className={`navbar-mobile-link ${isActive("/dashboard") ? "active" : ""}`}
                        >
                            Dashboard
                        </Link>
                        <div className="navbar-mobile-divider" />
                        <SignOutButton>
                            <button className="btn btn-secondary" style={{ width: '100%' }}>
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </SignOutButton>
                    </SignedIn>

                    <SignedOut>
                        <div className="navbar-mobile-divider" />
                        <Link href="/enter" className="btn btn-primary" style={{ width: '100%' }}>
                            Enter
                        </Link>
                    </SignedOut>
                </div>
            </div>

            {/* Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="navbar-backdrop"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
        </nav>
    );
}

