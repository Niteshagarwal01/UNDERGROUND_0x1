"use client";

import { useState, useEffect } from "react";
import {
    MessageSquare,
    Star,
    Clock,
    CheckCircle,
    AlertCircle,
    Bug,
    Lightbulb,
    Sparkles,
    Heart,
    MessageCircle,
    Search,
    Filter,
    Trash2,
    Send,
    ChevronDown,
    ChevronUp,
    Loader2,
    RefreshCw,
    X,
    BarChart3,
    TrendingUp,
    Users,
    AlertTriangle,
    ArrowUpDown
} from "lucide-react";

interface FeedbackUser {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
}

interface FeedbackItem {
    id: string;
    subject: string;
    message: string;
    rating: number;
    type: string;
    priority: string;
    status: string;
    adminResponse: string | null;
    respondedAt: string | null;
    createdAt: string;
    user: FeedbackUser | null;
}

interface Stats {
    total: number;
    new: number;
    reviewed: number;
    resolved: number;
    avgRating: string;
    responseRate: string;
    typeDistribution: {
        bug: number;
        feature: number;
        suggestion: number;
        general: number;
        praise: number;
    };
    priorityDistribution: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

const feedbackTypes = [
    { value: "BUG", label: "Bug", icon: Bug, color: "#ef4444" },
    { value: "FEATURE", label: "Feature", icon: Lightbulb, color: "#3b82f6" },
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

const statusOptions = [
    { value: "NEW", label: "New", color: "#f97316", icon: AlertCircle },
    { value: "REVIEWED", label: "Reviewed", color: "#facc15", icon: Clock },
    { value: "RESOLVED", label: "Resolved", color: "#22c55e", icon: CheckCircle },
];

export default function AdminFeedbackPage() {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
    const [updating, setUpdating] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [priorityFilter, setPriorityFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("createdAt");
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const [showFilters, setShowFilters] = useState(false);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);
            if (typeFilter) params.append("type", typeFilter);
            if (priorityFilter) params.append("priority", priorityFilter);
            if (searchQuery) params.append("search", searchQuery);
            params.append("sortBy", sortBy);
            params.append("sortOrder", sortOrder);

            const response = await fetch(`/api/admin/feedback?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setFeedback(data.feedback);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch feedback:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, [statusFilter, typeFilter, priorityFilter, sortBy, sortOrder]);

    const handleSearch = () => {
        fetchFeedback();
    };

    const handleStatusChange = async (feedbackId: string, newStatus: string) => {
        setUpdating(feedbackId);
        try {
            const response = await fetch("/api/admin/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedbackId, status: newStatus }),
            });
            const data = await response.json();
            if (data.success) {
                setFeedback(prev => prev.map(f =>
                    f.id === feedbackId ? data.feedback : f
                ));
                // Refresh stats
                fetchFeedback();
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setUpdating(null);
        }
    };

    const handleSendResponse = async (feedbackId: string) => {
        const response = responseText[feedbackId];
        if (!response?.trim()) return;

        setUpdating(feedbackId);
        try {
            const res = await fetch("/api/admin/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feedbackId,
                    adminResponse: response,
                    status: "REVIEWED" // Auto-mark as reviewed when responding
                }),
            });
            const data = await res.json();
            if (data.success) {
                setFeedback(prev => prev.map(f =>
                    f.id === feedbackId ? data.feedback : f
                ));
                setResponseText(prev => ({ ...prev, [feedbackId]: "" }));
            }
        } catch (error) {
            console.error("Failed to send response:", error);
        } finally {
            setUpdating(null);
        }
    };

    const handleDelete = async (feedbackId: string) => {
        if (!confirm("Are you sure you want to delete this feedback?")) return;

        setDeleting(feedbackId);
        try {
            const response = await fetch(`/api/admin/feedback?id=${feedbackId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                setFeedback(prev => prev.filter(f => f.id !== feedbackId));
                fetchFeedback(); // Refresh stats
            }
        } catch (error) {
            console.error("Failed to delete feedback:", error);
        } finally {
            setDeleting(null);
        }
    };

    const getTypeInfo = (type: string) => {
        return feedbackTypes.find(t => t.value === type) || feedbackTypes[3];
    };

    const getPriorityInfo = (priority: string) => {
        return priorityLevels.find(p => p.value === priority) || priorityLevels[1];
    };

    const getStatusInfo = (status: string) => {
        return statusOptions.find(s => s.value === status) || statusOptions[0];
    };

    const clearFilters = () => {
        setStatusFilter("");
        setTypeFilter("");
        setPriorityFilter("");
        setSearchQuery("");
        setSortBy("createdAt");
        setSortOrder("desc");
    };

    const hasActiveFilters = statusFilter || typeFilter || priorityFilter || searchQuery;

    return (
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "2.5rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <MessageSquare size={32} style={{ color: "var(--yellow)" }} />
                    User Feedback
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                    View, manage, and respond to user feedback.
                </p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "16px",
                        marginBottom: "32px",
                    }}
                >
                    <div className="card" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "rgba(250, 204, 21, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <BarChart3 size={20} style={{ color: "var(--yellow)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--yellow)", fontFamily: "var(--font-heading)" }}>
                                    {stats.total}
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Total Feedback
                        </div>
                    </div>

                    <div className="card" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "rgba(249, 115, 22, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <AlertCircle size={20} style={{ color: "#f97316" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#f97316", fontFamily: "var(--font-heading)" }}>
                                    {stats.new}
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Unread
                        </div>
                    </div>

                    <div className="card" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "rgba(34, 197, 94, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <CheckCircle size={20} style={{ color: "#22c55e" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22c55e", fontFamily: "var(--font-heading)" }}>
                                    {stats.resolved}
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Resolved
                        </div>
                    </div>

                    <div className="card" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "rgba(250, 204, 21, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <Star size={20} style={{ color: "var(--yellow)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--yellow)", fontFamily: "var(--font-heading)" }}>
                                    {stats.avgRating}
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Avg Rating
                        </div>
                    </div>

                    <div className="card" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "rgba(139, 92, 246, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <TrendingUp size={20} style={{ color: "#8b5cf6" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#8b5cf6", fontFamily: "var(--font-heading)" }}>
                                    {stats.responseRate}%
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Response Rate
                        </div>
                    </div>

                    <div className="card" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "rgba(239, 68, 68, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <AlertTriangle size={20} style={{ color: "#ef4444" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ef4444", fontFamily: "var(--font-heading)" }}>
                                    {stats.priorityDistribution.critical}
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Critical
                        </div>
                    </div>
                </div>
            )}

            {/* Filters & Search */}
            <div className="card" style={{ marginBottom: "24px", padding: "20px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                    {/* Search */}
                    <div style={{
                        flex: "1 1 300px",
                        display: "flex",
                        gap: "8px",
                        background: "var(--black-base)",
                        borderRadius: "8px",
                        padding: "4px",
                        border: "1px solid var(--black-border)",
                    }}>
                        <input
                            type="text"
                            placeholder="Search feedback..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            style={{
                                flex: 1,
                                padding: "10px 12px",
                                background: "transparent",
                                border: "none",
                                color: "var(--text-primary)",
                                fontSize: "14px",
                                outline: "none",
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            style={{
                                padding: "10px 16px",
                                background: "var(--yellow)",
                                color: "var(--black)",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 500,
                            }}
                        >
                            <Search size={16} />
                        </button>
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            padding: "12px 16px",
                            background: showFilters ? "var(--yellow)" : "var(--black-base)",
                            color: showFilters ? "var(--black)" : "var(--text-secondary)",
                            border: "1px solid var(--black-border)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: 500,
                        }}
                    >
                        <Filter size={16} />
                        Filters
                        {hasActiveFilters && (
                            <span style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: showFilters ? "var(--black)" : "var(--yellow)",
                            }} />
                        )}
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={fetchFeedback}
                        disabled={loading}
                        style={{
                            padding: "12px 16px",
                            background: "var(--black-base)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--black-border)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <RefreshCw size={16} className={loading ? "spinner" : ""} />
                    </button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div style={{
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "1px solid var(--black-border)",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        alignItems: "flex-end",
                    }}>
                        {/* Status Filter */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    padding: "10px 12px",
                                    background: "var(--black-base)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                    minWidth: "140px",
                                }}
                            >
                                <option value="">All</option>
                                {statusOptions.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                                Type
                            </label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                style={{
                                    padding: "10px 12px",
                                    background: "var(--black-base)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                    minWidth: "140px",
                                }}
                            >
                                <option value="">All</option>
                                {feedbackTypes.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                                Priority
                            </label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                style={{
                                    padding: "10px 12px",
                                    background: "var(--black-base)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                    minWidth: "140px",
                                }}
                            >
                                <option value="">All</option>
                                {priorityLevels.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                                Sort By
                            </label>
                            <div style={{ display: "flex", gap: "4px" }}>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    style={{
                                        padding: "10px 12px",
                                        background: "var(--black-base)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px 0 0 8px",
                                        color: "var(--text-primary)",
                                        fontSize: "14px",
                                    }}
                                >
                                    <option value="createdAt">Date</option>
                                    <option value="rating">Rating</option>
                                    <option value="priority">Priority</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                    style={{
                                        padding: "10px 12px",
                                        background: "var(--black-base)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "0 8px 8px 0",
                                        color: "var(--text-secondary)",
                                        cursor: "pointer",
                                    }}
                                >
                                    <ArrowUpDown size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                style={{
                                    padding: "10px 16px",
                                    background: "rgba(239, 68, 68, 0.1)",
                                    color: "#ef4444",
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "14px",
                                }}
                            >
                                <X size={14} />
                                Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Feedback List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {loading ? (
                    <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
                        <Loader2 size={40} className="spinner" style={{ color: "var(--yellow)", margin: "0 auto 16px" }} />
                        <p style={{ color: "var(--text-muted)" }}>Loading feedback...</p>
                    </div>
                ) : feedback.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
                        <MessageSquare size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px", opacity: 0.5 }} />
                        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                            {hasActiveFilters ? "No feedback matches your filters." : "No feedback received yet."}
                        </p>
                    </div>
                ) : (
                    feedback.map((item) => {
                        const typeInfo = getTypeInfo(item.type);
                        const priorityInfo = getPriorityInfo(item.priority);
                        const statusInfo = getStatusInfo(item.status);
                        const TypeIcon = typeInfo.icon;
                        const StatusIcon = statusInfo.icon;
                        const isExpanded = expandedId === item.id;

                        return (
                            <div key={item.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                                {/* Header */}
                                <div
                                    style={{
                                        padding: "20px",
                                        cursor: "pointer",
                                        transition: "background 0.2s",
                                    }}
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                                                {/* Type Badge */}
                                                <span style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    background: `${typeInfo.color}15`,
                                                    color: typeInfo.color,
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    textTransform: "uppercase",
                                                }}>
                                                    <TypeIcon size={12} />
                                                    {typeInfo.label}
                                                </span>

                                                {/* Priority Badge */}
                                                <span style={{
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    background: `${priorityInfo.color}15`,
                                                    color: priorityInfo.color,
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    textTransform: "uppercase",
                                                }}>
                                                    {priorityInfo.label}
                                                </span>

                                                {/* Status Badge */}
                                                <span style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    background: `${statusInfo.color}15`,
                                                    color: statusInfo.color,
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    textTransform: "uppercase",
                                                }}>
                                                    <StatusIcon size={12} />
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            <h3 style={{
                                                fontFamily: "var(--font-heading)",
                                                fontSize: "1.1rem",
                                                fontWeight: 600,
                                                color: "var(--text-primary)",
                                                marginBottom: "8px",
                                            }}>
                                                {item.subject}
                                            </h3>

                                            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", color: "var(--text-muted)", flexWrap: "wrap" }}>
                                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    {item.user?.avatarUrl ? (
                                                        <img
                                                            src={item.user.avatarUrl}
                                                            alt=""
                                                            style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                                                        />
                                                    ) : (
                                                        <Users size={14} />
                                                    )}
                                                    <strong style={{ color: "var(--text-secondary)" }}>
                                                        {item.user?.username || "Anonymous"}
                                                    </strong>
                                                </span>
                                                <span>
                                                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                {/* Rating */}
                                                <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            size={14}
                                                            fill={star <= item.rating ? "var(--yellow)" : "transparent"}
                                                            style={{ color: star <= item.rating ? "var(--yellow)" : "var(--text-muted)" }}
                                                        />
                                                    ))}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expand Button */}
                                        <button
                                            style={{
                                                padding: "8px",
                                                background: "none",
                                                border: "none",
                                                color: "var(--text-muted)",
                                                cursor: "pointer",
                                                transition: "transform 0.2s",
                                                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                            }}
                                        >
                                            <ChevronDown size={20} />
                                        </button>
                                    </div>

                                    {/* Preview (collapsed) */}
                                    {!isExpanded && (
                                        <p style={{
                                            color: "var(--text-secondary)",
                                            fontSize: "14px",
                                            marginTop: "12px",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            lineHeight: 1.5,
                                        }}>
                                            {item.message}
                                        </p>
                                    )}
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div style={{
                                        borderTop: "1px solid var(--black-border)",
                                        padding: "20px",
                                        background: "rgba(0,0,0,0.2)",
                                    }}>
                                        {/* Full Message */}
                                        <div style={{ marginBottom: "20px" }}>
                                            <label style={{
                                                display: "block",
                                                fontSize: "12px",
                                                color: "var(--text-muted)",
                                                marginBottom: "8px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}>
                                                Full Message
                                            </label>
                                            <p style={{
                                                color: "var(--text-secondary)",
                                                fontSize: "14px",
                                                lineHeight: 1.7,
                                                whiteSpace: "pre-wrap",
                                                background: "var(--black-base)",
                                                padding: "16px",
                                                borderRadius: "8px",
                                                border: "1px solid var(--black-border)",
                                            }}>
                                                {item.message}
                                            </p>
                                        </div>

                                        {/* Existing Admin Response */}
                                        {item.adminResponse && (
                                            <div style={{ marginBottom: "20px" }}>
                                                <div
                                                    style={{
                                                        padding: "16px",
                                                        background: "rgba(250, 204, 21, 0.05)",
                                                        border: "1px solid rgba(250, 204, 21, 0.15)",
                                                        borderRadius: "8px",
                                                        borderLeft: "3px solid var(--yellow)",
                                                    }}
                                                >
                                                    <div style={{
                                                        fontSize: "12px",
                                                        color: "var(--yellow)",
                                                        marginBottom: "8px",
                                                        fontWeight: 600,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                    }}>
                                                        <MessageCircle size={14} />
                                                        Your Response
                                                        {item.respondedAt && (
                                                            <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>
                                                                • {new Date(item.respondedAt).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                                                        {item.adminResponse}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "12px",
                                            alignItems: "flex-start",
                                            paddingTop: "16px",
                                            borderTop: "1px solid var(--black-border)",
                                        }}>
                                            {/* Status Change */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <label style={{ fontSize: "13px", color: "var(--text-muted)" }}>Status:</label>
                                                <select
                                                    value={item.status}
                                                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                    disabled={updating === item.id}
                                                    style={{
                                                        padding: "8px 12px",
                                                        background: "var(--black-base)",
                                                        border: "1px solid var(--black-border)",
                                                        borderRadius: "6px",
                                                        color: statusInfo.color,
                                                        fontSize: "13px",
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {statusOptions.map(s => (
                                                        <option key={s.value} value={s.value}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deleting === item.id}
                                                style={{
                                                    marginLeft: "auto",
                                                    padding: "8px 12px",
                                                    background: "rgba(239, 68, 68, 0.1)",
                                                    color: "#ef4444",
                                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                {deleting === item.id ? (
                                                    <Loader2 size={14} className="spinner" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                                Delete
                                            </button>
                                        </div>

                                        {/* Response Input */}
                                        <div style={{ marginTop: "16px" }}>
                                            <label style={{
                                                display: "block",
                                                fontSize: "12px",
                                                color: "var(--text-muted)",
                                                marginBottom: "8px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}>
                                                {item.adminResponse ? "Update Response" : "Send Response"}
                                            </label>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <textarea
                                                    value={responseText[item.id] || ""}
                                                    onChange={(e) => setResponseText(prev => ({
                                                        ...prev,
                                                        [item.id]: e.target.value
                                                    }))}
                                                    placeholder="Type your response to the user..."
                                                    rows={3}
                                                    style={{
                                                        flex: 1,
                                                        padding: "12px",
                                                        background: "var(--black-base)",
                                                        border: "1px solid var(--black-border)",
                                                        borderRadius: "8px",
                                                        color: "var(--text-primary)",
                                                        fontSize: "14px",
                                                        resize: "vertical",
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleSendResponse(item.id)}
                                                disabled={updating === item.id || !responseText[item.id]?.trim()}
                                                style={{
                                                    marginTop: "8px",
                                                    padding: "10px 20px",
                                                    background: responseText[item.id]?.trim() ? "var(--yellow)" : "var(--black-border)",
                                                    color: responseText[item.id]?.trim() ? "var(--black)" : "var(--text-muted)",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    cursor: responseText[item.id]?.trim() ? "pointer" : "not-allowed",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    fontSize: "14px",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {updating === item.id ? (
                                                    <Loader2 size={16} className="spinner" />
                                                ) : (
                                                    <Send size={16} />
                                                )}
                                                Send Response
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
