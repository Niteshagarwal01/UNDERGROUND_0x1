import prisma from "@/lib/prisma";
import { MessageSquare, Star, Clock, CheckCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getFeedback() {
    try {
        const feedback = await prisma.feedback.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const stats = {
            total: await prisma.feedback.count(),
            new: await prisma.feedback.count({ where: { status: "NEW" } }),
            reviewed: await prisma.feedback.count({ where: { status: "REVIEWED" } }),
            resolved: await prisma.feedback.count({ where: { status: "RESOLVED" } }),
        };

        return { feedback, stats };
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return { feedback: [], stats: { total: 0, new: 0, reviewed: 0, resolved: 0 } };
    }
}

export default async function AdminFeedbackPage() {
    const { feedback, stats } = await getFeedback();

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

    return (
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "40px" }}>
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
                    View and manage feedback from users.
                </p>
            </div>

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "24px",
                    marginBottom: "48px",
                }}
            >
                <div className="card">
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--yellow)", fontFamily: "var(--font-heading)" }}>
                        {stats.total}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Total Feedback
                    </div>
                </div>
                <div className="card">
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f97316", fontFamily: "var(--font-heading)" }}>
                        {stats.new}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        New (Unread)
                    </div>
                </div>
                <div className="card">
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--yellow)", fontFamily: "var(--font-heading)" }}>
                        {stats.reviewed}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Reviewed
                    </div>
                </div>
                <div className="card">
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#22c55e", fontFamily: "var(--font-heading)" }}>
                        {stats.resolved}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Resolved
                    </div>
                </div>
            </div>

            {/* Feedback List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {feedback.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
                        <MessageSquare size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px", opacity: 0.5 }} />
                        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No feedback received yet.</p>
                    </div>
                ) : (
                    feedback.map((item) => (
                        <div key={item.id} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                <div>
                                    <h3
                                        style={{
                                            fontFamily: "var(--font-heading)",
                                            fontSize: "1.1rem",
                                            fontWeight: 600,
                                            color: "var(--text-primary)",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        {item.subject}
                                    </h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
                                        <span>
                                            From: <strong style={{ color: "var(--text-secondary)" }}>{item.user?.username || "Anonymous"}</strong>
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
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {/* Rating */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={16}
                                                fill={star <= item.rating ? "var(--yellow)" : "transparent"}
                                                style={{ color: star <= item.rating ? "var(--yellow)" : "var(--text-muted)" }}
                                            />
                                        ))}
                                    </div>
                                    {/* Status Badge */}
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            fontSize: "11px",
                                            padding: "4px 10px",
                                            borderRadius: "4px",
                                            background: `rgba(${item.status === "NEW"
                                                ? "249, 115, 22"
                                                : item.status === "REVIEWED"
                                                    ? "250, 204, 21"
                                                    : "34, 197, 94"
                                                }, 0.1)`,
                                            color: getStatusColor(item.status),
                                            border: `1px solid rgba(${item.status === "NEW"
                                                ? "249, 115, 22"
                                                : item.status === "REVIEWED"
                                                    ? "250, 204, 21"
                                                    : "34, 197, 94"
                                                }, 0.2)`,
                                            textTransform: "uppercase",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {getStatusIcon(item.status)}
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                            <p
                                style={{
                                    color: "var(--text-secondary)",
                                    fontSize: "14px",
                                    lineHeight: 1.6,
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {item.message}
                            </p>
                            {item.adminResponse && (
                                <div
                                    style={{
                                        marginTop: "16px",
                                        padding: "12px 16px",
                                        background: "rgba(250, 204, 21, 0.05)",
                                        border: "1px solid rgba(250, 204, 21, 0.1)",
                                        borderRadius: "8px",
                                    }}
                                >
                                    <div style={{ fontSize: "12px", color: "var(--yellow)", marginBottom: "8px", fontWeight: 600 }}>
                                        Admin Response:
                                    </div>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{item.adminResponse}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
