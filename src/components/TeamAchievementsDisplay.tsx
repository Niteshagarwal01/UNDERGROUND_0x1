"use client";

import { useState, useEffect } from "react";
import {
    Trophy, Lock, Star,
    Droplet, Sword, Crown, Target, Unlock, Gem, Skull,
    Swords, Dumbbell, Search, FileSearch, Cpu, Globe, Medal, Zap,
    LucideIcon, Users
} from "lucide-react";

interface TeamAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
    earnedBy: {
        username: string;
        avatarUrl: string | null;
        earnedAt: string;
    }[];
}

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
    Droplet, Sword, Crown, Target, Unlock, Gem, Trophy, Skull,
    Swords, Dumbbell, Search, FileSearch, Lock, Cpu, Globe, Medal, Zap
};

const rarityColors = {
    COMMON: {
        bg: "rgba(107, 114, 128, 0.1)",
        border: "rgba(107, 114, 128, 0.3)",
        text: "#9ca3af",
    },
    RARE: {
        bg: "rgba(59, 130, 246, 0.1)",
        border: "rgba(59, 130, 246, 0.3)",
        text: "#3b82f6",
    },
    EPIC: {
        bg: "rgba(168, 85, 247, 0.1)",
        border: "rgba(168, 85, 247, 0.3)",
        text: "#a855f7",
    },
    LEGENDARY: {
        bg: "rgba(250, 204, 21, 0.1)",
        border: "rgba(250, 204, 21, 0.3)",
        text: "#facc15",
    }
};

interface Props {
    teamId?: string;
}

export default function TeamAchievementsDisplay({ teamId }: Props) {
    const [achievements, setAchievements] = useState<TeamAchievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTeamAchievements() {
            if (!teamId) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/teams/${teamId}/achievements`);
                const data = await res.json();
                if (data.success) {
                    setAchievements(data.achievements);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                console.error("Failed to fetch team achievements:", err);
                setError("Failed to load achievements");
            } finally {
                setLoading(false);
            }
        }
        fetchTeamAchievements();
    }, [teamId]);

    if (!teamId) {
        return null;
    }

    if (loading) {
        return (
            <div style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-muted)"
            }}>
                Loading team achievements...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--text-muted)",
                background: "var(--black-lighter)",
                borderRadius: "8px"
            }}>
                {error}
            </div>
        );
    }

    const totalAchievements = achievements.reduce((sum, a) => sum + a.earnedBy.length, 0);

    if (totalAchievements === 0) {
        return (
            <div style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-muted)",
                background: "var(--black-lighter)",
                borderRadius: "8px",
                border: "1px solid var(--black-border)"
            }}>
                <Trophy size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
                <p>No team achievements yet</p>
                <p style={{ fontSize: "12px", marginTop: "8px" }}>Solve challenges to earn achievements!</p>
            </div>
        );
    }

    return (
        <div>
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
                    <Trophy size={24} style={{ color: "var(--yellow)" }} />
                    <h3 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.1rem",
                        fontWeight: 600
                    }}>
                        Team Achievements
                    </h3>
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "rgba(250, 204, 21, 0.1)",
                    border: "1px solid rgba(250, 204, 21, 0.2)",
                    borderRadius: "16px",
                    color: "var(--yellow)",
                    fontSize: "13px",
                    fontWeight: 600
                }}>
                    <Star size={12} />
                    {totalAchievements}
                </div>
            </div>

            {/* Achievement cards */}
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px"
            }}>
                {achievements.map((achievement) => {
                    const colors = rarityColors[achievement.rarity];
                    const IconComponent = iconMap[achievement.icon] || Target;

                    return (
                        <div
                            key={achievement.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                padding: "16px",
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: "12px"
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "10px",
                                background: "rgba(0,0,0,0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                            }}>
                                <IconComponent size={22} style={{ color: colors.text }} />
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px",
                                    flexWrap: "wrap"
                                }}>
                                    <span style={{
                                        fontWeight: 600,
                                        color: colors.text
                                    }}>
                                        {achievement.name}
                                    </span>
                                    <span style={{
                                        fontSize: "10px",
                                        padding: "2px 6px",
                                        background: "rgba(0,0,0,0.3)",
                                        borderRadius: "8px",
                                        color: colors.text,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em"
                                    }}>
                                        {achievement.rarity}
                                    </span>
                                </div>
                                <p style={{
                                    fontSize: "12px",
                                    color: "var(--text-muted)",
                                    marginBottom: "8px"
                                }}>
                                    {achievement.description}
                                </p>

                                {/* Earned by */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    flexWrap: "wrap"
                                }}>
                                    <Users size={12} style={{ color: "var(--text-muted)" }} />
                                    {achievement.earnedBy.slice(0, 4).map((user, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                fontSize: "11px",
                                                padding: "2px 8px",
                                                background: "rgba(255,255,255,0.05)",
                                                borderRadius: "10px",
                                                color: "var(--text-secondary)"
                                            }}
                                        >
                                            {user.username}
                                        </span>
                                    ))}
                                    {achievement.earnedBy.length > 4 && (
                                        <span style={{
                                            fontSize: "11px",
                                            color: "var(--text-muted)"
                                        }}>
                                            +{achievement.earnedBy.length - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
