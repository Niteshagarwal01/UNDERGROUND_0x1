"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Award,
    Download,
    Trophy,
    Droplet,
    Loader2,
    ExternalLink,
    Shield
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface FirstBlood {
    id: string;
    challengeTitle: string;
    categoryName: string;
    points: number;
    solvedAt: string;
}

interface TeamData {
    name: string;
    rank: number;
    totalPoints: number;
    solvedCount: number;
    firstBloods: FirstBlood[];
}

export default function CertificatesPage() {
    const [teamData, setTeamData] = useState<TeamData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            const res = await fetch("/api/user");
            const data = await res.json();

            if (!data.success || !data.user?.team) {
                setError("You must be in a team to view certificates");
                return;
            }

            // Fetch team stats and first bloods
            const statsRes = await fetch(`/api/teams/${data.user.team.id}/stats`);
            const statsData = await statsRes.json();

            setTeamData({
                name: data.user.team.name,
                rank: statsData.rank || 0,
                totalPoints: data.user.team.totalPoints,
                solvedCount: data.user.team.solvedCount,
                firstBloods: statsData.firstBloods || []
            });
        } catch (err) {
            setError("Failed to load team data");
        } finally {
            setLoading(false);
        }
    };

    const downloadCertificate = async (type: string, solveId?: string) => {
        const key = solveId || type;
        setDownloading(key);

        try {
            let url: string;
            let filename: string;

            if (type === "competition") {
                url = "/api/certificates/competition";
                filename = `underground-0x1-certificate-${teamData?.name}.png`;
            } else if (type === "achievement") {
                url = "/api/certificates/achievement";
                filename = `underground-0x1-achievement-${teamData?.name}.png`;
            } else {
                url = `/api/certificates/first-blood/${solveId}`;
                filename = `first-blood-badge-${solveId}.png`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to generate certificate");

            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Download error:", err);
        } finally {
            setDownloading(null);
        }
    };


    if (loading) {
        return (
            <>
                <Navbar />
                <main className="main-content">
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                        <Loader2 size={32} className="spin" style={{ color: "var(--yellow)" }} />
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <main className="main-content">
                    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
                        <Shield size={48} style={{ color: "var(--text-muted)", marginBottom: "16px", opacity: 0.5 }} />
                        <h2 style={{ marginBottom: "12px" }}>No Team Found</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>{error}</p>
                        <Link href="/dashboard" className="btn btn-primary">
                            Go to Dashboard
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="main-content">
                <div style={{ maxWidth: "900px", margin: "0 auto", padding: "100px 24px 40px" }}>
                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: "48px" }}>
                        <div style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            background: "rgba(250, 204, 21, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px"
                        }}>
                            <Award size={28} style={{ color: "var(--yellow)" }} />
                        </div>
                        <h1 style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "2rem",
                            fontWeight: 700,
                            marginBottom: "8px"
                        }}>
                            Certificates & Badges
                        </h1>
                        <p style={{ color: "var(--text-secondary)" }}>
                            Download and share your achievements
                        </p>
                    </div>


                    {/* Competition Certificate */}
                    <div className="card card-elevated" style={{ marginBottom: "32px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                            <div style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(250, 204, 21, 0.05))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                            }}>
                                <Trophy size={36} style={{ color: "var(--yellow)" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px" }}>
                                    Competition Certificate
                                </h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "4px" }}>
                                    Team: {teamData?.name} • Rank #{teamData?.rank} • {teamData?.totalPoints} pts
                                </p>
                                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                                    Professional certificate for LinkedIn and social sharing
                                </p>
                            </div>
                            <button
                                onClick={() => downloadCertificate("competition")}
                                disabled={downloading === "competition"}
                                className="btn btn-primary"
                                style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
                            >
                                {downloading === "competition" ? (
                                    <>
                                        <Loader2 size={16} className="spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        Download
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Achievement Certificate - Only for Top 50 */}
                    {teamData && teamData.rank <= 50 && (
                        <div className="card card-elevated" style={{ marginBottom: "32px", borderLeft: "3px solid #FFD700" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                <div style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "12px",
                                    background: teamData.rank === 1
                                        ? "linear-gradient(135deg, #FFD700, #FFA500)"
                                        : teamData.rank === 2
                                            ? "linear-gradient(135deg, #C0C0C0, #808080)"
                                            : teamData.rank === 3
                                                ? "linear-gradient(135deg, #CD7F32, #8B4513)"
                                                : teamData.rank <= 10
                                                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))"
                                                    : "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    <Award size={36} style={{ color: teamData.rank <= 3 ? "#000" : "#fff" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                                        Achievement Certificate
                                        <span style={{
                                            fontSize: "12px",
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            background: teamData.rank === 1
                                                ? "linear-gradient(135deg, #FFD700, #FFA500)"
                                                : teamData.rank === 2
                                                    ? "linear-gradient(135deg, #C0C0C0, #808080)"
                                                    : teamData.rank === 3
                                                        ? "linear-gradient(135deg, #CD7F32, #8B4513)"
                                                        : teamData.rank <= 10
                                                            ? "#8B5CF6"
                                                            : teamData.rank <= 25
                                                                ? "#06B6D4"
                                                                : "#10B981",
                                            color: teamData.rank <= 3 ? "#000" : "#fff",
                                            fontWeight: 700
                                        }}>
                                            {teamData.rank === 1 ? "CHAMPION"
                                                : teamData.rank === 2 ? "RUNNER UP"
                                                    : teamData.rank === 3 ? "THIRD PLACE"
                                                        : teamData.rank <= 10 ? "TOP 10"
                                                            : teamData.rank <= 25 ? "TOP 25"
                                                                : "TOP 50"}
                                        </span>
                                    </h3>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "4px" }}>
                                        Rank #{teamData.rank} • {teamData.totalPoints} pts • {teamData.solvedCount} solved
                                    </p>
                                    <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                                        Premium tier certificate with your achievement
                                    </p>
                                </div>
                                <button
                                    onClick={() => downloadCertificate("achievement")}
                                    disabled={downloading === "achievement"}
                                    className="btn btn-primary"
                                    style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
                                >
                                    {downloading === "achievement" ? (
                                        <>
                                            <Loader2 size={16} className="spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} />
                                            Download
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* First Blood Badges */}
                    <h2 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    }}>
                        <Droplet size={20} style={{ color: "#ef4444" }} />
                        First Blood Badges
                        <span style={{
                            fontSize: "14px",
                            color: "var(--text-muted)",
                            fontWeight: 400
                        }}>
                            ({teamData?.firstBloods?.length || 0})
                        </span>
                    </h2>

                    {teamData?.firstBloods && teamData.firstBloods.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {teamData.firstBloods.map((fb) => (
                                <div
                                    key={fb.id}
                                    className="card"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        borderLeft: "3px solid #ef4444"
                                    }}
                                >
                                    <div style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "8px",
                                        background: "rgba(239, 68, 68, 0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <Droplet size={24} style={{ color: "#ef4444" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                                            {fb.challengeTitle}
                                        </h4>
                                        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                                            {fb.categoryName} • {fb.points} pts • {new Date(fb.solvedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => downloadCertificate("first-blood", fb.id)}
                                        disabled={downloading === fb.id}
                                        className="btn btn-secondary"
                                        style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
                                    >
                                        {downloading === fb.id ? (
                                            <Loader2 size={14} className="spin" />
                                        ) : (
                                            <Download size={14} />
                                        )}
                                        Badge
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                            <Droplet size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px", opacity: 0.5 }} />
                            <p style={{ color: "var(--text-muted)" }}>No first bloods yet. Be the first to solve a challenge!</p>
                        </div>
                    )}

                    {/* Tip */}
                    <div style={{
                        marginTop: "32px",
                        padding: "16px 20px",
                        background: "rgba(250, 204, 21, 0.05)",
                        border: "1px solid rgba(250, 204, 21, 0.2)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px"
                    }}>
                        <ExternalLink size={18} style={{ color: "var(--yellow)", marginTop: "2px", flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
                                <strong>Share on LinkedIn</strong>
                            </p>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                                Download your certificate and add it to your LinkedIn profile under Licenses & Certifications.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
