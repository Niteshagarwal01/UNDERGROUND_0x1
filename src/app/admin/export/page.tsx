"use client";

import { useState } from "react";
import {
    Download,
    Users,
    Flag,
    Shield,
    FileText,
    Loader2,
    Check,
    Trophy
} from "lucide-react";

interface ExportOption {
    type: string;
    label: string;
    description: string;
    icon: React.ElementType;
}

const exportOptions: ExportOption[] = [
    {
        type: "users",
        label: "Users",
        description: "All registered users with stats",
        icon: Users
    },
    {
        type: "teams",
        label: "Teams",
        description: "All teams with members and scores",
        icon: Shield
    },
    {
        type: "challenges",
        label: "Challenges",
        description: "All challenges with metadata",
        icon: Flag
    },
    {
        type: "submissions",
        label: "Submissions",
        description: "All flag submission attempts",
        icon: FileText
    },
    {
        type: "solves",
        label: "Solves",
        description: "Successful solves with timestamps",
        icon: Trophy
    }
];

export default function AdminExportPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const [lastExport, setLastExport] = useState<{ type: string; time: Date } | null>(null);

    const handleExport = async (type: string) => {
        setLoading(type);
        try {
            const res = await fetch(`/api/admin/export?type=${type}`);

            if (!res.ok) {
                throw new Error("Export failed");
            }

            // Get the blob and download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${type}_export.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setLastExport({ type, time: new Date() });
        } catch (error) {
            console.error("Export error:", error);
            alert("Failed to export data");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "40px" }}>
                <h1 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                }}>
                    <Download size={32} style={{ color: "var(--yellow)" }} />
                    Data Export
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                    Download platform data as CSV files for analysis and backup.
                </p>
            </div>

            {/* Last Export */}
            {lastExport && (
                <div style={{
                    padding: "16px 20px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    color: "#22c55e"
                }}>
                    <Check size={20} />
                    Exported {lastExport.type} at {lastExport.time.toLocaleTimeString()}
                </div>
            )}

            {/* Export Options */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px"
            }}>
                {exportOptions.map((option) => {
                    const Icon = option.icon;
                    const isLoading = loading === option.type;

                    return (
                        <div
                            key={option.type}
                            className="card card-hover"
                            style={{ cursor: "pointer" }}
                            onClick={() => !loading && handleExport(option.type)}
                        >
                            <div style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "16px"
                            }}>
                                <div style={{
                                    padding: "12px",
                                    borderRadius: "10px",
                                    background: "rgba(250, 204, 21, 0.1)",
                                    border: "1px solid rgba(250, 204, 21, 0.2)"
                                }}>
                                    <Icon size={24} style={{ color: "var(--yellow)" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontFamily: "var(--font-heading)",
                                        fontSize: "1.1rem",
                                        marginBottom: "4px"
                                    }}>
                                        {option.label}
                                    </h3>
                                    <p style={{
                                        fontSize: "13px",
                                        color: "var(--text-muted)"
                                    }}>
                                        {option.description}
                                    </p>
                                </div>
                                <button
                                    disabled={!!loading}
                                    style={{
                                        padding: "10px 16px",
                                        background: isLoading ? "var(--black-lighter)" : "var(--yellow)",
                                        border: "none",
                                        borderRadius: "8px",
                                        color: isLoading ? "var(--text-muted)" : "var(--black)",
                                        cursor: loading ? "not-allowed" : "pointer",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="spin" />
                                    ) : (
                                        <Download size={16} />
                                    )}
                                    CSV
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info */}
            <div className="card" style={{ marginTop: "32px" }}>
                <h3 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1rem",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>
                    <FileText size={18} style={{ color: "var(--yellow)" }} />
                    Export Information
                </h3>
                <ul style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    paddingLeft: "20px",
                    lineHeight: 1.8
                }}>
                    <li>All exports are in CSV format, compatible with Excel/Google Sheets</li>
                    <li>Submissions export is limited to the most recent 10,000 entries</li>
                    <li>Sensitive data (passwords, API keys) is never included in exports</li>
                    <li>Exports are logged in the audit log for security tracking</li>
                </ul>
            </div>
        </div>
    );
}
