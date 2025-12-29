"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, AlertCircle } from "lucide-react";

interface Challenge {
    id: string;
    title: string;
    slug: string;
    description: string;
    categoryId: string;
    difficulty: string;
    points: number;
    isActive: boolean;
    isHidden: boolean;
    writeup?: string | null;
    writeupUrl?: string | null;
    category?: {
        id: string;
        name: string;
    };
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface EditChallengeModalProps {
    challenge: Challenge | null;
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditChallengeModal({
    challenge,
    categories,
    onClose,
    onSuccess,
}: EditChallengeModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        categoryId: "",
        difficulty: "MEDIUM",
        points: 300,
        flag: "", // New flag (optional - leave empty to keep existing)
        driveUrl: "",
        linktreeUrl: "",
        writeup: "",
        writeupUrl: "",
        isActive: true,
        isHidden: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (challenge) {
            setFormData({
                title: challenge.title,
                slug: challenge.slug,
                description: challenge.description,
                categoryId: challenge.categoryId,
                difficulty: challenge.difficulty,
                points: challenge.points,
                flag: "", // Don't show existing flag for security
                driveUrl: (challenge as any).driveUrl || "",
                linktreeUrl: (challenge as any).linktreeUrl || "",
                writeup: challenge.writeup || "",
                writeupUrl: challenge.writeupUrl || "",
                isActive: challenge.isActive,
                isHidden: challenge.isHidden,
            });
            setError(null);
            setSuccess(false);
        }
    }, [challenge]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!challenge) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch(`/api/admin/challenges/${challenge.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    points: parseInt(formData.points.toString()),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to update challenge");
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!challenge) return;
        if (!confirm(`Are you sure you want to delete "${challenge.title}"? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/challenges/${challenge.id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to delete challenge");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!challenge) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}
            >
                {/* Close Button */}
                <button onClick={onClose} className="modal-close">
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="modal-header">
                    <h2 style={{ fontSize: "1.5rem", fontFamily: "var(--font-heading)" }}>
                        Edit Challenge
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "8px" }}>
                        Update challenge details and settings
                    </p>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        {/* Title */}
                        <div className="input-group">
                            <label className="input-label">Title *</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Slug */}
                        <div className="input-group">
                            <label className="input-label">Slug *</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.slug}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                                    })
                                }
                                required
                                disabled={loading}
                                pattern="[a-z0-9-]+"
                                title="Slug must be lowercase letters, numbers, and hyphens only"
                            />
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                                URL-friendly identifier (lowercase, hyphens only)
                            </p>
                        </div>

                        {/* Description */}
                        <div className="input-group">
                            <label className="input-label">Description *</label>
                            <textarea
                                className="input"
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Category */}
                        <div className="input-group">
                            <label className="input-label">Category *</label>
                            <select
                                className="input"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                required
                                disabled={loading}
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Difficulty & Points */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="input-group">
                                <label className="input-label">Difficulty *</label>
                                <select
                                    className="input"
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    required
                                    disabled={loading}
                                >
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                    <option value="GOD_LEVEL">God-Level</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Points *</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.points}
                                    onChange={(e) =>
                                        setFormData({ ...formData, points: parseInt(e.target.value) || 0 })
                                    }
                                    required
                                    min={0}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Flag (Optional - only update if provided) */}
                        <div className="input-group">
                            <label className="input-label">New Flag (Optional)</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.flag}
                                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                                placeholder="Leave empty to keep existing flag"
                                disabled={loading}
                            />
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                                Format: UG0x1{`{flag_content}`} (will be hashed automatically)
                            </p>
                        </div>

                        {/* Google Drive Link */}
                        <div className="input-group">
                            <label className="input-label">📁 Google Drive Link <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(For files)</span></label>
                            <input
                                type="url"
                                className="input"
                                value={formData.driveUrl || ""}
                                onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                                placeholder="https://drive.google.com/file/d/..."
                                disabled={loading}
                            />
                        </div>

                        {/* Linktree Link */}
                        <div className="input-group">
                            <label className="input-label">🔗 Linktree Link <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(For HTML pages)</span></label>
                            <input
                                type="url"
                                className="input"
                                value={formData.linktreeUrl || ""}
                                onChange={(e) => setFormData({ ...formData, linktreeUrl: e.target.value })}
                                placeholder="https://linktr.ee/..."
                                disabled={loading}
                            />
                        </div>

                        {/* Writeup URL */}
                        <div className="input-group">
                            <label className="input-label">Writeup Link <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional - External Link)</span></label>
                            <input
                                type="url"
                                className="input"
                                value={formData.writeupUrl}
                                onChange={(e) => setFormData({ ...formData, writeupUrl: e.target.value })}
                                placeholder="https://medium.com/@user/writeup..."
                                disabled={loading}
                            />
                        </div>

                        {/* Writeup Content */}
                        <div className="input-group">
                            <label className="input-label">Writeup Content <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Markdown supported)</span></label>
                            <textarea
                                className="input"
                                rows={6}
                                value={formData.writeup}
                                onChange={(e) => setFormData({ ...formData, writeup: e.target.value })}
                                placeholder="## Solution\n\n1. Analyze the pcap file...\n2. Extract the hidden data..."
                                disabled={loading}
                                style={{
                                    fontFamily: "monospace",
                                    fontSize: "13px"
                                }}
                            />
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                                Shown to users only after they solve the challenge.
                            </p>
                        </div>

                        {/* Status Toggles */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    fontSize: "14px",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    disabled={loading}
                                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                />
                                <span>Challenge is active</span>
                            </label>

                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    fontSize: "14px",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.isHidden}
                                    onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                                    disabled={loading}
                                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                />
                                <span>Hide challenge from public view</span>
                            </label>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div
                                className="alert alert-error"
                                style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}
                            >
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div
                                className="alert alert-success"
                                style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}
                            >
                                Challenge updated successfully!
                            </div>
                        )}

                        {/* Actions */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "12px",
                                marginTop: "32px",
                                paddingTop: "24px",
                                borderTop: "1px solid var(--black-border)",
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleDelete}
                                disabled={loading}
                                style={{
                                    background: "rgba(239, 68, 68, 0.1)",
                                    borderColor: "rgba(239, 68, 68, 0.3)",
                                    color: "#ef4444",
                                }}
                            >
                                Delete Challenge
                            </button>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

