"use client";

import { useState, useEffect } from "react";
import { X, Download, Copy, Check, Share2, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";

interface ShareStatsModalProps {
    teamId: string;
    teamName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareStatsModal({ teamId, teamName, isOpen, onClose }: ShareStatsModalProps) {
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Reset states when modal opens
    useEffect(() => {
        if (isOpen) {
            setImageLoading(true);
            setImageError(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const cardUrl = `/api/export/team-card?teamId=${encodeURIComponent(teamId)}&t=${Date.now()}`;
    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/team/${teamId}`
        : "";

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const response = await fetch(cardUrl);
            if (!response.ok) throw new Error("Failed to fetch");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${teamName.replace(/[^a-zA-Z0-9]/g, "_")}_stats.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download:", error);
            alert("Failed to download image. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Share2 size={20} className="text-yellow" />
                        Share Team Stats
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Preview */}
                    <div className="share-preview">
                        <div className="share-preview-label">
                            <ImageIcon size={14} />
                            Stats Card Preview
                        </div>
                        <div className="share-preview-image">
                            {imageLoading && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '60px',
                                    color: 'var(--text-muted)'
                                }}>
                                    <Loader2 size={32} className="spinner" />
                                </div>
                            )}
                            {imageError ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px',
                                    color: 'var(--text-muted)',
                                    gap: '12px'
                                }}>
                                    <AlertCircle size={32} />
                                    <span>Failed to load preview</span>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => {
                                            setImageLoading(true);
                                            setImageError(false);
                                        }}
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <img
                                    key={cardUrl}
                                    src={cardUrl}
                                    alt={`${teamName} Stats Card`}
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                        borderRadius: "8px",
                                        border: "1px solid var(--black-border)",
                                        display: imageLoading ? 'none' : 'block'
                                    }}
                                    onLoad={() => setImageLoading(false)}
                                    onError={() => {
                                        setImageLoading(false);
                                        setImageError(true);
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="share-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleDownload}
                            disabled={downloading}
                            style={{ flex: 1 }}
                        >
                            {downloading ? (
                                <Loader2 size={18} className="spinner" />
                            ) : (
                                <Download size={18} />
                            )}
                            Download PNG
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleCopyLink}
                            style={{ flex: 1 }}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? "Copied!" : "Copy Team Link"}
                        </button>
                    </div>

                    {/* Share Link */}
                    <div className="share-link-box">
                        <div className="share-link-label">Team Profile URL</div>
                        <div className="share-link-url">
                            <code>{shareUrl}</code>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .share-modal {
                        max-width: 600px;
                    }
                    
                    .modal-title {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .share-preview {
                        margin-bottom: 24px;
                    }
                    
                    .share-preview-label {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 12px;
                        color: var(--text-muted);
                        margin-bottom: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    
                    .share-preview-image {
                        background: var(--black-lighter);
                        border-radius: 12px;
                        padding: 12px;
                        border: 1px solid var(--black-border);
                        min-height: 120px;
                    }
                    
                    .share-actions {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 24px;
                    }
                    
                    .share-link-box {
                        background: var(--black-lighter);
                        border: 1px solid var(--black-border);
                        border-radius: 8px;
                        padding: 16px;
                    }
                    
                    .share-link-label {
                        font-size: 12px;
                        color: var(--text-muted);
                        margin-bottom: 8px;
                    }
                    
                    .share-link-url {
                        background: var(--black);
                        padding: 12px;
                        border-radius: 6px;
                        overflow-x: auto;
                    }
                    
                    .share-link-url code {
                        font-size: 13px;
                        color: var(--yellow);
                        word-break: break-all;
                    }
                    
                    @media (max-width: 500px) {
                        .share-actions {
                            flex-direction: column;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
