"use client";

import { useState, useEffect, useRef } from "react";
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
    Clock,
    CheckCircle,
    AlertCircle,
    History,
    AlertTriangle,
    Bot,
    User,
    Headphones,
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

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

const feedbackTypes = [
    { value: "BUG", label: "Bug Report", icon: Bug },
    { value: "FEATURE", label: "Feature Request", icon: Lightbulb },
    { value: "SUGGESTION", label: "Suggestion", icon: Sparkles },
    { value: "GENERAL", label: "General", icon: MessageCircle },
    { value: "PRAISE", label: "Praise", icon: Heart },
];

const priorityLevels = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
];

const ratingLabels = ["Poor", "Fair", "Good", "Great", "Excellent"];

export default function SupportPage() {
    // Main tab state
    const [mainTab, setMainTab] = useState<"feedback" | "ai">("ai");

    // Feedback sub-tab state
    const [feedbackTab, setFeedbackTab] = useState<"new" | "history">("new");

    // Feedback form state
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [pastFeedback, setPastFeedback] = useState<PastFeedback[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [formData, setFormData] = useState({
        subject: "",
        message: "",
        rating: 5,
        type: "GENERAL",
        priority: "MEDIUM",
    });

    // AI Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    // Fetch feedback history
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
        if (mainTab === "feedback" && feedbackTab === "history") {
            fetchHistory();
        }
    }, [mainTab, feedbackTab]);

    // Submit feedback
    const handleSubmitFeedback = async (e: React.FormEvent) => {
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
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Send AI message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || chatLoading) return;

        const userMessage = chatInput.trim();
        setChatInput("");
        setChatError("");

        // Add user message immediately
        const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: userMessage }];
        setChatMessages(newMessages);
        setChatLoading(true);

        try {
            const response = await fetch("/api/ai-support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: chatMessages, // Send previous history
                }),
            });

            const data = await response.json();

            if (data.success) {
                setChatMessages([...newMessages, { role: "assistant", content: data.response }]);
            } else {
                setChatError(data.message || "Failed to get response");
                // Remove the user message if failed
                setChatMessages(chatMessages);
            }
        } catch {
            setChatError("Connection error. Please try again.");
            setChatMessages(chatMessages);
        } finally {
            setChatLoading(false);
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

    // Success state for feedback
    if (success) {
        return (
            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
                <div
                    style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        background: "rgba(250, 204, 21, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                        boxShadow: "0 0 40px rgba(250, 204, 21, 0.2)",
                    }}
                >
                    <CheckCircle size={48} style={{ color: "var(--yellow)" }} />
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
                        onClick={() => { setSuccess(false); setFeedbackTab("history"); }}
                    >
                        <History size={18} />
                        View My Feedback
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
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
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div
                    style={{
                        width: "70px",
                        height: "70px",
                        borderRadius: "50%",
                        background: "rgba(250, 204, 21, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                        boxShadow: "0 0 30px rgba(250, 204, 21, 0.1)",
                    }}
                >
                    <Headphones size={32} style={{ color: "var(--yellow)" }} />
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
                    Support Center
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                    Get help from AI or send us your feedback
                </p>
            </div>

            {/* Main Tabs: Feedback | AI Chatbot */}
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
                    onClick={() => setMainTab("feedback")}
                    style={{
                        flex: 1,
                        padding: "14px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: mainTab === "feedback" ? "var(--yellow)" : "transparent",
                        color: mainTab === "feedback" ? "var(--black)" : "var(--text-secondary)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                        fontSize: "15px",
                    }}
                >
                    <MessageSquare size={18} />
                    Feedback
                </button>
                <button
                    onClick={() => setMainTab("ai")}
                    style={{
                        flex: 1,
                        padding: "14px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: mainTab === "ai" ? "var(--yellow)" : "transparent",
                        color: mainTab === "ai" ? "var(--black)" : "var(--text-secondary)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                        fontSize: "15px",
                    }}
                >
                    <Bot size={18} />
                    AI Assistant
                </button>
            </div>

            {mainTab === "feedback" ? (
                <>
                    {/* Feedback Sub-tabs */}
                    <div style={{
                        display: "flex",
                        gap: "4px",
                        marginBottom: "20px",
                    }}>
                        <button
                            onClick={() => setFeedbackTab("new")}
                            style={{
                                flex: 1,
                                padding: "10px 14px",
                                borderRadius: "6px",
                                border: feedbackTab === "new" ? "1px solid var(--yellow)" : "1px solid var(--black-border)",
                                background: feedbackTab === "new" ? "rgba(250, 204, 21, 0.1)" : "transparent",
                                color: feedbackTab === "new" ? "var(--yellow)" : "var(--text-muted)",
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                transition: "all 0.2s",
                                fontSize: "13px",
                            }}
                        >
                            <Send size={14} />
                            New Feedback
                        </button>
                        <button
                            onClick={() => setFeedbackTab("history")}
                            style={{
                                flex: 1,
                                padding: "10px 14px",
                                borderRadius: "6px",
                                border: feedbackTab === "history" ? "1px solid var(--yellow)" : "1px solid var(--black-border)",
                                background: feedbackTab === "history" ? "rgba(250, 204, 21, 0.1)" : "transparent",
                                color: feedbackTab === "history" ? "var(--yellow)" : "var(--text-muted)",
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                transition: "all 0.2s",
                                fontSize: "13px",
                            }}
                        >
                            <History size={14} />
                            My History
                        </button>
                    </div>

                    {feedbackTab === "history" ? (
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
                                                            <TypeIcon size={16} style={{ color: "var(--yellow)" }} />
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
                                                            background: "rgba(250, 204, 21, 0.1)",
                                                            color: "var(--yellow)",
                                                            border: "1px solid rgba(250, 204, 21, 0.2)",
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
                        /* New Feedback Form */
                        <div className="card card-elevated">
                            {error && (
                                <div
                                    style={{
                                        padding: "12px 16px",
                                        background: "rgba(250, 204, 21, 0.1)",
                                        border: "1px solid rgba(250, 204, 21, 0.2)",
                                        borderRadius: "8px",
                                        color: "var(--yellow)",
                                        marginBottom: "24px",
                                        fontSize: "14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <AlertTriangle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmitFeedback}>
                                {/* Feedback Type */}
                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>
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
                                                        border: `1px solid ${isSelected ? "var(--yellow)" : "var(--black-border)"}`,
                                                        background: isSelected ? "rgba(250, 204, 21, 0.1)" : "var(--black-base)",
                                                        color: isSelected ? "var(--yellow)" : "var(--text-secondary)",
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

                                {/* Priority */}
                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>
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
                                                        border: `1px solid ${isSelected ? "var(--yellow)" : "var(--black-border)"}`,
                                                        background: isSelected ? "rgba(250, 204, 21, 0.1)" : "var(--black-base)",
                                                        color: isSelected ? "var(--yellow)" : "var(--text-secondary)",
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
                                    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>
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
                                    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px", fontWeight: 500 }}>
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
                                    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px", fontWeight: 500 }}>
                                        Your Feedback *
                                    </label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        minLength={20}
                                        maxLength={2000}
                                        rows={6}
                                        placeholder="Tell us what you think..."
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
                                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                                        <span style={{
                                            fontSize: "12px",
                                            color: formData.message.length >= 20 ? "var(--yellow)" : "var(--text-muted)",
                                        }}>
                                            {formData.message.length}/2000
                                        </span>
                                    </div>
                                </div>

                                {/* Submit */}
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
                </>
            ) : (
                /* AI Chatbot Tab */
                <div className="card card-elevated" style={{ padding: 0, overflow: "hidden" }}>
                    {/* Chat Header */}
                    <div style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--black-border)",
                        background: "rgba(250, 204, 21, 0.05)",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}>
                        <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: "var(--gradient-yellow)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Bot size={22} color="#000" />
                        </div>
                        <div>
                            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                AI Support Assistant
                            </h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                Ask me anything about the platform
                            </p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div style={{
                        height: "400px",
                        overflowY: "auto",
                        padding: "16px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}>
                        {chatMessages.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 20px" }}>
                                <Bot size={48} style={{ color: "var(--yellow)", marginBottom: "16px", opacity: 0.5 }} />
                                <h4 style={{ fontFamily: "var(--font-heading)", marginBottom: "8px", color: "var(--text-primary)" }}>
                                    How can I help you today?
                                </h4>
                                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                                    I can help with challenges, teams, scoring, navigation, and more!
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                                    {["How do I submit a flag?", "What's the flag format?", "How do teams work?"].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => {
                                                setChatInput(q);
                                            }}
                                            style={{
                                                padding: "8px 14px",
                                                fontSize: "13px",
                                                background: "rgba(250, 204, 21, 0.1)",
                                                border: "1px solid rgba(250, 204, 21, 0.2)",
                                                borderRadius: "20px",
                                                color: "var(--yellow)",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            chatMessages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: "flex",
                                        gap: "12px",
                                        alignItems: "flex-start",
                                        flexDirection: msg.role === "user" ? "row-reverse" : "row",
                                    }}
                                >
                                    <div style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "8px",
                                        background: msg.role === "user" ? "var(--black-lighter)" : "var(--gradient-yellow)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        {msg.role === "user" ? (
                                            <User size={18} style={{ color: "var(--text-muted)" }} />
                                        ) : (
                                            <Bot size={18} color="#000" />
                                        )}
                                    </div>
                                    <div style={{
                                        maxWidth: "75%",
                                        padding: "12px 16px",
                                        borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                                        background: msg.role === "user" ? "rgba(250, 204, 21, 0.1)" : "var(--black-lighter)",
                                        border: msg.role === "user" ? "1px solid rgba(250, 204, 21, 0.2)" : "1px solid var(--black-border)",
                                    }}>
                                        <p style={{
                                            fontSize: "14px",
                                            color: "var(--text-secondary)",
                                            lineHeight: 1.6,
                                            whiteSpace: "pre-wrap",
                                        }}>
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Loading indicator */}
                        {chatLoading && (
                            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                <div style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    background: "var(--gradient-yellow)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <Bot size={18} color="#000" />
                                </div>
                                <div style={{
                                    padding: "16px",
                                    borderRadius: "12px 12px 12px 4px",
                                    background: "var(--black-lighter)",
                                    border: "1px solid var(--black-border)",
                                }}>
                                    <Loader2 size={18} className="spinner" style={{ color: "var(--yellow)" }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Error */}
                    {chatError && (
                        <div style={{
                            padding: "10px 20px",
                            background: "rgba(239, 68, 68, 0.1)",
                            borderTop: "1px solid rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}>
                            <AlertCircle size={14} />
                            {chatError}
                        </div>
                    )}

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} style={{
                        padding: "16px 20px",
                        borderTop: "1px solid var(--black-border)",
                        display: "flex",
                        gap: "12px",
                    }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type your question..."
                            maxLength={1000}
                            disabled={chatLoading}
                            style={{
                                flex: 1,
                                padding: "14px 16px",
                                background: "var(--black-base)",
                                border: "1px solid var(--black-border)",
                                borderRadius: "10px",
                                color: "var(--text-primary)",
                                fontSize: "14px",
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!chatInput.trim() || chatLoading}
                            style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "10px",
                                background: chatInput.trim() && !chatLoading ? "var(--gradient-yellow)" : "var(--black-lighter)",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed",
                                transition: "all 0.2s",
                            }}
                        >
                            <Send size={20} style={{ color: chatInput.trim() && !chatLoading ? "#000" : "var(--text-muted)" }} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
