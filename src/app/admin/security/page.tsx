"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Shield,
    AlertTriangle,
    Ban,
    RefreshCw,
    Unlock,
    Clock,
    Activity,
    TrendingUp,
    UserX,
    Flag,
    Users,
    Zap,
    Eye,
    Trash2,
    Search,
    Filter,
    ChevronRight,
    Minus,
    ShieldAlert,
    Fingerprint,
    Globe,
    History
} from "lucide-react";

interface ThreatLog {
    id: string;
    ip: string;
    type: string;
    severity: number;
    details: string | null;
    wasBlocked: boolean;
    createdAt: string;
}

interface BlockedIP {
    ip: string;
    reason: string;
    severity: number;
    strikeCount: number;
    blockedAt: string;
    expiresAt: string | null;
}

interface DashboardStats {
    activeBlocks: number;
    threatsLast24h: number;
    threatsLastHour: number;
    topThreatTypes: Array<{ type: string; count: number }>;
    recentThreats: ThreatLog[];
}

interface IntegrityAlerts {
    flagSharingAlerts: Array<{
        ip: string;
        teams: string[];
        challengeCount: number;
        lastSeen: string;
    }>;
    suspiciousSolves: Array<{
        teamName: string;
        challengeTitle: string;
        createdAt: string;
    }>;
    multiAccountAlerts: Array<{
        ip: string;
        teams: Array<{ id: string; name: string }>;
        firstSeen: string;
    }>;
}

interface IPHistory {
    ip: string;
    threats: ThreatLog[];
    totalCount: number;
    threatScore: number;
}

export default function SecurityPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [integrityAlerts, setIntegrityAlerts] = useState<IntegrityAlerts | null>(null);
    const [error, setError] = useState<string | null>(null);

    // View states
    const [activeTab, setActiveTab] = useState<"overview" | "blocked" | "threats" | "integrity">("overview");
    const [searchQuery, setSearchQuery] = useState("");

    // Block IP form
    const [blockIP, setBlockIP] = useState("");
    const [blockReason, setBlockReason] = useState("");
    const [blocking, setBlocking] = useState(false);

    // IP History modal
    const [selectedIP, setSelectedIP] = useState<string | null>(null);
    const [ipHistory, setIpHistory] = useState<IPHistory | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Fetch dashboard data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/security?action=dashboard");
            const data = await res.json();

            if (data.success) {
                setStats(data.data.stats);
                setBlockedIPs(data.data.blockedIPs);
                setIntegrityAlerts(data.data.integrityAlerts);
                setError(null);
            } else {
                setError(data.message || "Failed to fetch security data");
            }
        } catch {
            setError("Failed to connect to security API");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Fetch IP history
    const fetchIPHistory = async (ip: string) => {
        setSelectedIP(ip);
        setLoadingHistory(true);
        try {
            const res = await fetch(`/api/admin/security?action=ip-history&ip=${encodeURIComponent(ip)}`);
            const data = await res.json();
            if (data.success) {
                setIpHistory(data.data);
            }
        } catch {
            setIpHistory(null);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Handle blocking an IP
    const handleBlockIP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!blockIP || !blockReason) return;

        setBlocking(true);
        try {
            const res = await fetch("/api/admin/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ip: blockIP, reason: blockReason }),
            });
            const data = await res.json();

            if (data.success) {
                setBlockIP("");
                setBlockReason("");
                fetchData();
            } else {
                alert(data.message || "Failed to block IP");
            }
        } catch {
            alert("Failed to block IP");
        } finally {
            setBlocking(false);
        }
    };

    // Handle unblocking an IP
    const handleUnblockIP = async (ip: string) => {
        if (!confirm(`Are you sure you want to unblock ${ip}?`)) return;

        try {
            const res = await fetch(`/api/admin/security?ip=${encodeURIComponent(ip)}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                fetchData();
            } else {
                alert(data.message || "Failed to unblock IP");
            }
        } catch {
            alert("Failed to unblock IP");
        }
    };

    // Cleanup expired blocks
    const handleCleanup = async () => {
        try {
            const res = await fetch("/api/admin/security?action=cleanup");
            const data = await res.json();
            alert(data.message || "Cleanup complete");
            fetchData();
        } catch {
            alert("Cleanup failed");
        }
    };

    // Get severity color
    const getSeverityColor = (severity: number) => {
        if (severity >= 4) return "#ef4444";
        if (severity >= 3) return "#f97316";
        if (severity >= 2) return "#eab308";
        return "#22c55e";
    };

    // Get threat type display
    const getThreatTypeDisplay = (type: string) => {
        const map: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
            "HONEYPOT_TRIGGER": { label: "Honeypot", icon: <Zap size={14} />, color: "#ef4444" },
            "FLAG_SHARING": { label: "Flag Sharing", icon: <Flag size={14} />, color: "#f97316" },
            "MULTI_ACCOUNT": { label: "Multi-Account", icon: <Users size={14} />, color: "#f97316" },
            "BRUTE_FORCE": { label: "Brute Force", icon: <AlertTriangle size={14} />, color: "#ef4444" },
            "INJECTION_ATTEMPT": { label: "Injection", icon: <ShieldAlert size={14} />, color: "#ef4444" },
            "SUSPICIOUS_SOLVE": { label: "Sus Solve", icon: <Eye size={14} />, color: "#eab308" },
            "RATE_LIMIT_VIOLATION": { label: "Rate Limit", icon: <Activity size={14} />, color: "#eab308" },
            "AUTOMATION_DETECTED": { label: "Bot Detected", icon: <Fingerprint size={14} />, color: "#f97316" },
            "ENUMERATION": { label: "Enumeration", icon: <Search size={14} />, color: "#eab308" },
            "BLOCKED_PATH": { label: "Blocked Path", icon: <Ban size={14} />, color: "#ef4444" },
            "BLOCKED_AGENT": { label: "Blocked Agent", icon: <Globe size={14} />, color: "#ef4444" },
        };
        return map[type] || { label: type.replace(/_/g, " "), icon: <Shield size={14} />, color: "#6b7280" };
    };

    // Filter blocked IPs by search
    const filteredBlockedIPs = blockedIPs.filter(b =>
        b.ip.includes(searchQuery) || b.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !stats) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
                <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", color: "var(--yellow)" }} />
            </div>
        );
    }

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
                    <Shield size={36} style={{ color: "var(--yellow)" }} />
                    Security Center
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                    Threat intelligence, IP management, and competition integrity monitoring.
                </p>
            </div>

            {error && (
                <div className="card" style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    marginBottom: "24px",
                    color: "#ef4444"
                }}>
                    <AlertTriangle size={20} style={{ marginRight: "8px" }} />
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "32px"
            }} className="admin-stats-grid">
                <StatCard
                    label="Blocked IPs"
                    value={stats?.activeBlocks || 0}
                    icon={Ban}
                    color="#ef4444"
                    status={stats?.activeBlocks && stats.activeBlocks > 0 ? "ACTIVE" : "CLEAR"}
                    isHealthy={!stats?.activeBlocks || stats.activeBlocks === 0}
                />
                <StatCard
                    label="Threats (24h)"
                    value={stats?.threatsLast24h || 0}
                    icon={AlertTriangle}
                    color="#f97316"
                    status={stats?.threatsLast24h && stats.threatsLast24h > 10 ? "HIGH" : stats?.threatsLast24h && stats.threatsLast24h > 0 ? "NORMAL" : "CLEAR"}
                    isHealthy={!stats?.threatsLast24h || stats.threatsLast24h < 10}
                />
                <StatCard
                    label="Threats (1h)"
                    value={stats?.threatsLastHour || 0}
                    icon={Activity}
                    color="#eab308"
                    status="LIVE"
                    isHealthy={true}
                    isLive
                />
                <StatCard
                    label="Top Threat"
                    value={stats?.topThreatTypes?.[0]?.count || 0}
                    icon={TrendingUp}
                    color="var(--yellow)"
                    status={stats?.topThreatTypes?.[0]?.type?.replace(/_/g, " ") || "NONE"}
                    isHealthy={true}
                />
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "24px",
                borderBottom: "1px solid var(--black-border)",
                paddingBottom: "16px"
            }}>
                {[
                    { id: "overview", label: "Overview", icon: Shield },
                    { id: "blocked", label: "Blocked IPs", icon: Ban },
                    { id: "threats", label: "Threat Log", icon: AlertTriangle },
                    { id: "integrity", label: "Integrity Alerts", icon: Flag },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 20px",
                            background: activeTab === tab.id ? "rgba(250, 204, 21, 0.1)" : "transparent",
                            border: activeTab === tab.id ? "1px solid rgba(250, 204, 21, 0.3)" : "1px solid transparent",
                            borderRadius: "8px",
                            color: activeTab === tab.id ? "var(--yellow)" : "var(--text-secondary)",
                            cursor: "pointer",
                            fontFamily: "var(--font-heading)",
                            fontWeight: 600,
                            fontSize: "14px",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {tab.id === "blocked" && blockedIPs.length > 0 && (
                            <span style={{
                                background: "#ef4444",
                                color: "white",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: 700
                            }}>{blockedIPs.length}</span>
                        )}
                    </button>
                ))}

                <div style={{ flex: 1 }} />

                <button
                    onClick={fetchData}
                    disabled={loading}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        background: "var(--black-card)",
                        border: "1px solid var(--black-border)",
                        borderRadius: "8px",
                        color: "var(--text-secondary)",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-heading)",
                    }}
                >
                    <RefreshCw size={16} className={loading ? "spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    {/* Block IP Card */}
                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                            <h2 style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "1.25rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px"
                            }}>
                                <Ban size={20} style={{ color: "#ef4444" }} />
                                Block an IP
                            </h2>
                        </div>
                        <form onSubmit={handleBlockIP} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "block", fontFamily: "var(--font-heading)" }}>
                                    IP Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="192.168.1.1"
                                    value={blockIP}
                                    onChange={(e) => setBlockIP(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        background: "var(--black)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: "14px",
                                        fontFamily: "monospace",
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "block", fontFamily: "var(--font-heading)" }}>
                                    Reason
                                </label>
                                <input
                                    type="text"
                                    placeholder="Suspicious activity, attack attempt, etc."
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        background: "var(--black)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: "14px",
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={blocking || !blockIP || !blockReason}
                                style={{
                                    padding: "14px",
                                    background: blocking || !blockIP || !blockReason ? "var(--black-border)" : "#ef4444",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontWeight: 700,
                                    cursor: blocking || !blockIP || !blockReason ? "not-allowed" : "pointer",
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "14px",
                                    letterSpacing: "0.05em",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px"
                                }}
                            >
                                <Ban size={16} />
                                {blocking ? "BLOCKING..." : "BLOCK IP"}
                            </button>
                        </form>
                    </div>

                    {/* Recent Threats */}
                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                            <h2 style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "1.25rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px"
                            }}>
                                <AlertTriangle size={20} style={{ color: "#f97316" }} />
                                Recent Threats
                            </h2>
                            <button
                                onClick={() => setActiveTab("threats")}
                                style={{
                                    fontSize: "14px",
                                    color: "var(--yellow)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontFamily: "var(--font-heading)",
                                    fontWeight: 500,
                                }}
                            >
                                View All <ChevronRight size={16} />
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                            {!stats?.recentThreats || stats.recentThreats.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                    <Shield size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                                    <div>No threats in last 24 hours</div>
                                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#22c55e" }}>Platform is secure 🛡️</div>
                                </div>
                            ) : (
                                stats.recentThreats.slice(0, 8).map((threat, i) => {
                                    const typeInfo = getThreatTypeDisplay(threat.type);
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "12px",
                                                background: "var(--black)",
                                                borderRadius: "8px",
                                                borderLeft: `3px solid ${getSeverityColor(threat.severity)}`,
                                            }}
                                        >
                                            <div style={{ color: typeInfo.color }}>{typeInfo.icon}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                                                    {typeInfo.label}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                                    {threat.ip}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                                {new Date(threat.createdAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="card" style={{ gridColumn: "span 2" }}>
                        <h2 style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: "20px"
                        }}>
                            Security Systems Status
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                            <StatusRow label="Threat Intelligence" status="ACTIVE" isHealthy={true} />
                            <StatusRow label="Rate Limiting" status="ACTIVE" isHealthy={true} />
                            <StatusRow label="Honeypots" status="ARMED" isHealthy={true} />
                            <StatusRow label="Integrity Monitor" status="SCANNING" isHealthy={true} />
                            <StatusRow label="IP Blocklist" status={`${blockedIPs.length} BLOCKED`} isHealthy={true} />
                            <StatusRow label="Anti-Automation" status="ACTIVE" isHealthy={true} />
                            <StatusRow label="Session Protection" status="ACTIVE" isHealthy={true} />
                            <StatusRow label="Firewall" status="13 LAYERS" isHealthy={true} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "blocked" && (
                <div className="card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h2 style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}>
                            <UserX size={20} style={{ color: "#ef4444" }} />
                            Blocked IPs ({blockedIPs.length})
                        </h2>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <div style={{ position: "relative" }}>
                                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    type="text"
                                    placeholder="Search IPs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        padding: "10px 12px 10px 36px",
                                        background: "var(--black)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: "13px",
                                        width: "200px",
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleCleanup}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 16px",
                                    background: "var(--black)",
                                    border: "1px solid var(--black-border)",
                                    borderRadius: "8px",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "13px",
                                }}
                            >
                                <Trash2 size={14} /> Cleanup Expired
                            </button>
                        </div>
                    </div>

                    {filteredBlockedIPs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                            <Shield size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <div>{searchQuery ? "No matching IPs found" : "No blocked IPs"}</div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {/* Table Header */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "180px 1fr 100px 100px 150px 120px",
                                gap: "16px",
                                padding: "12px 16px",
                                background: "var(--black)",
                                borderRadius: "8px",
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                fontFamily: "var(--font-heading)"
                            }}>
                                <div>IP Address</div>
                                <div>Reason</div>
                                <div>Severity</div>
                                <div>Strikes</div>
                                <div>Expires</div>
                                <div>Actions</div>
                            </div>

                            {/* Table Rows */}
                            {filteredBlockedIPs.map((blocked) => (
                                <div
                                    key={blocked.ip}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "180px 1fr 100px 100px 150px 120px",
                                        gap: "16px",
                                        padding: "16px",
                                        background: "var(--black)",
                                        borderRadius: "8px",
                                        borderLeft: `3px solid ${blocked.expiresAt ? "#eab308" : "#ef4444"}`,
                                        alignItems: "center",
                                    }}
                                >
                                    <div style={{ fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px" }}>
                                        {blocked.ip}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {blocked.reason}
                                    </div>
                                    <div>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "4px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            background: `${getSeverityColor(blocked.severity)}20`,
                                            color: getSeverityColor(blocked.severity),
                                        }}>
                                            SEV {blocked.severity}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: blocked.strikeCount >= 4 ? "#ef4444" : "var(--text-secondary)" }}>
                                        {blocked.strikeCount}x
                                    </div>
                                    <div style={{ fontSize: "12px", color: blocked.expiresAt ? "#eab308" : "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Clock size={12} />
                                        {blocked.expiresAt ? new Date(blocked.expiresAt).toLocaleDateString() : "Permanent"}
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            onClick={() => fetchIPHistory(blocked.ip)}
                                            style={{
                                                padding: "6px 10px",
                                                background: "transparent",
                                                border: "1px solid var(--black-border)",
                                                borderRadius: "4px",
                                                color: "var(--text-secondary)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                fontSize: "11px",
                                            }}
                                        >
                                            <History size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleUnblockIP(blocked.ip)}
                                            style={{
                                                padding: "6px 10px",
                                                background: "transparent",
                                                border: "1px solid var(--yellow)",
                                                borderRadius: "4px",
                                                color: "var(--yellow)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                fontSize: "11px",
                                            }}
                                        >
                                            <Unlock size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "threats" && (
                <div className="card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h2 style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}>
                            <AlertTriangle size={20} style={{ color: "#f97316" }} />
                            Threat Log (Last 24 Hours)
                        </h2>
                    </div>

                    {!stats?.recentThreats || stats.recentThreats.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                            <Shield size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <div>No threats detected</div>
                            <div style={{ fontSize: "12px", marginTop: "4px", color: "#22c55e" }}>All systems secure 🛡️</div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {stats.recentThreats.map((threat, i) => {
                                const typeInfo = getThreatTypeDisplay(threat.type);
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "150px 180px 1fr 80px 100px",
                                            gap: "16px",
                                            padding: "16px",
                                            background: "var(--black)",
                                            borderRadius: "8px",
                                            borderLeft: `3px solid ${getSeverityColor(threat.severity)}`,
                                            alignItems: "center",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                                                {typeInfo.label}
                                            </span>
                                        </div>
                                        <div style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--text-secondary)" }}>
                                            {threat.ip}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {threat.details || "No details"}
                                        </div>
                                        <div>
                                            <span style={{
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                background: `${getSeverityColor(threat.severity)}20`,
                                                color: getSeverityColor(threat.severity),
                                            }}>
                                                SEV {threat.severity}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                            {new Date(threat.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "integrity" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Flag Sharing Alerts */}
                    <div className="card">
                        <h2 style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: "#ef4444",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}>
                            <Flag size={20} />
                            Flag Sharing Alerts
                        </h2>
                        {!integrityAlerts?.flagSharingAlerts?.length ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                No flag sharing detected
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {integrityAlerts.flagSharingAlerts.map((alert, i) => (
                                    <div key={i} style={{ padding: "16px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                                        <div style={{ fontFamily: "monospace", fontWeight: 600, marginBottom: "4px" }}>{alert.ip}</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                            {alert.challengeCount} challenge(s) flagged
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Multi-Account Alerts */}
                    <div className="card">
                        <h2 style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: "#f97316",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}>
                            <Users size={20} />
                            Multi-Account Alerts
                        </h2>
                        {!integrityAlerts?.multiAccountAlerts?.length ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                No multi-account abuse detected
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {integrityAlerts.multiAccountAlerts.map((alert, i) => (
                                    <div key={i} style={{ padding: "16px", background: "rgba(249, 115, 22, 0.1)", borderRadius: "8px", border: "1px solid rgba(249, 115, 22, 0.2)" }}>
                                        <div style={{ fontFamily: "monospace", fontWeight: 600, marginBottom: "4px" }}>{alert.ip}</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                            Linked to {alert.teams.length} team(s)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* IP History Modal */}
            {selectedIP && (
                <div
                    onClick={() => setSelectedIP(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.8)",
                        zIndex: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "var(--black-card)",
                            border: "1px solid var(--black-border)",
                            borderRadius: "16px",
                            padding: "24px",
                            maxWidth: "600px",
                            width: "100%",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                IP History: {selectedIP}
                            </h3>
                            <button
                                onClick={() => setSelectedIP(null)}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "24px" }}
                            >
                                ×
                            </button>
                        </div>

                        {loadingHistory ? (
                            <div style={{ textAlign: "center", padding: "40px" }}>
                                <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "var(--yellow)" }} />
                            </div>
                        ) : ipHistory ? (
                            <div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                                    <div style={{ padding: "16px", background: "var(--black)", borderRadius: "8px" }}>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Threat Score</div>
                                        <div style={{ fontSize: "24px", fontWeight: 700, color: getSeverityColor(Math.ceil(ipHistory.threatScore / 25)) }}>
                                            {ipHistory.threatScore}/100
                                        </div>
                                    </div>
                                    <div style={{ padding: "16px", background: "var(--black)", borderRadius: "8px" }}>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Total Threats</div>
                                        <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
                                            {ipHistory.totalCount}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {ipHistory.threats.map((t, i) => {
                                        const typeInfo = getThreatTypeDisplay(t.type);
                                        return (
                                            <div key={i} style={{
                                                padding: "12px",
                                                background: "var(--black)",
                                                borderRadius: "8px",
                                                borderLeft: `3px solid ${getSeverityColor(t.severity)}`,
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                    <span style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                                                    <span style={{ fontWeight: 600, fontSize: "13px" }}>{typeInfo.label}</span>
                                                    <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-muted)" }}>
                                                        {new Date(t.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                {t.details && (
                                                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{t.details}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                No history found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Stat Card matching admin dashboard style
function StatCard({
    label,
    value,
    icon: Icon,
    color,
    status,
    isHealthy,
    isLive
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ size: number }>;
    color: string;
    status: string;
    isHealthy: boolean;
    isLive?: boolean;
}) {
    return (
        <div className="card card-hover">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: `${color}20`,
                    border: `1px solid ${color}40`,
                    color: color
                }}>
                    <Icon size={24} />
                </div>
                <span style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-body)",
                    color: isLive ? "#22c55e" : isHealthy ? "var(--text-muted)" : "#f59e0b",
                    background: isLive ? "rgba(34, 197, 94, 0.1)" : "var(--black-lighter)",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    border: isLive ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid var(--black-border)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                }}>
                    {isLive && (
                        <span style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "#22c55e",
                            animation: "pulse 2s infinite"
                        }} />
                    )}
                    {status}
                </span>
            </div>
            <div style={{
                fontFamily: "var(--font-heading)",
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "var(--yellow)",
                marginBottom: "8px",
                lineHeight: 1
            }}>
                {value}
            </div>
            <div style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontFamily: "var(--font-heading)",
                fontWeight: 500
            }}>
                {label}
            </div>
        </div>
    );
}

// Status Row matching admin dashboard style
function StatusRow({ label, status, isHealthy }: { label: string; status: string; isHealthy: boolean }) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "var(--black)",
            borderRadius: "8px"
        }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px", fontFamily: "var(--font-heading)" }}>{label}</span>
            <span style={{
                color: isHealthy ? "#22c55e" : "#f59e0b",
                fontSize: "11px",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                letterSpacing: "0.1em"
            }}>
                {status}
            </span>
        </div>
    );
}
