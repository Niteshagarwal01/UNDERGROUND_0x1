"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    MessageSquare,
    Star,
    Send,
    Loader2,
    ArrowLeft,
    Bug,
    Lightbulb,
    Sparkles,
    Heart,
    MessageCircle,
    ChevronDown,
    Clock,
    CheckCircle,
    AlertCircle,
    History
} from "lucide-react";

interface PastFeedback {
    id: string;
    subject: string;
    message: string;
    rating: number;
    type: string;
    priority: string;
    status: string;
    adminResponse: string | null;
    createdAt: string;
    respondedAt: string | null;
}

const feedbackTypes = [
    { value: "BUG", label: "Bug Report", icon: Bug, color: "#ef4444" },
    { value: "FEATURE", label: "Feature Request", icon: Lightbulb, color: "#3b82f6" },
    { value: "SUGGESTION", label: "Suggestion", icon: Sparkles, color: "#8b5cf6" },
    { value: "GENERAL", label: "General", icon: MessageCircle, color: "#6b7280" },
    { value: "PRAISE", label: "Praise", icon: Heart, color: "#22c55e" },
];

const priorityLevels = [
    { value: "LOW", label: "Low", color: "#6b7280" },
    { value: "MEDIUM", label: "Medium", color: "#f59e0b" },
    { value: "HIGH", label: "High", color: "#f97316" },
    { value: "CRITICAL", label: "Critical", color: "#ef4444" },
];

const ratingLabels = ["Poor", "Fair", "Good", "Great", "Excellent"];

export default function FeedbackPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [pastFeedback, setPastFeedback] = useState<PastFeedback[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [formData, setFormData] = useState({
        subject: "",
        message: "",
        rating: 5,
        type: "GENERAL",
        priority: "MEDIUM",
    });

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await fetch("/api/feedback");
            const data = await response.json();
            if (data.success) {
                setPastFeedback(data.feedback || []);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (showHistory) {
            fetchHistory();
        }
    }, [showHistory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setFormData({ subject: "", message: "", rating: 5, type: "GENERAL", priority: "MEDIUM" });
            } else {
                setError(data.message || "Failed to submit feedback");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "NEW": return "#f97316";
            case "REVIEWED": return "var(--yellow)";
            case "RESOLVED": return "#22c55e";
            default: return "var(--text-muted)";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "NEW": return <AlertCircle size={14} />;
            case "REVIEWED": return <Clock size={14} />;
            case "RESOLVED": return <CheckCircle size={14} />;
            default: return null;
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
                <div
                    style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                        boxShadow: "0 0 40px rgba(34, 197, 94, 0.2)",
                        animation: "pulse 2s infinite",
                    }}
                >
                    <CheckCircle size={48} style={{ color: "#22c55e" }} />
                </div>
                <h1
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "16px",
                    }}
                >
                    Thank You!
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "32px", lineHeight: 1.6 }}>
                    Your feedback has been submitted successfully. We appreciate you taking the time to help us improve UNDERGROUND_0x1!
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setSuccess(false)}
                    >
                        Submit More Feedback
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => { setSuccess(false); setShowHistory(true); }}
                    >
                        <History size={18} />
                        View My Feedback
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 24px" }}>
            {/* Back Button */}
            <Link
                href="/"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    fontSize: "14px",
                    marginBottom: "24px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid transparent",
                    transition: "all 0.2s"
                }}
                className="btn-secondary"
            >
                <ArrowLeft size={16} />
                Back to Home
            </Link>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <div
                    style={{
                        width: "70px",
                        height: "70px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(250, 204, 21, 0.05))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                        boxShadow: "0 0 30px rgba(250, 204, 21, 0.1)",
                    }}
                >
                    <MessageSquare size={32} style={{ color: "var(--yellow)" }} />
                </div>
                <h1
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "2.25rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "12px",
                    }}
                >
                    Share Your Feedback
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                    Help us improve UNDERGROUND_0x1. Your feedback matters!
                </p>
            </div>

            {/* Tab Toggle */}
            <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "24px",
                background: "var(--black-elevated)",
                padding: "4px",
                borderRadius: "12px",
                border: "1px solid var(--black-border)",
            }}>
                <button
                    onClick={() => setShowHistory(false)}
                    style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: !showHistory ? "var(--yellow)" : "transparent",
                        color: !showHistory ? "var(--black)" : "var(--text-secondary)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                    }}
                >
                    <Send size={16} />
                    New Feedback
                </button>
                <button
                    onClick={() => setShowHistory(true)}
                    style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: showHistory ? "var(--yellow)" : "transparent",
                        color: showHistory ? "var(--black)" : "var(--text-secondary)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                    }}
                >
                    <History size={16} />
                    My History
                </button>
            </div>

            {showHistory ? (
                /* Feedback History */
                <div className="card card-elevated">
                    <h2 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.25rem",
                        color: "var(--text-primary)",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                    }}>
                        <History size={20} style={{ color: "var(--yellow)" }} />
                        Your Feedback History
                    </h2>

                    {loadingHistory ? (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <Loader2 size={32} className="spinner" style={{ color: "var(--yellow)" }} />
                            <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>Loading your feedback...</p>
                        </div>
                    ) : pastFeedback.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <MessageSquare size={48} style={{ color: "var(--text-muted)", opacity: 0.5, marginBottom: "16px" }} />
                            <p style={{ color: "var(--text-muted)" }}>
                                You haven&apos;t submitted any feedback yet.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {pastFeedback.map((fb) => {
                                const typeInfo = feedbackTypes.find(t => t.value === fb.type);
                                const TypeIcon = typeInfo?.icon || MessageCircle;

                                return (
                                    <div
                                        key={fb.id}
                                        style={{
                                            padding: "16px",
                                            background: "var(--black-base)",
                                            borderRadius: "12px",
                                            border: "1px solid var(--black-border)",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                                    <TypeIcon size={16} style={{ color: typeInfo?.color }} />
                                                    <h4 style={{
                                                        fontFamily: "var(--font-heading)",
                                                        fontSize: "1rem",
                                                        color: "var(--text-primary)",
                                                        fontWeight: 600,
                                                    }}>
                                                        {fb.subject}
                                                    </h4>
                                                </div>
                                                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                                    {new Date(fb.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    fontSize: "11px",
                                                    padding: "4px 10px",
                                                    borderRadius: "4px",
                                                    background: `${getStatusColor(fb.status)}15`,
                                                    color: getStatusColor(fb.status),
                                                    border: `1px solid ${getStatusColor(fb.status)}30`,
                                                    textTransform: "uppercase",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {getStatusIcon(fb.status)}
                                                {fb.status}
                                            </span>
                                        </div>

                                        <p style={{
                                            fontSize: "14px",
                                            color: "var(--text-secondary)",
                                            lineHeight: 1.6,
                                            marginBottom: fb.adminResponse ? "12px" : "0",
                                        }}>
                                            {fb.message}
                                        </p>

                                        {/* Rating stars */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "12px" }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={14}
                                                    fill={star <= fb.rating ? "var(--yellow)" : "transparent"}
                                                    style={{ color: star <= fb.rating ? "var(--yellow)" : "var(--text-muted)" }}
                                                />
                                            ))}
                                        </div>

                                        {fb.adminResponse && (
                                            <div
                                                style={{
                                                    marginTop: "16px",
                                                    padding: "12px 16px",
                                                    background: "rgba(250, 204, 21, 0.05)",
                                                    border: "1px solid rgba(250, 204, 21, 0.15)",
                                                    borderRadius: "8px",
                                                    borderLeft: "3px solid var(--yellow)",
                                                }}
                                            >
                                                <div style={{ fontSize: "12px", color: "var(--yellow)", marginBottom: "8px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <MessageCircle size={14} />
                                                    Admin Response
                                                    {fb.respondedAt && (
                                                        <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>
                                                            • {new Date(fb.respondedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                                                    {fb.adminResponse}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* Feedback Form */
                <div className="card card-elevated">
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
                        {/* Feedback Type */}
                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    color: "var(--text-secondary)",
                                    fontSize: "13px",
                                    marginBottom: "12px",
                                    fontWeight: 500,
                                }}
                            >
                                What type of feedback is this?
                            </label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {feedbackTypes.map((type) => {
                                    const Icon = type.icon;
                                    const isSelected = formData.type === type.value;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: type.value })}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "10px 16px",
                                                borderRadius: "8px",
                                                border: `1px solid ${isSelected ? type.color : "var(--black-border)"}`,
                                                background: isSelected ? `${type.color}15` : "var(--black-base)",
                                                color: isSelected ? type.color : "var(--text-secondary)",
                                                cursor: "pointer",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            <Icon size={16} />
                                            {type.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Priority Level */}
                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    color: "var(--text-secondary)",
                                    fontSize: "13px",
                                    marginBottom: "12px",
                                    fontWeight: 500,
                                }}
                            >
                                Priority Level
                            </label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {priorityLevels.map((priority) => {
                                    const isSelected = formData.priority === priority.value;
                                    return (
                                        <button
                                            key={priority.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: priority.value })}
                                            style={{
                                                flex: 1,
                                                padding: "10px 12px",
                                                borderRadius: "8px",
                                                border: `1px solid ${isSelected ? priority.color : "var(--black-border)"}`,
                                                background: isSelected ? `${priority.color}15` : "var(--black-base)",
                                                color: isSelected ? priority.color : "var(--text-secondary)",
                                                cursor: "pointer",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {priority.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rating */}
                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    color: "var(--text-secondary)",
                                    fontSize: "13px",
                                    marginBottom: "12px",
                                    fontWeight: 500,
                                }}
                            >
                                How would you rate your experience?
                            </label>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, rating: star })}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "4px",
                                                transition: "transform 0.2s",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                        >
                                            <Star
                                                size={32}
                                                fill={star <= formData.rating ? "var(--yellow)" : "transparent"}
                                                style={{ color: star <= formData.rating ? "var(--yellow)" : "var(--text-muted)" }}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <span style={{
                                    fontSize: "14px",
                                    color: "var(--yellow)",
                                    fontWeight: 600,
                                    padding: "4px 12px",
                                    background: "rgba(250, 204, 21, 0.1)",
                                    borderRadius: "20px",
                                }}>
                                    {ratingLabels[formData.rating - 1]}
                                </span>
                            </div>
                        </div>

                        {/* Subject */}
                        <div style={{ marginBottom: "20px" }}>
                            <label
                                style={{
                                    display: "block",
                                    color: "var(--text-secondary)",
                                    fontSize: "13px",
                                    marginBottom: "8px",
                                    fontWeight: 500,
                                }}
                            >
                                Subject *
                            </label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                                minLength={5}
                                maxLength={100}
                                placeholder="What's this about?"
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    background: "var(--black-base)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "10px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                    transition: "border-color 0.2s",
                                }}
                            />
                        </div>

                        {/* Message */}
                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    color: "var(--text-secondary)",
                                    fontSize: "13px",
                                    marginBottom: "8px",
                                    fontWeight: 500,
                                }}
                            >
                                Your Feedback *
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                                minLength={20}
                                maxLength={2000}
                                rows={6}
                                placeholder="Tell us what you think... Share your suggestions, report issues, or let us know what you love!"
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    background: "var(--black-base)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "10px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                    resize: "vertical",
                                    transition: "border-color 0.2s",
                                }}
                            />
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: "8px"
                            }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                    Minimum 20 characters
                                </span>
                                <span style={{
                                    fontSize: "12px",
                                    color: formData.message.length >= 20 ? "var(--yellow)" : "var(--text-muted)",
                                    fontWeight: formData.message.length >= 20 ? 500 : 400,
                                }}>
                                    {formData.message.length}/2000
                                </span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                padding: "14px 24px",
                                fontSize: "15px",
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spinner" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Feedback
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
