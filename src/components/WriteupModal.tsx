"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Loader2, BookOpen, ExternalLink, Eye, EyeOff, Edit, Save, User as UserIcon, FileText, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUser } from "@clerk/nextjs";

interface WriteupModalProps {
    challengeId: string;
    challengeTitle: string;
    challengeSlug: string;
    categoryName: string;
    difficulty: string;
    isSolved: boolean;
    isOpen: boolean;
    onClose: () => void;
}

interface Writeup {
    id: string;
    title: string | null;
    content: string;
    isPublic: boolean;
    createdAt: string;
    user: {
        username: string;
        avatarUrl: string | null;
        role: "USER" | "ADMIN" | "MODERATOR";
    };
}

interface OfficialWriteupData {
    hasWriteup: boolean;
    writeup: string | null;
    writeupUrl: string | null;
}

function getDifficultyStyle(difficulty: string) {
    switch (difficulty) {
        case "GOD_LEVEL":
            return { bg: "rgba(250, 204, 21, 0.2)", border: "rgba(250, 204, 21, 0.5)", label: "God Level" };
        case "HARD":
            return { bg: "rgba(250, 204, 21, 0.15)", border: "rgba(250, 204, 21, 0.4)", label: "Hard" };
        default:
            return { bg: "rgba(250, 204, 21, 0.1)", border: "rgba(250, 204, 21, 0.3)", label: "Medium" };
    }
}

// Styled MarkdownView component
function MarkdownView({ content }: { content: string }) {
    return (
        <div style={{
            color: '#e5e5e5',
            lineHeight: '1.8',
            fontSize: '14px',
        }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--yellow)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>{children}</h1>,
                    h2: ({ children }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>{children}</h2>,
                    h3: ({ children }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginTop: '20px', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>{children}</h3>,
                    p: ({ children }) => <p style={{ marginBottom: '12px', color: '#a3a3a3' }}>{children}</p>,
                    code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                            <code style={{
                                background: 'rgba(250, 204, 21, 0.1)',
                                color: 'var(--yellow)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontFamily: 'var(--font-mono)',
                            }}>{children}</code>
                        ) : (
                            <code style={{
                                display: 'block',
                                background: '#0d0d0d',
                                border: '1px solid #1a1a1a',
                                borderRadius: '8px',
                                padding: '16px',
                                fontSize: '13px',
                                fontFamily: 'var(--font-mono)',
                                overflowX: 'auto',
                                color: '#e5e5e5',
                                marginBottom: '16px',
                            }}>{children}</code>
                        );
                    },
                    pre: ({ children }) => <pre style={{ margin: 0 }}>{children}</pre>,
                    ul: ({ children }) => <ul style={{ marginBottom: '12px', paddingLeft: '24px', listStyleType: 'disc' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ marginBottom: '12px', paddingLeft: '24px', listStyleType: 'decimal' }}>{children}</ol>,
                    li: ({ children }) => <li style={{ marginBottom: '4px', color: '#a3a3a3' }}>{children}</li>,
                    a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--yellow)', textDecoration: 'underline' }}>{children}</a>,
                    blockquote: ({ children }) => (
                        <blockquote style={{
                            borderLeft: '3px solid var(--yellow)',
                            paddingLeft: '16px',
                            marginLeft: 0,
                            marginBottom: '16px',
                            color: '#a3a3a3',
                            fontStyle: 'italic',
                        }}>{children}</blockquote>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default function WriteupModal({
    challengeId,
    challengeTitle,
    challengeSlug,
    categoryName,
    difficulty,
    isSolved,
    isOpen,
    onClose
}: WriteupModalProps) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<"official" | "community" | "mine">("official");

    // Data States
    const [officialData, setOfficialData] = useState<OfficialWriteupData | null>(null);
    const [userWriteups, setUserWriteups] = useState<Writeup[]>([]);
    const [myWriteup, setMyWriteup] = useState<Writeup | null>(null);
    const [expandedWriteupId, setExpandedWriteupId] = useState<string | null>(null);

    // Loading States
    const [loadingOfficial, setLoadingOfficial] = useState(false);
    const [loadingCommunity, setLoadingCommunity] = useState(false);

    // Editing State
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editIsPublic, setEditIsPublic] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchedSlugRef = useRef<string | null>(null);

    const fetchOfficial = useCallback(async () => {
        if (!challengeSlug) return;
        setLoadingOfficial(true);
        try {
            const res = await fetch(`/api/challenges/${challengeSlug}/writeup`);
            const json = await res.json();
            if (json.success) {
                setOfficialData(json);
                if (!json.hasWriteup) setActiveTab("community");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOfficial(false);
        }
    }, [challengeSlug]);

    const fetchCommunity = useCallback(async (username?: string) => {
        if (!challengeSlug) return;
        setLoadingCommunity(true);
        try {
            const res = await fetch(`/api/challenges/${challengeSlug}/writeups`);
            const json = await res.json();
            if (json.success) {
                // Filter to only show PUBLIC writeups from OTHER users in community tab
                const allWriteups = json.writeups || [];
                const publicWriteups = allWriteups.filter((w: Writeup) => w.isPublic && w.user.username !== username);
                setUserWriteups(publicWriteups);
                if (username) {
                    const mine = json.writeups?.find((w: Writeup) => w.user.username === username);
                    if (mine) {
                        setMyWriteup(mine);
                        setEditContent(mine.content);
                        setEditTitle(mine.title || "");
                        setEditIsPublic(mine.isPublic);
                        setIsEditing(false);
                    } else {
                        setMyWriteup(null);
                        setEditContent("");
                        setEditTitle("");
                        setEditIsPublic(false);
                        setIsEditing(true);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCommunity(false);
        }
    }, [challengeSlug]);

    useEffect(() => {
        if (isOpen && isSolved && challengeSlug && fetchedSlugRef.current !== challengeSlug) {
            fetchedSlugRef.current = challengeSlug;
            fetchOfficial();
            fetchCommunity(user?.username || undefined);
        }
    }, [isOpen, isSolved, challengeSlug, fetchOfficial, fetchCommunity, user?.username]);

    useEffect(() => {
        if (!isOpen) {
            fetchedSlugRef.current = null;
            setOfficialData(null);
            setUserWriteups([]);
            setMyWriteup(null);
            setActiveTab("official");
            setIsEditing(false);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!editContent.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/challenges/${challengeSlug}/writeups`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: editTitle, content: editContent, isPublic: editIsPublic })
            });
            const json = await res.json();
            if (json.success && json.writeup) {
                const saved: Writeup = {
                    ...json.writeup,
                    user: { username: user?.username || "Me", avatarUrl: user?.imageUrl || null, role: "USER" }
                };
                setMyWriteup(saved);
                setIsEditing(false);
                if (editIsPublic) {
                    setUserWriteups(prev => [saved, ...prev.filter(w => w.user.username !== user?.username)]);
                } else {
                    setUserWriteups(prev => prev.filter(w => w.user.username !== user?.username));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const diffStyle = getDifficultyStyle(difficulty);

    const tabStyle = (isActive: boolean) => ({
        padding: '14px 20px',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'var(--font-heading)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        background: 'none',
        border: 'none',
        borderBottom: isActive ? '2px solid var(--yellow)' : '2px solid transparent',
        color: isActive ? 'var(--yellow)' : '#666',
        cursor: 'pointer',
        transition: 'all 0.2s',
    });

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(8px)',
                zIndex: 1050,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#0a0a0a',
                    border: '1px solid var(--yellow)',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '900px',
                    height: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 0 60px rgba(250, 204, 21, 0.1)',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 28px',
                    borderBottom: '1px solid #1a1a1a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(250, 204, 21, 0.1)',
                            border: '1px solid rgba(250, 204, 21, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--yellow)',
                        }}>
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'white',
                                fontFamily: 'var(--font-heading)',
                                marginBottom: '6px',
                            }}>
                                {challengeTitle}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: '#666', fontSize: '13px' }}>{categoryName}</span>
                                <span style={{
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    color: 'var(--yellow)',
                                    background: diffStyle.bg,
                                    border: `1px solid ${diffStyle.border}`,
                                    borderRadius: '4px',
                                    fontFamily: 'var(--font-heading)',
                                }}>
                                    {diffStyle.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid #1a1a1a',
                            borderRadius: '8px',
                            padding: '8px',
                            color: '#666',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#333'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#1a1a1a'; }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #1a1a1a',
                    paddingLeft: '28px',
                }}>
                    {officialData?.hasWriteup && (
                        <button style={tabStyle(activeTab === 'official')} onClick={() => setActiveTab('official')}>
                            Official
                        </button>
                    )}
                    <button style={tabStyle(activeTab === 'community')} onClick={() => setActiveTab('community')}>
                        Community ({userWriteups.length})
                    </button>
                    <button style={tabStyle(activeTab === 'mine')} onClick={() => setActiveTab('mine')}>
                        My Writeup
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '28px',
                }}>
                    {/* Official Tab */}
                    {activeTab === 'official' && (
                        <div>
                            {loadingOfficial ? (
                                <div style={{ textAlign: 'center', padding: '60px' }}>
                                    <Loader2 size={32} style={{ color: 'var(--yellow)', animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : officialData?.writeup ? (
                                <div style={{
                                    background: '#0d0d0d',
                                    border: '1px solid #1a1a1a',
                                    borderRadius: '12px',
                                    padding: '28px',
                                }}>
                                    {officialData.writeupUrl && (
                                        <a
                                            href={officialData.writeupUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 16px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                borderRadius: '8px',
                                                color: '#3b82f6',
                                                fontSize: '13px',
                                                textDecoration: 'none',
                                                marginBottom: '20px',
                                            }}
                                        >
                                            <ExternalLink size={14} /> Open External Resource
                                        </a>
                                    )}
                                    <MarkdownView content={officialData.writeup} />
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                                    <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                    <p>No official writeup available yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Community Tab */}
                    {activeTab === 'community' && (
                        <div>
                            {loadingCommunity ? (
                                <div style={{ textAlign: 'center', padding: '60px' }}>
                                    <Loader2 size={32} style={{ color: 'var(--yellow)', animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : userWriteups.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                                    <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                    <p>No community writeups yet.</p>
                                    <p style={{ fontSize: '13px', marginTop: '8px' }}>Be the first to share your solution!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {userWriteups.map(w => {
                                        const isExpanded = expandedWriteupId === w.id;
                                        return (
                                            <div
                                                key={w.id}
                                                style={{
                                                    background: '#0d0d0d',
                                                    border: isExpanded ? '1px solid var(--yellow)' : '1px solid #1a1a1a',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    transition: 'border-color 0.2s',
                                                }}
                                            >
                                                {/* Clickable Header */}
                                                <div
                                                    onClick={() => setExpandedWriteupId(isExpanded ? null : w.id)}
                                                    style={{
                                                        padding: '20px',
                                                        cursor: 'pointer',
                                                        background: isExpanded ? 'rgba(250, 204, 21, 0.03)' : 'transparent',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {w.user.avatarUrl ? (
                                                                <img src={w.user.avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                                            ) : (
                                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <UserIcon size={14} style={{ color: '#666' }} />
                                                                </div>
                                                            )}
                                                            <span style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>{w.user.username}</span>
                                                            {w.user.role !== 'USER' && (
                                                                <span style={{
                                                                    padding: '2px 8px',
                                                                    fontSize: '10px',
                                                                    fontWeight: 600,
                                                                    textTransform: 'uppercase',
                                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                                    color: '#ef4444',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                                                }}>
                                                                    {w.user.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ fontSize: '12px', color: '#666' }}>
                                                                {new Date(w.createdAt).toLocaleDateString()}
                                                            </span>
                                                            {isExpanded ? (
                                                                <ChevronUp size={18} style={{ color: 'var(--yellow)' }} />
                                                            ) : (
                                                                <ChevronDown size={18} style={{ color: '#666' }} />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <h3 style={{
                                                        fontSize: '1.1rem',
                                                        fontWeight: 600,
                                                        color: 'var(--yellow)',
                                                        fontFamily: 'var(--font-heading)',
                                                        marginBottom: isExpanded ? 0 : '8px',
                                                    }}>
                                                        {w.title || "Untitled Writeup"}
                                                    </h3>
                                                    {/* Preview when collapsed */}
                                                    {!isExpanded && (
                                                        <p style={{
                                                            color: '#666',
                                                            fontSize: '13px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            marginTop: '4px',
                                                        }}>
                                                            {w.content.slice(0, 150)}...
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Expanded Content */}
                                                {isExpanded && (
                                                    <div style={{
                                                        padding: '0 20px 20px',
                                                        borderTop: '1px solid #1a1a1a',
                                                        marginTop: '-1px',
                                                    }}>
                                                        <div style={{ paddingTop: '20px' }}>
                                                            <MarkdownView content={w.content} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Writeup Tab */}
                    {activeTab === 'mine' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {loadingCommunity ? (
                                <div style={{ textAlign: 'center', padding: '60px' }}>
                                    <Loader2 size={32} style={{ color: 'var(--yellow)', animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : !isEditing && myWriteup ? (
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '20px',
                                        padding: '16px 20px',
                                        background: '#0d0d0d',
                                        border: '1px solid #1a1a1a',
                                        borderRadius: '10px',
                                    }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '6px' }}>
                                                {myWriteup.title || "Untitled"}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 8px',
                                                    fontSize: '11px',
                                                    borderRadius: '4px',
                                                    background: myWriteup.isPublic ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: myWriteup.isPublic ? '#22c55e' : '#ef4444',
                                                    border: `1px solid ${myWriteup.isPublic ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                                }}>
                                                    {myWriteup.isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
                                                    {myWriteup.isPublic ? "Public" : "Private"}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#666' }}>
                                                    Updated {new Date(myWriteup.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 16px',
                                                background: 'var(--yellow)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'black',
                                                fontWeight: 700,
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                fontFamily: 'var(--font-heading)',
                                            }}
                                        >
                                            <Edit size={14} /> Edit
                                        </button>
                                    </div>
                                    <div style={{
                                        background: '#0d0d0d',
                                        border: '1px solid #1a1a1a',
                                        borderRadius: '12px',
                                        padding: '28px',
                                    }}>
                                        <MarkdownView content={myWriteup.content} />
                                    </div>
                                </div>
                            ) : (
                                /* Editor Mode */
                                <>
                                    {/* Title and Public toggle row */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexShrink: 0 }}>
                                        <input
                                            type="text"
                                            placeholder="Writeup Title"
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '12px 16px',
                                                background: '#0d0d0d',
                                                border: '1px solid #1a1a1a',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none',
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setEditIsPublic(!editIsPublic)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '12px 16px',
                                                background: editIsPublic ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                border: `1px solid ${editIsPublic ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                borderRadius: '8px',
                                                color: editIsPublic ? '#22c55e' : '#ef4444',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {editIsPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                                            {editIsPublic ? "Public" : "Private"}
                                        </button>
                                    </div>

                                    {/* Textarea - takes remaining space */}
                                    <textarea
                                        placeholder="Write your solution here... (Markdown supported)"
                                        value={editContent}
                                        onChange={e => setEditContent(e.target.value)}
                                        style={{
                                            flex: 1,
                                            minHeight: '200px',
                                            padding: '16px',
                                            background: '#0d0d0d',
                                            border: '1px solid #1a1a1a',
                                            borderRadius: '8px',
                                            color: '#e5e5e5',
                                            fontSize: '14px',
                                            fontFamily: 'var(--font-mono)',
                                            resize: 'none',
                                            outline: 'none',
                                            lineHeight: '1.6',
                                            marginBottom: '16px',
                                        }}
                                    />

                                    {/* Action buttons - fixed at bottom */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '12px',
                                        flexShrink: 0,
                                        paddingTop: '8px',
                                        borderTop: '1px solid #1a1a1a',
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (myWriteup) {
                                                    setIsEditing(false);
                                                    setEditContent(myWriteup.content);
                                                    setEditTitle(myWriteup.title || "");
                                                    setEditIsPublic(myWriteup.isPublic);
                                                } else {
                                                    setEditContent("");
                                                    setEditTitle("");
                                                }
                                            }}
                                            style={{
                                                padding: '12px 24px',
                                                background: 'transparent',
                                                border: '1px solid #333',
                                                borderRadius: '8px',
                                                color: '#888',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                console.log('Save clicked', { editContent, editTitle, editIsPublic });
                                                handleSave();
                                            }}
                                            disabled={isSaving || !editContent.trim()}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '12px 28px',
                                                background: editContent.trim() ? 'var(--yellow)' : '#333',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: editContent.trim() ? 'black' : '#666',
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                cursor: editContent.trim() ? 'pointer' : 'not-allowed',
                                                fontFamily: 'var(--font-heading)',
                                                opacity: isSaving ? 0.7 : 1,
                                            }}
                                        >
                                            {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                            {isSaving ? 'Saving...' : 'Save Writeup'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
