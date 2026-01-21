"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Flag,
    Settings,
    ShieldAlert,
    X,
    Menu,
    MessageSquare,
    Megaphone,
    FileText,
    Upload,
    Download,
    Send,
    Award
} from "lucide-react";

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { href: "/admin", icon: LayoutDashboard, label: "Overview" },
        { href: "/admin/users", icon: Users, label: "Users & Teams" },
        { href: "/admin/challenges", icon: Flag, label: "Challenges" },
        { href: "/admin/submissions", icon: Send, label: "Submissions" },
        { href: "/admin/certificates", icon: Award, label: "Certificates" },
        { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
        { href: "/admin/feedback", icon: MessageSquare, label: "Feedback" },
        { href: "/admin/audit-log", icon: FileText, label: "Audit Log" },
        { href: "/admin/security", icon: ShieldAlert, label: "Security" },
        { href: "/admin/import", icon: Upload, label: "Import Data" },
        { href: "/admin/export", icon: Download, label: "Export Data" },
        { href: "/admin/settings", icon: Settings, label: "Settings" },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 101,
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--black-card)',
                    border: '1px solid var(--black-border)',
                    borderRadius: '8px',
                    color: 'var(--yellow)',
                    cursor: 'pointer',
                }}
                className="hide-desktop"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 99,
                    }}
                    className="hide-desktop"
                />
            )}

            {/* Sidebar */}
            <aside
                style={{
                    width: '280px',
                    borderRight: '1px solid var(--black-border)',
                    background: 'var(--black-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    height: '100vh',
                    left: 0,
                    top: 0,
                    zIndex: 100,
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease',
                }}
                className="admin-sidebar"
            >
                <div style={{ padding: '32px 24px', borderBottom: '1px solid var(--black-border)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--yellow)' }}>
                        <ShieldAlert size={24} />
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.1em' }}>
                            0x1 ADMIN
                        </span>
                    </div>
                </div>

                <nav style={{ flex: 1, minHeight: 0, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={isActive ? 'admin-nav-link active' : 'admin-nav-link'}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    color: isActive ? 'var(--yellow)' : 'var(--text-secondary)',
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease',
                                    textDecoration: 'none',
                                    background: isActive ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                                    border: isActive ? '1px solid rgba(250, 204, 21, 0.2)' : '1px solid transparent',
                                }}
                            >
                                <span style={{ color: 'var(--yellow)', opacity: isActive ? 1 : 0.6 }}>
                                    <Icon size={20} />
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '24px', borderTop: '1px solid var(--black-border)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                        System Online
                    </div>
                </div>
            </aside>
        </>
    );
}

