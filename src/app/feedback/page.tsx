"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Star, Send, Loader2, ArrowLeft } from "lucide-react";

export default function FeedbackPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        subject: "",
        message: "",
        rating: 5,
    });

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
                setFormData({ subject: "", message: "", rating: 5 });
            } else {
                setError(data.message || "Failed to submit feedback");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
                <div
                    style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "rgba(34, 197, 94, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                    }}
                >
                    <MessageSquare size={40} style={{ color: "#22c55e" }} />
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
                <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "32px" }}>
                    Your feedback has been submitted successfully. We appreciate you taking the time to help us improve!
                </p>
                <button
                    className="btn btn-primary"
                    onClick={() => setSuccess(false)}
                >
                    Submit More Feedback
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 24px" }}>
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
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "rgba(250, 204, 21, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                    }}
                >
                    <MessageSquare size={28} style={{ color: "var(--yellow)" }} />
                </div>
                <h1
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "2rem",
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

            {/* Feedback Form */}
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
                    {/* Rating */}
                    <div style={{ marginBottom: "24px" }}>
                        <label
                            style={{
                                display: "block",
                                color: "var(--text-secondary)",
                                fontSize: "13px",
                                marginBottom: "12px",
                            }}
                        >
                            How would you rate your experience?
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
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
                                    }}
                                >
                                    <Star
                                        size={32}
                                        fill={star <= formData.rating ? "var(--yellow)" : "transparent"}
                                        style={{ color: star <= formData.rating ? "var(--yellow)" : "var(--text-muted)" }}
                                    />
                                </button>
                            ))}
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
                                padding: "12px 16px",
                                background: "var(--black-elevated)",
                                border: "1px solid var(--black-border)",
                                borderRadius: "8px",
                                color: "var(--text-primary)",
                                fontSize: "14px",
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
                                padding: "12px 16px",
                                background: "var(--black-elevated)",
                                border: "1px solid var(--black-border)",
                                borderRadius: "8px",
                                color: "var(--text-primary)",
                                fontSize: "14px",
                                resize: "vertical",
                            }}
                        />
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                            {formData.message.length}/2000 characters (minimum 20)
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
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
        </div>
    );
}
