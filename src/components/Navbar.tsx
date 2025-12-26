"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link href="/" className="navbar-logo">
                    UNDERGROUND<span className="navbar-logo-suffix">_0x1</span>
                </Link>

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
            </div>
        </nav>
    );
}
