"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Award,
    ArrowLeft,
    Loader2,
    Trophy,
    Droplet,
    ExternalLink,
    Calendar,
    CheckCircle
} from "lucide-react";

interface Certificate {
    id: string;
    verificationId: string;
    type: "COMPETITION" | "FIRST_BLOOD";
    team: {
        id: string;
        name: string;
        totalPoints: number;
        solvedCount: number;
    };
    metadata: any;
    createdAt: string;
}

interface Stats {
    total: number;
    competition: number;
    firstBlood: number;
}

export default function AdminCertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, competition: 0, firstBlood: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "COMPETITION" | "FIRST_BLOOD">("all");

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            const res = await fetch("/api/admin/certificates");
            const data = await res.json();
            if (data.success) {
                setCertificates(data.certificates);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching certificates:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCertificates = filter === "all"
        ? certificates
        : certificates.filter(c => c.type === filter);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <Loader2 size={32} className="spin" style={{ color: "var(--yellow)" }} />
            </div>
        );
    }

    return (
        <div style={{ padding: "32px 24px" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <Link
                    href="/admin"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        fontSize: "14px",
                        marginBottom: "16px"
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Admin
                </Link>
                <h1 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "var(--yellow)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <Award size={28} />
                    Certificate Management
                </h1>
                <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
                    View and track all issued certificates
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "32px"
            }}>
                <div className="card" style={{
                    textAlign: "center",
                    padding: "24px",
                    borderLeft: "3px solid var(--yellow)"
                }}>
                    <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--yellow)" }}>{stats.total}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Total Certificates</p>
                </div>
                <div className="card" style={{
                    textAlign: "center",
                    padding: "24px",
                    borderLeft: "3px solid var(--yellow)"
                }}>
                    <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--yellow)" }}>{stats.competition}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Competition Certs</p>
                </div>
                <div className="card" style={{
                    textAlign: "center",
                    padding: "24px",
                    borderLeft: "3px solid #ef4444"
                }}>
                    <p style={{ fontSize: "32px", fontWeight: 700, color: "#ef4444" }}>{stats.firstBlood}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>First Blood Badges</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                {[
                    { key: "all", label: "All" },
                    { key: "COMPETITION", label: "Competition" },
                    { key: "FIRST_BLOOD", label: "First Blood" }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as any)}
                        style={{
                            padding: "8px 16px",
                            background: filter === tab.key ? "var(--yellow)" : "transparent",
                            color: filter === tab.key ? "#000" : "var(--text-muted)",
                            border: `1px solid ${filter === tab.key ? "var(--yellow)" : "var(--black-border)"}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: filter === tab.key ? 600 : 400,
                            transition: "all 0.2s"
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Certificates Table */}
            {filteredCertificates.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "48px" }}>
                    <Award size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px", opacity: 0.5 }} />
                    <p style={{ color: "var(--text-muted)" }}>No certificates found</p>
                </div>
            ) : (
                <div className="card" style={{ overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--black-border)" }}>
                                <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>Type</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>Team</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>Points</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>Issued</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>Verify</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCertificates.map(cert => (
                                <tr key={cert.id} style={{ borderBottom: "1px solid var(--black-border)" }}>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {cert.type === "COMPETITION" ? (
                                                <Trophy size={18} style={{ color: "var(--yellow)" }} />
                                            ) : (
                                                <Droplet size={18} style={{ color: "#ef4444" }} />
                                            )}
                                            <span style={{ fontSize: "14px" }}>
                                                {cert.type === "COMPETITION" ? "Competition" : "First Blood"}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <span style={{ fontWeight: 600 }}>{cert.team.name}</span>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <span style={{ color: "var(--yellow)" }}>{cert.team.totalPoints}</span>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px" }}>
                                            <Calendar size={14} />
                                            {new Date(cert.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <Link
                                            href={`/verify/${cert.verificationId}`}
                                            target="_blank"
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                color: "var(--yellow)",
                                                textDecoration: "none",
                                                fontSize: "13px"
                                            }}
                                        >
                                            <CheckCircle size={14} />
                                            Verify
                                            <ExternalLink size={12} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
