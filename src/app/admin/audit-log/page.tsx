"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Loader2,
    Search,
    ChevronLeft,
    ChevronRight,
    Filter
} from "lucide-react";

interface AuditLog {
    id: string;
    adminId: string;
    adminEmail: string;
    action: string;
    entityType: string;
    entityId: string | null;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
}

interface Filters {
    actions: string[];
    entityTypes: string[];
}

export default function AdminAuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<Filters>({ actions: [], entityTypes: [] });
    const [selectedAction, setSelectedAction] = useState("");
    const [selectedEntityType, setSelectedEntityType] = useState("");

    useEffect(() => {
        fetchLogs();
    }, [page, selectedAction, selectedEntityType]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "25"
            });
            if (selectedAction) params.set("action", selectedAction);
            if (selectedEntityType) params.set("entityType", selectedEntityType);

            const res = await fetch(`/api/admin/audit-log?${params}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
                setTotalPages(data.pagination.totalPages);
                setFilters(data.filters);
            }
        } catch (error) {
            console.error("Error fetching audit log:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes("CREATE")) return "#22c55e";
        if (action.includes("DELETE")) return "#ef4444";
        if (action.includes("UPDATE") || action.includes("CHANGE")) return "#f59e0b";
        if (action.includes("EXPORT")) return "#3b82f6";
        return "var(--text-muted)";
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const parseDetails = (details: string | null) => {
        if (!details) return null;
        try {
            return JSON.parse(details);
        } catch {
            return details;
        }
    };

    return (
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
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
                    <FileText size={32} style={{ color: "var(--yellow)" }} />
                    Audit Log
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                    Track all administrative actions on the platform.
                </p>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "24px" }}>
                <div style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    flexWrap: "wrap"
                }}>
                    <Filter size={20} style={{ color: "var(--yellow)" }} />

                    <select
                        value={selectedAction}
                        onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
                        style={{
                            padding: "10px 16px",
                            background: "var(--black-lighter)",
                            border: "1px solid var(--black-border)",
                            borderRadius: "8px",
                            color: "var(--text-primary)",
                            fontSize: "14px",
                            minWidth: "180px"
                        }}
                    >
                        <option value="">All Actions</option>
                        {filters.actions.map(action => (
                            <option key={action} value={action}>{formatAction(action)}</option>
                        ))}
                    </select>

                    <select
                        value={selectedEntityType}
                        onChange={(e) => { setSelectedEntityType(e.target.value); setPage(1); }}
                        style={{
                            padding: "10px 16px",
                            background: "var(--black-lighter)",
                            border: "1px solid var(--black-border)",
                            borderRadius: "8px",
                            color: "var(--text-primary)",
                            fontSize: "14px",
                            minWidth: "180px"
                        }}
                    >
                        <option value="">All Entity Types</option>
                        {filters.entityTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    {(selectedAction || selectedEntityType) && (
                        <button
                            onClick={() => { setSelectedAction(""); setSelectedEntityType(""); setPage(1); }}
                            style={{
                                padding: "10px 16px",
                                background: "var(--black-lighter)",
                                border: "1px solid var(--black-border)",
                                borderRadius: "8px",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                fontSize: "14px"
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Logs Table */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                    <Loader2 size={32} className="spin" style={{ color: "var(--yellow)" }} />
                </div>
            ) : logs.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "60px" }}>
                    <FileText size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px", opacity: 0.5 }} />
                    <p style={{ color: "var(--text-muted)" }}>No audit logs found</p>
                </div>
            ) : (
                <>
                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "var(--black-lighter)" }}>
                                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", borderBottom: "1px solid var(--black-border)" }}>
                                        Timestamp
                                    </th>
                                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", borderBottom: "1px solid var(--black-border)" }}>
                                        Admin
                                    </th>
                                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", borderBottom: "1px solid var(--black-border)" }}>
                                        Action
                                    </th>
                                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", borderBottom: "1px solid var(--black-border)" }}>
                                        Entity
                                    </th>
                                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", borderBottom: "1px solid var(--black-border)" }}>
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: "1px solid var(--black-border)" }}>
                                        <td style={{ padding: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "16px", fontSize: "14px" }}>
                                            <span style={{ color: "var(--yellow)" }}>{log.adminEmail}</span>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <span style={{
                                                padding: "4px 10px",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                background: `${getActionColor(log.action)}20`,
                                                color: getActionColor(log.action),
                                                border: `1px solid ${getActionColor(log.action)}40`
                                            }}>
                                                {formatAction(log.action)}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px", fontSize: "14px" }}>
                                            <span style={{ color: "var(--text-secondary)" }}>{log.entityType}</span>
                                            {log.entityId && (
                                                <span style={{
                                                    fontSize: "12px",
                                                    color: "var(--text-muted)",
                                                    marginLeft: "8px"
                                                }}>
                                                    #{log.entityId.slice(0, 8)}...
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: "16px", fontSize: "13px", color: "var(--text-muted)", maxWidth: "300px" }}>
                                            {log.details && (
                                                <details style={{ cursor: "pointer" }}>
                                                    <summary style={{
                                                        color: "var(--yellow)",
                                                        fontSize: "12px",
                                                        userSelect: "none"
                                                    }}>
                                                        View details
                                                    </summary>
                                                    <pre style={{
                                                        marginTop: "8px",
                                                        padding: "12px",
                                                        background: "var(--black-lighter)",
                                                        borderRadius: "6px",
                                                        fontSize: "11px",
                                                        overflow: "auto",
                                                        maxHeight: "200px",
                                                        whiteSpace: "pre-wrap",
                                                        wordBreak: "break-word"
                                                    }}>
                                                        {JSON.stringify(parseDetails(log.details), null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "16px",
                            marginTop: "24px"
                        }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    padding: "10px 16px",
                                    background: "var(--black-card)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: page === 1 ? "var(--text-muted)" : "var(--text-primary)",
                                    cursor: page === 1 ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                            >
                                <ChevronLeft size={18} />
                                Previous
                            </button>
                            <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{
                                    padding: "10px 16px",
                                    background: "var(--black-card)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: page === totalPages ? "var(--text-muted)" : "var(--text-primary)",
                                    cursor: page === totalPages ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                            >
                                Next
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
