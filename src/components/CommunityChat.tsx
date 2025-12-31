"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Shield, Wrench, Loader2, AlertCircle, Users, Hash } from "lucide-react";

interface ChatMessage {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
        avatarUrl: string | null;
        role: "USER" | "MODERATOR" | "ADMIN";
    };
}

interface CommunityChatProps {
    currentUserId?: string;
    currentUserRole?: "USER" | "MODERATOR" | "ADMIN";
}

function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function CommunityChat({ currentUserId, currentUserRole }: CommunityChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeUsers, setActiveUsers] = useState(0);
    const [slowModeActive, setSlowModeActive] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async (isInitialLoad = false) => {
        try {
            const res = await fetch("/api/chat?limit=50");
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
                setActiveUsers(data.activeUsers || 0);
                setSlowModeActive(data.slowModeActive || false);
                setError(null);
            } else if (!isInitialLoad) {
                // Only show errors after initial load
                setError(data.message || "Failed to load messages");
            }
        } catch {
            // Only show connection errors after initial load
            if (!isInitialLoad) {
                setError("Connection error - retrying...");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch with grace period for auth
        const initialFetch = async () => {
            setLoading(true);
            setError(null);
            await fetchMessages(true);

            // Retry after delay if needed (auth might be slow)
            setTimeout(() => fetchMessages(false), 1500);
        };

        initialFetch();

        // Polling with slightly longer interval
        const interval = setInterval(() => fetchMessages(false), 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (cooldownRemaining > 0) {
            const timer = setTimeout(() => {
                setCooldownRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldownRemaining]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending || cooldownRemaining > 0) return;

        setSending(true);
        setError(null);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage.trim() })
            });
            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, data.message]);
                setNewMessage("");
                const cooldownMs = slowModeActive ? 10000 : 2000;
                setCooldownRemaining(Math.ceil(cooldownMs / 1000));
            } else {
                setError(data.message);
                if (res.status === 429) {
                    const match = data.message.match(/(\d+)/);
                    if (match) setCooldownRemaining(parseInt(match[1]));
                }
            }
        } catch {
            setError("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (messageId: string) => {
        try {
            const res = await fetch(`/api/chat?id=${messageId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
            }
        } catch {
            setError("Failed to delete message");
        }
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";
    for (const msg of messages) {
        const msgDate = formatDate(msg.createdAt);
        if (msgDate !== currentDate) {
            currentDate = msgDate;
            groupedMessages.push({ date: msgDate, messages: [msg] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(msg);
        }
    }

    const canDelete = currentUserRole === "ADMIN" || currentUserRole === "MODERATOR";

    if (loading) {
        return (
            <div className="discord-chat">
                <div className="chat-loading">
                    <Loader2 size={32} className="spin" />
                </div>
                <style jsx>{`
                    .discord-chat {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        background: var(--black);
                    }
                    .chat-loading {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
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
        );
    }

    return (
        <div className="discord-chat">
            {/* Channel Header */}
            <div className="channel-header-bar">
                <div className="channel-name">
                    <Hash size={20} />
                    <span>community</span>
                </div>
                <div className="channel-meta">
                    {slowModeActive && (
                        <div className="slow-mode">
                            <AlertCircle size={14} />
                            <span>Slow Mode</span>
                        </div>
                    )}
                    <div className="member-count">
                        <Users size={14} />
                        <span>{activeUsers} online</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="welcome-message">
                        <div className="welcome-icon">
                            <Hash size={48} />
                        </div>
                        <h3>Welcome to #community!</h3>
                        <p>This is the start of the community chat. Messages auto-delete after 2 days.</p>
                    </div>
                ) : (
                    groupedMessages.map((group) => (
                        <div key={group.date}>
                            <div className="date-divider">
                                <span>{group.date}</span>
                            </div>
                            {group.messages.map((msg, index) => {
                                const prevMsg = index > 0 ? group.messages[index - 1] : null;
                                const isGrouped = prevMsg &&
                                    prevMsg.user.id === msg.user.id &&
                                    (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 300000;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`message ${isGrouped ? "grouped" : ""} ${msg.user.id === currentUserId ? "own" : ""}`}
                                    >
                                        {!isGrouped && (
                                            <div className="message-avatar">
                                                {msg.user.avatarUrl ? (
                                                    <img src={msg.user.avatarUrl} alt={msg.user.username} />
                                                ) : (
                                                    <div className="avatar-fallback">
                                                        {msg.user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="message-body">
                                            {!isGrouped && (
                                                <div className="message-header">
                                                    <span className={`username ${msg.user.role.toLowerCase()}`}>
                                                        {msg.user.username}
                                                    </span>
                                                    {msg.user.role === "ADMIN" && (
                                                        <span className="role-tag admin">
                                                            <Shield size={10} /> ADMIN
                                                        </span>
                                                    )}
                                                    {msg.user.role === "MODERATOR" && (
                                                        <span className="role-tag mod">
                                                            <Wrench size={10} /> MOD
                                                        </span>
                                                    )}
                                                    <span className="timestamp">{formatTime(msg.createdAt)}</span>
                                                </div>
                                            )}
                                            <div className="message-content">
                                                <p>{msg.content}</p>
                                                {canDelete && (
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => handleDelete(msg.id)}
                                                        title="Delete message"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
                <div className="error-bar">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="input-bar">
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder={cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s...` : "Message #community"}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        maxLength={500}
                        disabled={sending || cooldownRemaining > 0}
                    />
                    <span className="char-count">{newMessage.length}/500</span>
                </div>
                <button type="submit" disabled={!newMessage.trim() || sending || cooldownRemaining > 0}>
                    {sending ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
                </button>
            </form>

            <style jsx>{`
                .discord-chat {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: var(--black);
                }

                .channel-header-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: var(--black-card);
                    border-bottom: 1px solid var(--black-border);
                    flex-shrink: 0;
                }

                .channel-name {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: var(--font-heading);
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .channel-name :global(svg) {
                    color: var(--text-muted);
                }

                .channel-meta {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .slow-mode {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    background: rgba(250, 204, 21, 0.15);
                    border-radius: 4px;
                    font-size: 11px;
                    color: var(--yellow);
                }

                .member-count {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--text-muted);
                }

                .messages-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }

                .welcome-message {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    gap: 12px;
                }

                .welcome-icon {
                    width: 72px;
                    height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(250, 204, 21, 0.1);
                    border-radius: 50%;
                    color: var(--yellow);
                }

                .welcome-message h3 {
                    font-family: var(--font-heading);
                    font-size: 1.5rem;
                    color: var(--text-primary);
                    margin: 0;
                }

                .welcome-message p {
                    color: var(--text-muted);
                    font-size: 14px;
                    margin: 0;
                }

                .date-divider {
                    display: flex;
                    align-items: center;
                    margin: 24px 0 16px;
                }

                .date-divider::before,
                .date-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: var(--black-border);
                }

                .date-divider span {
                    padding: 0 16px;
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .message {
                    display: flex;
                    gap: 16px;
                    padding: 4px 0;
                    margin-top: 16px;
                }

                .message.grouped {
                    margin-top: 0;
                    padding-left: 56px;
                }

                .message:hover {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 4px;
                }

                .message-avatar img {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .avatar-fallback {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--yellow) 0%, var(--yellow-dark) 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-heading);
                    font-weight: 700;
                    font-size: 16px;
                    color: var(--black);
                }

                .message-body {
                    flex: 1;
                    min-width: 0;
                }

                .message-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .username {
                    font-family: var(--font-heading);
                    font-weight: 600;
                    font-size: 14px;
                }

                .username.user {
                    color: var(--text-primary);
                }

                .username.admin {
                    color: var(--yellow);
                }

                .username.moderator {
                    color: var(--yellow-light);
                }

                .role-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }

                .role-tag.admin {
                    background: var(--gradient-yellow);
                    color: var(--black);
                }

                .role-tag.mod {
                    background: rgba(250, 204, 21, 0.2);
                    color: var(--yellow);
                }

                .timestamp {
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .message-content {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }

                .message-content p {
                    margin: 0;
                    font-size: 14px;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    word-break: break-word;
                }

                .delete-btn {
                    opacity: 0;
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }

                .message:hover .delete-btn {
                    opacity: 1;
                }

                .delete-btn:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }

                .error-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    font-size: 13px;
                }

                .input-bar {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    background: var(--black-card);
                    border-top: 1px solid var(--black-border);
                    flex-shrink: 0;
                }

                .input-wrapper {
                    flex: 1;
                    position: relative;
                }

                .input-wrapper input {
                    width: 100%;
                    padding: 14px 60px 14px 16px;
                    background: var(--black-lighter);
                    border: 1px solid var(--black-border);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-family: var(--font-body);
                    font-size: 14px;
                    transition: border-color 0.2s;
                }

                .input-wrapper input:focus {
                    outline: none;
                    border-color: var(--yellow);
                }

                .input-wrapper input:disabled {
                    opacity: 0.5;
                }

                .input-wrapper input::placeholder {
                    color: var(--text-muted);
                }

                .char-count {
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 10px;
                    color: var(--text-muted);
                }

                .input-bar button {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--gradient-yellow);
                    border: none;
                    border-radius: 8px;
                    color: var(--black);
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .input-bar button:hover:not(:disabled) {
                    box-shadow: 0 0 20px rgba(250, 204, 21, 0.3);
                    transform: scale(1.05);
                }

                .input-bar button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
