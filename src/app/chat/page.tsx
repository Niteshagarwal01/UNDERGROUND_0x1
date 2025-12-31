"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageCircle, Users, Loader2, AlertCircle, Hash, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import CommunityChat from "@/components/CommunityChat";
import TeamChat from "@/components/TeamChat";

type ChatTab = "community" | "team";

interface UserData {
    id: string;
    role: "USER" | "MODERATOR" | "ADMIN";
    team: {
        id: string;
        name: string;
    } | null;
}

export default function ChatPage() {
    const { isSignedIn, isLoaded } = useUser();
    const [activeTab, setActiveTab] = useState<ChatTab>("community");
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/user");
                const data = await res.json();
                if (data.success) {
                    setUserData({
                        id: data.user.id,
                        role: data.user.role || "USER",
                        team: data.user.team
                    });
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isSignedIn) {
            fetchUser();
        } else if (isLoaded) {
            setLoading(false);
        }
    }, [isSignedIn, isLoaded]);

    // Not signed in
    if (isLoaded && !isSignedIn) {
        return (
            <>
                <Navbar />
                <div className="chat-fullscreen">
                    <div className="auth-required">
                        <div className="auth-icon">
                            <Lock size={48} />
                        </div>
                        <h2>Access Denied</h2>
                        <p>You need to sign in to access the chat.</p>
                        <a href="/sign-in" className="btn btn-primary">
                            Sign In to Continue
                        </a>
                    </div>

                    <style jsx>{`
                        .chat-fullscreen {
                            position: fixed;
                            top: var(--nav-height);
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: var(--black);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }

                        .auth-required {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 16px;
                            text-align: center;
                            padding: 40px;
                        }

                        .auth-icon {
                            width: 80px;
                            height: 80px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: rgba(250, 204, 21, 0.1);
                            border: 1px solid rgba(250, 204, 21, 0.3);
                            border-radius: 50%;
                            color: var(--yellow);
                            margin-bottom: 8px;
                        }

                        .auth-required h2 {
                            font-family: var(--font-heading);
                            font-size: 1.5rem;
                            color: var(--yellow);
                            margin: 0;
                        }

                        .auth-required p {
                            color: var(--text-muted);
                            margin: 0;
                        }
                    `}</style>
                </div>
            </>
        );
    }

    // Loading
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="chat-fullscreen">
                    <div className="loading-state">
                        <Loader2 size={40} className="spin" />
                        <span>Loading chat...</span>
                    </div>

                    <style jsx>{`
                        .chat-fullscreen {
                            position: fixed;
                            top: var(--nav-height);
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: var(--black);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }

                        .loading-state {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 16px;
                            color: var(--text-muted);
                        }

                        .spin {
                            animation: spin 1s linear infinite;
                            color: var(--yellow);
                        }

                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="chat-fullscreen">
                {/* Discord-style Sidebar */}
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-title">
                            <MessageCircle size={18} />
                            <span>Chat</span>
                        </div>
                    </div>

                    <div className="channel-list">
                        <div className="channel-section">
                            <div className="channel-header">TEXT CHANNELS</div>

                            <button
                                className={`channel-item ${activeTab === "community" ? "active" : ""}`}
                                onClick={() => setActiveTab("community")}
                            >
                                <Hash size={18} />
                                <span>community</span>
                                <div className="channel-badge live">LIVE</div>
                            </button>

                            <button
                                className={`channel-item ${activeTab === "team" ? "active" : ""} ${!userData?.team ? "disabled" : ""}`}
                                onClick={() => userData?.team && setActiveTab("team")}
                                disabled={!userData?.team}
                            >
                                <Lock size={16} />
                                <span>{userData?.team ? userData.team.name.toLowerCase().replace(/\s+/g, '-') : "team-chat"}</span>
                                {!userData?.team && <div className="channel-badge locked">NO TEAM</div>}
                            </button>
                        </div>
                    </div>

                    <div className="sidebar-footer">
                        <div className="user-info">
                            <div className="user-status">
                                <div className="status-dot"></div>
                                <span>Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="chat-main">
                    {activeTab === "community" ? (
                        <CommunityChat
                            currentUserId={userData?.id}
                            currentUserRole={userData?.role}
                        />
                    ) : userData?.team ? (
                        <TeamChat
                            teamId={userData.team.id}
                            currentUserId={userData?.id}
                        />
                    ) : (
                        <div className="no-team-panel">
                            <div className="no-team-icon">
                                <Users size={48} />
                            </div>
                            <h3>No Team Yet</h3>
                            <p>Join or create a team to access private team chat.</p>
                            <a href="/dashboard" className="btn btn-primary">
                                Go to Dashboard
                            </a>
                        </div>
                    )}
                </div>

                <style jsx>{`
                .chat-fullscreen {
                    position: fixed;
                    top: var(--nav-height);
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    background: var(--black);
                    overflow: hidden;
                }

                /* Discord-style Sidebar */
                .chat-sidebar {
                    width: 240px;
                    background: var(--black-card);
                    border-right: 1px solid var(--black-border);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                }

                .sidebar-header {
                    padding: 16px;
                    border-bottom: 1px solid var(--black-border);
                    background: linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, transparent 100%);
                }

                .sidebar-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: var(--font-heading);
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--yellow);
                }

                .channel-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px 8px;
                }

                .channel-section {
                    margin-bottom: 16px;
                }

                .channel-header {
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    padding: 0 8px;
                    margin-bottom: 8px;
                }

                .channel-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 10px 12px;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    font-family: var(--font-body);
                    font-size: 14px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.15s ease;
                    text-align: left;
                }

                .channel-item:hover:not(.disabled) {
                    background: var(--black-hover);
                    color: var(--text-primary);
                }

                .channel-item.active {
                    background: rgba(250, 204, 21, 0.15);
                    color: var(--yellow);
                }

                .channel-item.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    width: 4px;
                    height: 24px;
                    background: var(--yellow);
                    border-radius: 0 4px 4px 0;
                }

                .channel-item.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .channel-badge {
                    margin-left: auto;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .channel-badge.live {
                    background: rgba(34, 197, 94, 0.2);
                    color: #22c55e;
                }

                .channel-badge.locked {
                    background: rgba(250, 204, 21, 0.1);
                    color: var(--yellow-muted);
                }

                .sidebar-footer {
                    padding: 12px;
                    border-top: 1px solid var(--black-border);
                    background: var(--black-lighter);
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .user-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
                }

                /* Main Chat Area */
                .chat-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    background: var(--black);
                }

                .no-team-panel {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    height: 100%;
                    text-align: center;
                    padding: 40px;
                }

                .no-team-icon {
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(250, 204, 21, 0.1);
                    border: 1px solid rgba(250, 204, 21, 0.3);
                    border-radius: 50%;
                    color: var(--yellow);
                }

                .no-team-panel h3 {
                    font-family: var(--font-heading);
                    font-size: 1.25rem;
                    color: var(--yellow);
                    margin: 0;
                }

                .no-team-panel p {
                    color: var(--text-muted);
                    margin: 0;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .chat-sidebar {
                        width: 60px;
                        min-width: 60px;
                    }

                    .sidebar-header {
                        padding: 12px;
                    }

                    .sidebar-title span {
                        display: none;
                    }

                    .channel-header {
                        display: none;
                    }

                    .channel-item {
                        justify-content: center;
                        padding: 12px;
                    }

                    .channel-item span {
                        display: none;
                    }

                    .channel-badge {
                        display: none;
                    }

                    .sidebar-footer {
                        display: none;
                    }
                }
            `}</style>
            </div>
        </>
    );
}
