"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignOutButton, useAuth } from "@clerk/nextjs";
import { LogOut, Menu, X, Flame, User } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
    const pathname = usePathname();
    const { isSignedIn } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dbUsername, setDbUsername] = useState<string | null>(null);
    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

    // Fetch database username for profile link
    useEffect(() => {
        if (isSignedIn) {
            fetch("/api/user")
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.user?.username) {
                        setDbUsername(data.user.username);
                    }
                })
                .catch(() => { });
        }
    }, [isSignedIn]);

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
                        href="/hall-of-fame"
                        className={`navbar-link ${isActive("/hall-of-fame") ? "active" : ""}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <Flame size={14} />
                        Hall of Fame
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
                        {dbUsername && (
                            <Link
                                href={`/profile/${dbUsername}`}
                                className={`navbar-link ${isActive("/profile") ? "active" : ""}`}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <User size={14} />
                                Profile
                            </Link>
                        )}
                        <NotificationBell />
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
                        href="/hall-of-fame"
                        className={`navbar-mobile-link ${isActive("/hall-of-fame") ? "active" : ""}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Flame size={16} className="text-yellow" />
                        Hall of Fame
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
                        {dbUsername && (
                            <Link
                                href={`/profile/${dbUsername}`}
                                className={`navbar-mobile-link ${isActive("/profile") ? "active" : ""}`}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <User size={16} className="text-yellow" />
                                My Profile
                            </Link>
                        )}
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

