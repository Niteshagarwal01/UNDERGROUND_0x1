"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { SignedIn, SignedOut, useAuth, useClerk } from "@clerk/nextjs";
import { LogOut, Menu, X, Flame, User, Award, Loader2, MessageCircle } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const { signOut } = useClerk();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dbUsername, setDbUsername] = useState<string | null>(null);
    const [signingOut, setSigningOut] = useState(false);
    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

    // Fetch database username for profile link
    const fetchUsername = useCallback(async () => {
        if (isSignedIn) {
            try {
                const res = await fetch("/api/user");
                const data = await res.json();
                if (data.success && data.user?.username) {
                    setDbUsername(data.user.username);
                }
            } catch (error) {
                console.error("Failed to fetch username:", error);
            }
        } else {
            setDbUsername(null);
        }
    }, [isSignedIn]);

    useEffect(() => {
        fetchUsername();
    }, [fetchUsername]);

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

    // Handle sign out with proper navigation
    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await signOut();
            setDbUsername(null);
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            setSigningOut(false);
        }
    };

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

                    {/* Show loading state while Clerk loads */}
                    {!isLoaded ? (
                        <div style={{ padding: '8px 16px' }}>
                            <Loader2 size={18} className="spinner" style={{ color: 'var(--text-muted)' }} />
                        </div>
                    ) : isSignedIn ? (
                        <>
                            <Link
                                href="/certificates"
                                className={`navbar-link ${isActive("/certificates") ? "active" : ""}`}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <Award size={14} />
                                Certificates
                            </Link>
                            <Link
                                href="/dashboard"
                                className={`navbar-link ${isActive("/dashboard") ? "active" : ""}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/chat"
                                className={`navbar-link ${isActive("/chat") ? "active" : ""}`}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <MessageCircle size={14} />
                                Chat
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
                            <button
                                onClick={handleSignOut}
                                disabled={signingOut}
                                className="btn btn-secondary btn-sm"
                            >
                                {signingOut ? (
                                    <Loader2 size={16} className="spinner" />
                                ) : (
                                    <LogOut size={16} />
                                )}
                                <span className="hide-mobile">Sign Out</span>
                            </button>
                        </>
                    ) : (
                        <Link href="/enter" className="btn btn-primary btn-sm">
                            Enter
                        </Link>
                    )}
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
                    <Link
                        href="/chat"
                        className={`navbar-mobile-link ${isActive("/chat") ? "active" : ""}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <MessageCircle size={16} />
                        Chat
                    </Link>

                    {!isLoaded ? (
                        <div style={{ padding: '16px', textAlign: 'center' }}>
                            <Loader2 size={24} className="spinner" style={{ color: 'var(--text-muted)' }} />
                        </div>
                    ) : isSignedIn ? (
                        <>
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
                            <button
                                onClick={handleSignOut}
                                disabled={signingOut}
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                            >
                                {signingOut ? (
                                    <Loader2 size={18} className="spinner" />
                                ) : (
                                    <LogOut size={18} />
                                )}
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="navbar-mobile-divider" />
                            <Link href="/enter" className="btn btn-primary" style={{ width: '100%' }}>
                                Enter
                            </Link>
                        </>
                    )}
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
