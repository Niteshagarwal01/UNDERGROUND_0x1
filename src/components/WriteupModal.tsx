"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Lock, BookOpen, ExternalLink, Copy, Check } from "lucide-react";

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

interface WriteupData {
    hasWriteup: boolean;
    writeup: string | null;
    writeupUrl: string | null;
}

function getDifficultyStyle(difficulty: string) {
    switch (difficulty) {
        case "GOD_LEVEL":
            return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", label: "God Level" };
        case "HARD":
            return { bg: "rgba(249, 115, 22, 0.15)", color: "#f97316", label: "Hard" };
        default:
            return { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e", label: "Medium" };
    }
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [writeupData, setWriteupData] = useState<WriteupData | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && isSolved) {
            fetchWriteup();
        }
    }, [isOpen, isSolved, challengeSlug]);

    const fetchWriteup = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/challenges/${challengeSlug}/writeup`);
            const json = await res.json();
            if (json.success) {
                setWriteupData(json);
            } else {
                setError(json.message || "Failed to load writeup");
            }
        } catch {
            setError("Failed to load writeup");
        } finally {
            setLoading(false);
        }
    };

    const copyWriteup = () => {
        if (writeupData?.writeup) {
            navigator.clipboard.writeText(writeupData.writeup);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    const diffStyle = getDifficultyStyle(difficulty);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content writeup-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="writeup-header-info">
                        <h2 className="modal-title">
                            <BookOpen size={20} className="text-yellow" />
                            Challenge Write-up
                        </h2>
                        <div className="writeup-meta">
                            <span className="writeup-category">{categoryName}</span>
                            <span
                                className="writeup-difficulty"
                                style={{ background: diffStyle.bg, color: diffStyle.color }}
                            >
                                {diffStyle.label}
                            </span>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="writeup-challenge-title">{challengeTitle}</div>

                <div className="modal-body">
                    {!isSolved ? (
                        <div className="writeup-locked">
                            <div className="writeup-locked-icon">
                                <Lock size={48} />
                            </div>
                            <h3>Write-up Locked</h3>
                            <p>Solve this challenge to unlock the official write-up.</p>
                        </div>
                    ) : loading ? (
                        <div className="writeup-loading">
                            <Loader2 size={32} className="spinner text-yellow" />
                            <p>Loading write-up...</p>
                        </div>
                    ) : error ? (
                        <div className="writeup-error">
                            <p>{error}</p>
                            <button className="btn btn-secondary" onClick={fetchWriteup}>
                                Try Again
                            </button>
                        </div>
                    ) : writeupData && !writeupData.hasWriteup ? (
                        <div className="writeup-empty">
                            <BookOpen size={48} style={{ color: "var(--text-muted)" }} />
                            <h3>No Write-up Available</h3>
                            <p>A write-up hasn&apos;t been published for this challenge yet.</p>
                        </div>
                    ) : writeupData ? (
                        <div className="writeup-content">
                            {writeupData.writeup && (
                                <div className="writeup-markdown">
                                    <div className="writeup-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={copyWriteup}>
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                    <pre className="writeup-text">{writeupData.writeup}</pre>
                                </div>
                            )}
                            {writeupData.writeupUrl && (
                                <div className="writeup-external">
                                    <a
                                        href={writeupData.writeupUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                    >
                                        <ExternalLink size={16} />
                                        View Full Write-up
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                <style jsx>{`
                    .writeup-modal {
                        max-width: 700px;
                        max-height: 80vh;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .writeup-header-info {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .modal-title {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin: 0;
                    }
                    
                    .writeup-meta {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .writeup-category {
                        font-size: 12px;
                        color: var(--text-muted);
                    }
                    
                    .writeup-difficulty {
                        font-size: 11px;
                        font-weight: 600;
                        padding: 2px 8px;
                        border-radius: 4px;
                    }
                    
                    .writeup-challenge-title {
                        font-size: 1.25rem;
                        font-weight: 600;
                        padding: 16px 24px;
                        background: var(--black-lighter);
                        border-bottom: 1px solid var(--black-border);
                        color: var(--yellow);
                    }
                    
                    .modal-body {
                        overflow-y: auto;
                        flex: 1;
                    }
                    
                    .writeup-locked,
                    .writeup-loading,
                    .writeup-error,
                    .writeup-empty {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 60px 20px;
                        gap: 16px;
                    }
                    
                    .writeup-locked-icon {
                        width: 80px;
                        height: 80px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(250, 204, 21, 0.1);
                        border-radius: 50%;
                        color: var(--yellow);
                    }
                    
                    .writeup-locked h3,
                    .writeup-empty h3 {
                        margin: 0;
                        font-size: 1.1rem;
                    }
                    
                    .writeup-locked p,
                    .writeup-empty p,
                    .writeup-loading p {
                        margin: 0;
                        color: var(--text-muted);
                        font-size: 14px;
                    }
                    
                    .writeup-content {
                        padding: 0;
                    }
                    
                    .writeup-markdown {
                        position: relative;
                    }
                    
                    .writeup-actions {
                        position: absolute;
                        top: 12px;
                        right: 12px;
                    }
                    
                    .writeup-text {
                        margin: 0;
                        padding: 24px;
                        background: var(--black-lighter);
                        white-space: pre-wrap;
                        word-break: break-word;
                        font-family: var(--font-body);
                        font-size: 14px;
                        line-height: 1.7;
                        color: var(--text);
                        max-height: 400px;
                        overflow-y: auto;
                    }
                    
                    .writeup-external {
                        padding: 24px;
                        border-top: 1px solid var(--black-border);
                        text-align: center;
                    }
                    
                    .writeup-error {
                        color: #ef4444;
                    }
                    
                    @media (max-width: 600px) {
                        .writeup-modal {
                            max-height: 90vh;
                        }
                        
                        .writeup-challenge-title {
                            font-size: 1.1rem;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
