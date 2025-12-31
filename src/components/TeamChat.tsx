"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Crown, AlertCircle } from "lucide-react";

interface TeamChatMessage {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
        avatarUrl: string | null;
        isTeamLeader: boolean;
    };
}

interface TeamChatProps {
    teamId: string;
    currentUserId?: string;
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
    return date.toLocaleDateString();
}

export default function TeamChat({ teamId, currentUserId }: TeamChatProps) {
    const [messages, setMessages] = useState<TeamChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch messages with retry logic
    const fetchMessages = async (isInitialLoad = false) => {
        try {
            const res = await fetch(`/api/teams/${teamId}/chat?limit=50`);

            // Handle 404 gracefully - team might still be loading
            if (res.status === 404) {
                if (!isInitialLoad) {
                    // Only show error after initial load completes
                    setError("Team chat not available");
                }
                return;
            }

            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
                setError(null); // Clear any previous errors on success
            } else if (!isInitialLoad) {
                // Only show errors after initial load
                setError(data.message);
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

    // Initial load and polling
    useEffect(() => {
        if (teamId) {
            // Initial fetch with grace period for auth
            const initialFetch = async () => {
                setLoading(true);
                setError(null);
                await fetchMessages(true);

                // Try again after a short delay if no messages (auth might be slow)
                setTimeout(() => fetchMessages(false), 1500);
            };

            initialFetch();

            // Polling with longer interval to reduce API calls
            const interval = setInterval(() => fetchMessages(false), 5000);
            return () => clearInterval(interval);
        }
    }, [teamId]);

    // Scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send message
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        setError(null);

        try {
            const res = await fetch(`/api/teams/${teamId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage.trim() })
            });
            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, data.message]);
                setNewMessage("");
            } else {
                setError(data.message);
            }
        } catch {
            setError("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: TeamChatMessage[] }[] = [];
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

    if (loading) {
        return (
            <div className="discord-chat">
                <div className="chat-loading">
                    <Loader2 size={32} className="spin" />
                    <span>Loading team chat...</span>
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
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 16px;
                        height: 100%;
                        min-height: 400px;
                    }
                    .chat-loading span {
                        color: var(--text-muted);
                        font-size: 14px;
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
            {/* Header */}
            <div className="channel-header-bar">
                <div className="channel-name">
                    <Crown size={20} />
                    <span>Team Chat</span>
                </div>
                <span className="channel-desc">Private team messages</span>
            </div>

            {/* Messages */}
            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="welcome-message">
                        <div className="welcome-icon">
                            <Crown size={48} />
                        </div>
                        <h3>Welcome to Team Chat!</h3>
                        <p>This is your private team space. Start the conversation!</p>
                    </div>
                ) : (
                    groupedMessages.map((group) => (
                        <div key={group.date}>
                            <div className="date-divider">
                                <span>{group.date}</span>
                            </div>
                            {group.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`message ${msg.user.id === currentUserId ? "own" : ""}`}
                                >
                                    <div className="message-avatar">
                                        {msg.user.avatarUrl ? (
                                            <img src={msg.user.avatarUrl} alt={msg.user.username} />
                                        ) : (
                                            <div className="avatar-fallback">
                                                {msg.user.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="message-body">
                                        <div className="message-header">
                                            <span className="username">{msg.user.username}</span>
                                            {msg.user.isTeamLeader && (
                                                <span className="leader-tag">
                                                    <Crown size={10} /> LEADER
                                                </span>
                                            )}
                                            <span className="timestamp">{formatTime(msg.createdAt)}</span>
                                        </div>
                                        <p className="message-content">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
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
                        placeholder="Message your team..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        maxLength={500}
                        disabled={sending}
                    />
                    <span className="char-count">{newMessage.length}/500</span>
                </div>
                <button type="submit" disabled={!newMessage.trim() || sending}>
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
                    gap: 16px;
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
                    color: var(--yellow);
                }

                .channel-desc {
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
                    padding: 8px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                }

                .message:hover {
                    background: rgba(255, 255, 255, 0.02);
                }

                .message.own {
                    background: rgba(250, 204, 21, 0.05);
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
                    color: var(--text-primary);
                }

                .leader-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 6px;
                    background: var(--gradient-yellow);
                    border-radius: 3px;
                    font-size: 9px;
                    font-weight: 700;
                    color: var(--black);
                    letter-spacing: 0.05em;
                }

                .timestamp {
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .message-content {
                    margin: 0;
                    font-size: 14px;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    word-break: break-word;
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
