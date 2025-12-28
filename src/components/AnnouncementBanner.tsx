"use client";

import { useState, useEffect } from "react";
import { Megaphone, X, ChevronRight, ChevronLeft, Pin } from "lucide-react";

interface Announcement {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
}

export default function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // Load dismissed announcements from localStorage
        const stored = localStorage.getItem("dismissedAnnouncements");
        if (stored) {
            setDismissed(JSON.parse(stored));
        }
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch("/api/announcements");
            const data = await res.json();
            if (data.success) {
                setAnnouncements(data.announcements);
            }
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    const dismissAnnouncement = (id: string) => {
        const newDismissed = [...dismissed, id];
        setDismissed(newDismissed);
        localStorage.setItem("dismissedAnnouncements", JSON.stringify(newDismissed));
    };

    const dismissAll = () => {
        const allIds = visibleAnnouncements.map(a => a.id);
        const newDismissed = [...dismissed, ...allIds];
        setDismissed(newDismissed);
        localStorage.setItem("dismissedAnnouncements", JSON.stringify(newDismissed));
    };

    // Filter out dismissed announcements
    const visibleAnnouncements = announcements.filter(a => !dismissed.includes(a.id));

    if (loading || visibleAnnouncements.length === 0) {
        return null;
    }

    const current = visibleAnnouncements[currentIndex];
    if (!current) return null;

    const goNext = () => {
        setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length);
    };

    const goPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + visibleAnnouncements.length) % visibleAnnouncements.length);
    };

    return (
        <div className="announcement-popup">
            {/* Collapsed View - Just a bell icon */}
            {!isExpanded ? (
                <button
                    className="announcement-trigger"
                    onClick={() => setIsExpanded(true)}
                >
                    <Megaphone size={18} />
                    <span className="announcement-badge">{visibleAnnouncements.length}</span>
                </button>
            ) : (
                /* Expanded View - Full popup */
                <div className="announcement-card">
                    <div className="announcement-header">
                        <div className="announcement-icon">
                            <Megaphone size={16} />
                        </div>
                        <span className="announcement-label">
                            Announcements
                            {visibleAnnouncements.length > 1 && (
                                <span className="announcement-count">
                                    {currentIndex + 1}/{visibleAnnouncements.length}
                                </span>
                            )}
                        </span>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="announcement-close"
                            title="Minimize"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="announcement-body">
                        <h4 className="announcement-title">
                            {current.isPinned && <Pin size={12} />}
                            {current.title}
                        </h4>
                        <p className="announcement-message">{current.content}</p>
                    </div>

                    <div className="announcement-footer">
                        {visibleAnnouncements.length > 1 && (
                            <div className="announcement-nav">
                                <button onClick={goPrev}><ChevronLeft size={14} /></button>
                                <button onClick={goNext}><ChevronRight size={14} /></button>
                            </div>
                        )}
                        <button
                            onClick={() => dismissAnnouncement(current.id)}
                            className="announcement-dismiss"
                        >
                            Dismiss
                        </button>
                        {visibleAnnouncements.length > 1 && (
                            <button
                                onClick={dismissAll}
                                className="announcement-dismiss-all"
                            >
                                Dismiss All
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .announcement-popup {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999;
                }

                .announcement-trigger {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #facc15, #f59e0b);
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #000;
                    box-shadow: 0 4px 20px rgba(250, 204, 21, 0.4);
                    transition: transform 0.2s, box-shadow 0.2s;
                    position: relative;
                }

                .announcement-trigger:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 24px rgba(250, 204, 21, 0.5);
                }

                .announcement-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    min-width: 20px;
                    height: 20px;
                    background: #ef4444;
                    color: white;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 6px;
                }

                .announcement-card {
                    width: 340px;
                    background: #0d0d0d;
                    border: 1px solid rgba(250, 204, 21, 0.3);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .announcement-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    background: rgba(250, 204, 21, 0.1);
                    border-bottom: 1px solid rgba(250, 204, 21, 0.2);
                }

                .announcement-icon {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--yellow);
                    border-radius: 6px;
                    color: #000;
                }

                .announcement-label {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--yellow);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .announcement-count {
                    font-size: 11px;
                    color: var(--text-muted);
                    font-weight: normal;
                }

                .announcement-close {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 4px;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .announcement-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .announcement-body {
                    padding: 16px;
                }

                .announcement-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: white;
                    margin: 0 0 8px 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .announcement-message {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin: 0;
                    line-height: 1.5;
                    max-height: 100px;
                    overflow-y: auto;
                }

                .announcement-footer {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    border-top: 1px solid #1a1a1a;
                }

                .announcement-nav {
                    display: flex;
                    gap: 4px;
                }

                .announcement-nav button {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #1a1a1a;
                    border: 1px solid #2a2a2a;
                    border-radius: 6px;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .announcement-nav button:hover {
                    background: rgba(250, 204, 21, 0.1);
                    border-color: rgba(250, 204, 21, 0.2);
                    color: var(--yellow);
                }

                .announcement-dismiss,
                .announcement-dismiss-all {
                    padding: 6px 12px;
                    font-size: 12px;
                    background: transparent;
                    border: 1px solid #2a2a2a;
                    border-radius: 6px;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .announcement-dismiss:hover {
                    background: rgba(250, 204, 21, 0.1);
                    border-color: rgba(250, 204, 21, 0.2);
                    color: var(--yellow);
                }

                .announcement-dismiss-all {
                    margin-left: auto;
                }

                .announcement-dismiss-all:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                @media (max-width: 400px) {
                    .announcement-popup {
                        bottom: 16px;
                        right: 16px;
                        left: 16px;
                    }

                    .announcement-card {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
