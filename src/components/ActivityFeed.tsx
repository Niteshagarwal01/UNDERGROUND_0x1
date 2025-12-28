"use client";

import { useState, useEffect } from "react";
import { Activity, Zap, Clock, Trophy, Users } from "lucide-react";

interface ActivityItem {
    id: string;
    type: "SOLVE" | "FIRST_BLOOD";
    teamName: string;
    challengeTitle: string;
    categoryName: string;
    points: number;
    isFirstBlood: boolean;
    createdAt: string;
}

interface Stats {
    totalSolves: number;
    totalFirstBloods: number;
    totalTeams: number;
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ActivityFeed({ limit = 10 }: { limit?: number }) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivity() {
            try {
                const res = await fetch("/api/activity");
                const data = await res.json();
                if (data.success) {
                    setActivities(data.activities.slice(0, limit));
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Failed to fetch activity:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchActivity();

        // Refresh every 30 seconds
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, [limit]);

    if (loading) {
        return (
            <div className="card" style={{ padding: "24px" }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px"
                }}>
                    <Activity size={20} style={{ color: "var(--yellow)" }} />
                    <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>
                        Live Activity
                    </h3>
                </div>
                <div style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--text-muted)"
                }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: "24px" }}>
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px"
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <Activity size={20} style={{ color: "var(--yellow)" }} />
                    <h3 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1rem",
                        fontWeight: 600
                    }}>
                        Live Activity
                    </h3>
                </div>
                {stats && (
                    <div style={{
                        display: "flex",
                        gap: "16px",
                        fontSize: "12px",
                        color: "var(--text-muted)"
                    }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Trophy size={12} style={{ color: "var(--yellow)" }} />
                            {stats.totalSolves} solves
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Users size={12} />
                            {stats.totalTeams} teams
                        </span>
                    </div>
                )}
            </div>

            {/* Activity List */}
            {activities.length === 0 ? (
                <div style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "var(--text-muted)"
                }}>
                    <Zap size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                    <p>No activity yet. Be the first to solve!</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px",
                                background: activity.isFirstBlood
                                    ? "rgba(239, 68, 68, 0.05)"
                                    : "var(--black-lighter)",
                                borderRadius: "8px",
                                borderLeft: activity.isFirstBlood
                                    ? "3px solid #ef4444"
                                    : "3px solid var(--yellow)"
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px"
                                }}>
                                    {activity.isFirstBlood && (
                                        <span style={{ fontSize: "14px" }}>🩸</span>
                                    )}
                                    <span style={{
                                        fontWeight: 600,
                                        color: activity.isFirstBlood
                                            ? "#ef4444"
                                            : "var(--text-primary)"
                                    }}>
                                        {activity.teamName}
                                    </span>
                                    <span style={{
                                        color: "var(--text-muted)",
                                        fontSize: "13px"
                                    }}>
                                        solved
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: "13px",
                                    color: "var(--text-secondary)"
                                }}>
                                    {activity.challengeTitle}
                                    <span style={{
                                        color: "var(--text-muted)",
                                        marginLeft: "8px"
                                    }}>
                                        • {activity.categoryName}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{
                                    color: "var(--yellow)",
                                    fontWeight: 700,
                                    fontFamily: "var(--font-heading)"
                                }}>
                                    +{activity.points}
                                </div>
                                <div style={{
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    justifyContent: "flex-end"
                                }}>
                                    <Clock size={10} />
                                    {formatTimeAgo(activity.createdAt)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
