"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, TrendingUp, BarChart2, PieChart } from "lucide-react";

interface AnalyticsData {
    solveTrends: Array<{ date: string; count: number; points: number }>;
    userTrends: Array<{ date: string; count: number }>;
    categoryStats: Array<{ name: string; totalSolves: number; challengeCount: number }>;
    difficultyStats: Array<{ difficulty: string; count: number; totalSolves: number }>;
    topChallenges: Array<{ title: string; solveCount: number; points: number; difficulty: string; category: { name: string } }>;
    hardestChallenges: Array<{ title: string; solveCount: number; attemptCount: number; solveRate: string; category: { name: string } }>;
    avgSolveRate: string;
    firstBloods: Array<{ team: { name: string }; challenge: { title: string; points: number }; solvedAt: string }>;
    weeklyStats: { solves: number; users: number; teams: number };
}

// Simple Canvas Line Chart
function LineChart({ data, label, color = "#facc15" }: { data: Array<{ date: string; count: number }>; label: string; color?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Clear
        ctx.clearRect(0, 0, width, height);

        const maxValue = Math.max(...data.map(d => d.count), 1);
        const xStep = chartWidth / (data.length - 1 || 1);

        // Draw grid lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }

        // Draw Y-axis labels
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            const value = Math.round(maxValue - (maxValue / 4) * i);
            ctx.fillText(value.toString(), padding.left - 8, y + 3);
        }

        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.beginPath();

        data.forEach((d, i) => {
            const x = padding.left + xStep * i;
            const y = padding.top + chartHeight - (d.count / maxValue) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, color + "40");
        gradient.addColorStop(1, color + "00");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        data.forEach((d, i) => {
            const x = padding.left + xStep * i;
            const y = padding.top + chartHeight - (d.count / maxValue) * chartHeight;
            if (i === 0) {
                ctx.moveTo(x, height - padding.bottom);
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(padding.left + xStep * (data.length - 1), height - padding.bottom);
        ctx.closePath();
        ctx.fill();

        // Draw dots
        ctx.fillStyle = color;
        data.forEach((d, i) => {
            const x = padding.left + xStep * i;
            const y = padding.top + chartHeight - (d.count / maxValue) * chartHeight;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

    }, [data, color]);

    return (
        <div className="card" style={{ height: "100%" }}>
            <h4 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.9rem",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-secondary)"
            }}>
                <TrendingUp size={16} style={{ color }} />
                {label}
            </h4>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "180px" }}
            />
        </div>
    );
}

// Simple Bar Chart
function BarChartComponent({ data, label }: { data: Array<{ name: string; value: number }>; label: string }) {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="card" style={{ height: "100%" }}>
            <h4 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.9rem",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-secondary)"
            }}>
                <BarChart2 size={16} style={{ color: "var(--yellow)" }} />
                {label}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            width: "80px",
                            minWidth: "80px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}>
                            {d.name}
                        </span>
                        <div style={{
                            flex: 1,
                            height: "20px",
                            background: "var(--black-lighter)",
                            borderRadius: "4px",
                            overflow: "hidden"
                        }}>
                            <div style={{
                                width: `${(d.value / maxValue) * 100}%`,
                                height: "100%",
                                background: "var(--yellow)",
                                borderRadius: "4px",
                                transition: "width 0.3s ease"
                            }} />
                        </div>
                        <span style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--yellow)",
                            minWidth: "30px",
                            textAlign: "right"
                        }}>
                            {d.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AnalyticsCharts() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch("/api/admin/analytics");
            const data = await res.json();
            if (data.success) {
                setAnalytics(data.analytics);
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "60px",
                background: "var(--black-card)",
                borderRadius: "12px",
                border: "1px solid var(--black-border)"
            }}>
                <Loader2 size={24} className="spin" style={{ color: "var(--yellow)" }} />
            </div>
        );
    }

    if (!analytics) {
        return null;
    }

    return (
        <div style={{ marginBottom: "32px" }}>
            <h2 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
            }}>
                <PieChart size={24} style={{ color: "var(--yellow)" }} />
                Analytics Overview
            </h2>

            {/* Weekly Stats */}
            <div className="analytics-grid-3" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
            }}>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--yellow)", fontFamily: "var(--font-heading)" }}>
                        {analytics.weeklyStats.solves}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Solves This Week
                    </div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--yellow)", fontFamily: "var(--font-heading)" }}>
                        {analytics.weeklyStats.users}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        New Users
                    </div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--yellow)", fontFamily: "var(--font-heading)" }}>
                        {analytics.weeklyStats.teams}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        New Teams
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="analytics-grid-2" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
                marginBottom: "24px"
            }}>
                <LineChart
                    data={analytics.solveTrends.slice(-14)}
                    label="Solves (Last 14 Days)"
                    color="#facc15"
                />
                <LineChart
                    data={analytics.userTrends.slice(-14)}
                    label="User Registrations (Last 14 Days)"
                    color="#facc15"
                />
            </div>

            <div className="analytics-grid-2" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px"
            }}>
                <BarChartComponent
                    data={analytics.categoryStats.map(c => ({ name: c.name, value: c.totalSolves }))}
                    label="Solves by Category"
                />
                <BarChartComponent
                    data={analytics.topChallenges.map(c => ({ name: c.title, value: c.solveCount }))}
                    label="Most Solved Challenges"
                />
            </div>

            {/* First Bloods */}
            {analytics.firstBloods.length > 0 && (
                <div className="card" style={{ marginTop: "24px" }}>
                    <h4 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "0.9rem",
                        marginBottom: "16px",
                        color: "var(--text-secondary)"
                    }}>
                        🩸 Recent First Bloods
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {analytics.firstBloods.slice(0, 5).map((fb, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "8px 12px",
                                    background: "var(--black-lighter)",
                                    borderRadius: "6px"
                                }}
                            >
                                <div>
                                    <span style={{ color: "var(--yellow)", fontWeight: 600 }}>
                                        {fb.team.name}
                                    </span>
                                    <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>→</span>
                                    <span style={{ color: "var(--text-secondary)" }}>
                                        {fb.challenge.title}
                                    </span>
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                    +{fb.challenge.points}pts
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
