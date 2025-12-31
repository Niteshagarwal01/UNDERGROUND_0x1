"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { LogOut, Menu, X, Target, Trophy, MessageSquare, LayoutDashboard, Flame, User, Award, Loader2, Headphones } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function MobileNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const { signOut } = useClerk();
    const [dbUsername, setDbUsername] = useState<string | null>(null);
    const [signingOut, setSigningOut] = useState(false);

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

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Handle sign out with proper navigation
    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await signOut();
            setDbUsername(null);
            setIsOpen(false);
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            setSigningOut(false);
        }
    };

    const navItems = [
        { href: "/challenges", icon: Target, label: "Challenges" },
        { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
        { href: "/hall-of-fame", icon: Flame, label: "Hall of Fame" },
        { href: "/certificates", icon: Award, label: "Certificates", auth: true },
        { href: "/support", icon: Headphones, label: "Support" },
        { href: "/chat", icon: MessageSquare, label: "Chat" },
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", auth: true },
    ];

    return (
        <>
            {/* Mobile Menu Button - only visible on mobile via hide-desktop class */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    top: '12px',
                    right: '16px',
                    zIndex: 10001,
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0d0d0d',
                    border: '1px solid #facc15',
                    borderRadius: '8px',
                    color: '#facc15',
                    cursor: 'pointer',
                }}
                className="hide-desktop"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay/Backdrop */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 9999,
                    }}
                    className="hide-desktop"
                />
            )}

            {/* Mobile Menu Panel */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '280px',
                    maxWidth: '85vw',
                    background: '#0a0a0a',
                    borderLeft: '1px solid #1a1a1a',
                    zIndex: 10000,
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                }}
                className="hide-desktop"
            >
                {/* Header */}
                <div style={{
                    padding: '24px 20px',
                    borderBottom: '1px solid #1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: '#facc15',
                        letterSpacing: '0.05em'
                    }}>
                        UNDERGROUND
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#666' }}>_0x1</span>
                </div>

                {/* Navigation Links */}
                <nav style={{ flex: 1, padding: '16px' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        // Skip auth-required items for signed out users
                        if (item.auth && !isSignedIn) {
                            return null;
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 16px',
                                    marginBottom: '8px',
                                    borderRadius: '8px',
                                    color: isActive ? '#facc15' : '#a3a3a3',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    background: isActive ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                                    border: isActive ? '1px solid rgba(250, 204, 21, 0.2)' : '1px solid transparent',
                                }}
                            >
                                <Icon size={20} style={{ opacity: isActive ? 1 : 0.6 }} />
                                {item.label}
                            </Link>
                        );
                    })}

                    {/* Profile Link - only when signed in and username loaded */}
                    {isSignedIn && dbUsername && (
                        <Link
                            href={`/profile/${dbUsername}`}
                            onClick={() => setIsOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 16px',
                                marginBottom: '8px',
                                borderRadius: '8px',
                                color: pathname?.startsWith('/profile') ? '#facc15' : '#a3a3a3',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: 500,
                                background: pathname?.startsWith('/profile') ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                                border: pathname?.startsWith('/profile') ? '1px solid rgba(250, 204, 21, 0.2)' : '1px solid transparent',
                            }}
                        >
                            <User size={20} style={{ opacity: pathname?.startsWith('/profile') ? 1 : 0.6 }} />
                            My Profile
                        </Link>
                    )}
                </nav>

                {/* Footer Actions */}
                <div style={{ padding: '16px', borderTop: '1px solid #1a1a1a' }}>
                    {!isLoaded ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px' }}>
                            <Loader2 size={24} className="spinner" style={{ color: '#a3a3a3' }} />
                        </div>
                    ) : isSignedIn ? (
                        <>
                            {/* Notification Bell */}
                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                                <NotificationBell />
                            </div>
                            <button
                                onClick={handleSignOut}
                                disabled={signingOut}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '14px',
                                    background: 'transparent',
                                    border: '1px solid #1a1a1a',
                                    borderRadius: '8px',
                                    color: '#a3a3a3',
                                    fontSize: '14px',
                                    cursor: signingOut ? 'wait' : 'pointer',
                                }}
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
                        <Link
                            href="/enter"
                            onClick={() => setIsOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px',
                                background: '#facc15',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#000',
                                fontSize: '14px',
                                fontWeight: 600,
                                textDecoration: 'none',
                            }}
                        >
                            Enter Platform
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}
