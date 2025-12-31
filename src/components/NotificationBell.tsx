"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, Trophy, Users, UserPlus, UserMinus, Zap, Megaphone, Target, X } from "lucide-react";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

const typeIcons: Record<string, typeof Trophy> = {
    ACHIEVEMENT_EARNED: Trophy,
    TEAM_JOIN_REQUEST: UserPlus,
    TEAM_MEMBER_JOINED: Users,
    TEAM_MEMBER_LEFT: UserMinus,
    FIRST_BLOOD: Zap,
    ANNOUNCEMENT: Megaphone,
    CHALLENGE_SOLVED: Target,
};

const typeColors: Record<string, string> = {
    ACHIEVEMENT_EARNED: "#facc15",
    TEAM_JOIN_REQUEST: "#3b82f6",
    TEAM_MEMBER_JOINED: "#22c55e",
    TEAM_MEMBER_LEFT: "#ef4444",
    FIRST_BLOOD: "#facc15",
    ANNOUNCEMENT: "#a855f7",
    CHALLENGE_SOLVED: "#22c55e",
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Prevent body scroll when mobile modal is open
    useEffect(() => {
        if (isOpen && isMobile) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen, isMobile]);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications?limit=10");
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();

        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Mark all as read
    const markAllRead = async () => {
        setLoading(true);
        try {
            await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true })
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        } finally {
            setLoading(false);
        }
    };

    // Mark single notification as read
    const markAsRead = async (id: string) => {
        try {
            await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: [id] })
            });
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className="notification-bell-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Mobile: Fullscreen Modal Overlay */}
                    {isMobile && (
                        <div
                            className="mobile-notification-overlay"
                            onClick={() => setIsOpen(false)}
                        />
                    )}

                    {/* Notification Panel - Modal on mobile, Dropdown on desktop */}
                    <div className={`notification-dropdown ${isMobile ? 'mobile-modal' : ''}`}>
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            <div className="notification-header-actions">
                                {unreadCount > 0 && (
                                    <button
                                        className="mark-all-read"
                                        onClick={markAllRead}
                                        disabled={loading}
                                    >
                                        <Check size={14} />
                                        Mark all read
                                    </button>
                                )}
                                {isMobile && (
                                    <button
                                        className="mobile-close-btn"
                                        onClick={() => setIsOpen(false)}
                                        aria-label="Close notifications"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="notification-list">
                            {notifications.length === 0 ? (
                                <div className="notification-empty">
                                    <Bell size={32} />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const Icon = typeIcons[notification.type] || Bell;
                                    const color = typeColors[notification.type] || "#737373";

                                    const content = (
                                        <div
                                            className={`notification-item ${!notification.isRead ? "unread" : ""}`}
                                            onClick={() => !notification.isRead && markAsRead(notification.id)}
                                        >
                                            <div
                                                className="notification-icon"
                                                style={{ background: `${color}20`, color }}
                                            >
                                                <Icon size={16} />
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-title">{notification.title}</div>
                                                <div className="notification-message">{notification.message}</div>
                                                <div className="notification-time">{formatTimeAgo(notification.createdAt)}</div>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="notification-unread-dot" />
                                            )}
                                        </div>
                                    );

                                    return notification.link ? (
                                        <Link key={notification.id} href={notification.link} onClick={() => setIsOpen(false)}>
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={notification.id}>{content}</div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .notification-bell-container {
                    position: relative;
                }

                .notification-bell-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    background: transparent;
                    border: 1px solid transparent;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }

                .notification-bell-btn:hover {
                    background: rgba(250, 204, 21, 0.1);
                    border-color: rgba(250, 204, 21, 0.2);
                    color: var(--yellow);
                }

                .notification-badge {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    min-width: 18px;
                    height: 18px;
                    padding: 0 5px;
                    font-size: 10px;
                    font-weight: 700;
                    background: var(--yellow);
                    color: #000;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .notification-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 360px;
                    max-height: 480px;
                    background: #0d0d0d;
                    border: 1px solid rgba(250, 204, 21, 0.2);
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                    z-index: 1000;
                }

                .notification-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid #1a1a1a;
                }

                .notification-header h3 {
                    font-size: 14px;
                    font-weight: 600;
                    margin: 0;
                    color: white;
                }

                .mark-all-read {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--yellow);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                    transition: background 0.2s;
                }

                .mark-all-read:hover {
                    background: rgba(250, 204, 21, 0.1);
                }

                .notification-list {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .notification-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 24px;
                    color: var(--text-muted);
                    gap: 12px;
                }

                .notification-empty p {
                    margin: 0;
                    font-size: 14px;
                }

                .notification-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px 20px;
                    cursor: pointer;
                    transition: background 0.2s;
                    border-bottom: 1px solid #1a1a1a;
                    position: relative;
                }

                .notification-item:hover {
                    background: rgba(255, 255, 255, 0.02);
                }

                .notification-item.unread {
                    background: rgba(250, 204, 21, 0.03);
                }

                .notification-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 2px;
                }

                .notification-message {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin-bottom: 4px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .notification-time {
                    font-size: 11px;
                    color: #525252;
                }

                .notification-unread-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--yellow);
                    flex-shrink: 0;
                    margin-top: 6px;
                }

                @media (max-width: 400px) {
                    .notification-dropdown:not(.mobile-modal) {
                        width: calc(100vw - 24px);
                        right: -12px;
                    }
                }

                /* Mobile Fullscreen Modal Styles */
                .mobile-notification-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 10001;
                    animation: fadeIn 0.2s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { 
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to { 
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .notification-dropdown.mobile-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    width: 100%;
                    max-width: 100%;
                    max-height: 100vh;
                    height: 100%;
                    border-radius: 0;
                    border: none;
                    z-index: 10002;
                    animation: slideUp 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    padding-top: env(safe-area-inset-top, 0);
                    padding-bottom: env(safe-area-inset-bottom, 0);
                }

                .mobile-modal .notification-header {
                    padding: 20px;
                    padding-top: max(20px, env(safe-area-inset-top, 20px));
                    border-bottom: 1px solid rgba(250, 204, 21, 0.15);
                    flex-shrink: 0;
                }

                .mobile-modal .notification-header h3 {
                    font-size: 18px;
                    font-weight: 700;
                    color: #facc15;
                }

                .notification-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .mobile-close-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #a3a3a3;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .mobile-close-btn:hover,
                .mobile-close-btn:active {
                    background: rgba(250, 204, 21, 0.2);
                    border-color: rgba(250, 204, 21, 0.3);
                    color: #facc15;
                }

                .mobile-modal .notification-list {
                    flex: 1;
                    max-height: none;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
                }

                .mobile-modal .notification-item {
                    padding: 16px 20px;
                }

                .mobile-modal .notification-empty {
                    height: 100%;
                    min-height: 300px;
                }
            `}</style>
        </div>
    );
}
