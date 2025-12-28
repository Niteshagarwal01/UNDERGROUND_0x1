"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowLeft, Loader2, Award, Shield, Trophy } from "lucide-react";

interface CertificateData {
    id: string;
    verificationId: string;
    type: string;
    team: {
        name: string;
        totalPoints: number;
        solvedCount: number;
    };
    metadata: any;
    issuedAt: string;
}

export default function VerifyPage() {
    const params = useParams();
    const [certificate, setCertificate] = useState<CertificateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const verifyId = params.id as string;
        if (verifyId) {
            verifyCertificate(verifyId);
        }
    }, [params.id]);

    const verifyCertificate = async (id: string) => {
        try {
            const res = await fetch(`/api/certificates/verify/${id}`);
            const data = await res.json();
            if (data.success) {
                setCertificate(data.certificate);
            } else {
                setError(true);
            }
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <Loader2 size={32} className="spin" style={{ color: "var(--yellow)" }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 24px" }}>
            <Link
                href="/"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    fontSize: "14px",
                    marginBottom: "32px"
                }}
            >
                <ArrowLeft size={16} />
                Back to Home
            </Link>

            {error ? (
                <div className="card card-elevated" style={{ textAlign: "center", padding: "48px" }}>
                    <div style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px"
                    }}>
                        <XCircle size={40} style={{ color: "#ef4444" }} />
                    </div>
                    <h1 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#ef4444",
                        marginBottom: "12px"
                    }}>
                        Certificate Not Found
                    </h1>
                    <p style={{ color: "var(--text-secondary)" }}>
                        This certificate does not exist or has been revoked.
                    </p>
                </div>
            ) : certificate ? (
                <div className="card card-elevated" style={{ textAlign: "center", padding: "48px" }}>
                    <div style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "rgba(34, 197, 94, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px"
                    }}>
                        <CheckCircle size={40} style={{ color: "#22c55e" }} />
                    </div>
                    <h1 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#22c55e",
                        marginBottom: "12px"
                    }}>
                        Certificate Verified ✓
                    </h1>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
                        This is an authentic UNDERGROUND_0x1 certificate.
                    </p>

                    <div style={{
                        padding: "24px",
                        background: "rgba(250, 204, 21, 0.05)",
                        borderRadius: "12px",
                        border: "1px solid rgba(250, 204, 21, 0.2)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
                            {certificate.type === "COMPETITION" ? (
                                <Trophy size={24} style={{ color: "var(--yellow)" }} />
                            ) : (
                                <Award size={24} style={{ color: "#ef4444" }} />
                            )}
                            <span style={{ fontSize: "18px", fontWeight: 600 }}>
                                {certificate.type === "COMPETITION" ? "Competition Certificate" : "First Blood Badge"}
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-muted)" }}>Team</span>
                                <span style={{ fontWeight: 600 }}>{certificate.team.name}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-muted)" }}>Points</span>
                                <span style={{ fontWeight: 600, color: "var(--yellow)" }}>{certificate.team.totalPoints}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-muted)" }}>Challenges Solved</span>
                                <span style={{ fontWeight: 600 }}>{certificate.team.solvedCount}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-muted)" }}>Issued</span>
                                <span>{new Date(certificate.issuedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "24px" }}>
                        Verification ID: {certificate.verificationId}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
