"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface CreateChallengeModalProps {
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateChallengeModal({
    categories,
    onClose,
    onSuccess,
}: CreateChallengeModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        categoryId: categories[0]?.id || "",
        difficulty: "MEDIUM",
        points: "300",
        flag: "",
        resourceUrl: "",
        isActive: true,
        isHidden: false,
    });

    // Auto-generate slug from title
    useEffect(() => {
        const slug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        setFormData(prev => ({ ...prev, slug }));
    }, [formData.title]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/admin/challenges", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.message || "Failed to create challenge");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "24px",
            }}
            onClick={onClose}
        >
            <div
                className="card card-elevated"
                style={{
                    maxWidth: "600px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflow: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "24px",
                    }}
                >
                    <h2
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                        }}
                    >
                        Create New Challenge
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div
                        style={{
                            padding: "12px 16px",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "8px",
                            color: "#ef4444",
                            marginBottom: "24px",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Title */}
                        <div>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="Station Alpha Breach"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "var(--black-elevated)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                }}
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
                                Slug (auto-generated)
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                                placeholder="station-alpha-breach"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "var(--black-surface)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--text-muted)",
                                    fontSize: "14px",
                                }}
                            />
                        </div>

                        {/* Category & Difficulty Row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
                                    Category *
                                </label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        background: "#1a1a1a",
                                        border: "1px solid #333",
                                        borderRadius: "8px",
                                        color: "#fff",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                    }}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id} style={{ background: "#1a1a1a", color: "#fff" }}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
                                    Difficulty *
                                </label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => {
                                        const difficulty = e.target.value;
                                        const points = difficulty === "MEDIUM" ? "300" : difficulty === "HARD" ? "500" : "800";
                                        setFormData({ ...formData, difficulty, points });
                                    }}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        background: "#1a1a1a",
                                        border: "1px solid #333",
                                        borderRadius: "8px",
                                        color: "#fff",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                    }}
                                >
                                    <option value="MEDIUM" style={{ background: "#1a1a1a", color: "#fff" }}>Medium (300 pts)</option>
                                    <option value="HARD" style={{ background: "#1a1a1a", color: "#fff" }}>Hard (500 pts)</option>
                                    <option value="GOD_LEVEL" style={{ background: "#1a1a1a", color: "#fff" }}>God Level (800 pts)</option>
                                </select>
                            </div>
                        </div>

                        {/* Points */}
                        <div>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
                                Points *
                            </label>
                            <input
                                type="number"
                                value={formData.points}
                                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                                required
                                min="100"
                                max="1000"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "var(--black-elevated)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                }}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
                                Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                rows={4}
                                placeholder="Describe the challenge scenario..."
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "var(--black-elevated)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                    resize: "vertical",
                                }}
                            />
                        </div>

                        {/* Flag */}
                        <div>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
                                Flag * <span style={{ color: "var(--text-muted)" }}>(Format: UG0x1{"{"}_____{"}"}, 10-50 chars)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.flag}
                                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                                required
                                placeholder="UG0x1{example_flag_here}"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "var(--black-elevated)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--yellow)",
                                    fontSize: "14px",
                                    fontFamily: "monospace",
                                }}
                            />
                        </div>

                        {/* Resource URL */}
                        <div>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
                                Resource Link <span style={{ color: "var(--text-muted)" }}>(Optional - link to files/resources)</span>
                            </label>
                            <input
                                type="url"
                                value={formData.resourceUrl}
                                onChange={(e) => setFormData({ ...formData, resourceUrl: e.target.value })}
                                placeholder="https://drive.google.com/file/... or https://example.com/files.zip"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "var(--black-elevated)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                }}
                            />
                        </div>

                        {/* Active/Hidden toggles */}
                        <div style={{ display: "flex", gap: "24px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Active</span>
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isHidden}
                                    onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                                />
                                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Hidden</span>
                            </label>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: "12px", marginTop: "32px", justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="spinner" />
                                    Creating...
                                </>
                            ) : (
                                "Create Challenge"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
