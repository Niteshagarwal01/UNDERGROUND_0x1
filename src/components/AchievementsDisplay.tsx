"use client";

import { useState, useEffect } from "react";
import {
    Trophy, Lock, Star,
    Droplet, Sword, Crown, Target, Unlock, Gem, Skull,
    Swords, Dumbbell, Search, FileSearch, Cpu, Globe, Medal, Zap,
    LucideIcon
} from "lucide-react";

interface Achievement {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    requirement: number;
    rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
    earned: boolean;
}

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
    Droplet, Sword, Crown, Target, Unlock, Gem, Trophy, Skull,
    Swords, Dumbbell, Search, FileSearch, Lock, Cpu, Globe, Medal, Zap
};

// Yellow/black theme with varying intensity based on rarity
const rarityColors = {
    COMMON: {
        bg: "rgba(255, 255, 255, 0.03)",
        border: "rgba(255, 255, 255, 0.1)",
        text: "#666666",
        glow: "none"
    },
    RARE: {
        bg: "rgba(250, 204, 21, 0.06)",
        border: "rgba(250, 204, 21, 0.2)",
        text: "#a38a08",
        glow: "none"
    },
    EPIC: {
        bg: "rgba(250, 204, 21, 0.10)",
        border: "rgba(250, 204, 21, 0.3)",
        text: "#d4a90a",
        glow: "0 0 15px rgba(250, 204, 21, 0.2)"
    },
    LEGENDARY: {
        bg: "rgba(250, 204, 21, 0.15)",
        border: "rgba(250, 204, 21, 0.5)",
        text: "#facc15",
        glow: "0 0 25px rgba(250, 204, 21, 0.3)"
    }
};

function AchievementBadge({ achievement }: { achievement: Achievement }) {
    const colors = rarityColors[achievement.rarity];
    const IconComponent = iconMap[achievement.icon] || Target;

    return (
        <div
            style={{
                background: achievement.earned ? colors.bg : "rgba(20, 20, 20, 0.5)",
                border: `1px solid ${achievement.earned ? colors.border : "#1a1a1a"}`,
                borderRadius: "12px",
                padding: "20px",
                opacity: achievement.earned ? 1 : 0.4,
                transition: "all 0.3s ease",
                position: "relative",
                boxShadow: achievement.earned ? colors.glow : "none"
            }}
        >
            {/* Lock overlay for unearned */}
            {!achievement.earned && (
                <div style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    color: "#3a3a3a"
                }}>
                    <Lock size={14} />
                </div>
            )}

            {/* Icon */}
            <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: achievement.earned
                    ? `linear-gradient(135deg, ${colors.bg}, transparent)`
                    : "rgba(30, 30, 30, 0.5)",
                border: `1px solid ${achievement.earned ? colors.border : "#2a2a2a"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px"
            }}>
                <IconComponent
                    size={24}
                    style={{
                        color: achievement.earned ? colors.text : "#3a3a3a"
                    }}
                />
            </div>

            {/* Name */}
            <h4 style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: achievement.earned ? "var(--text-primary)" : "#3a3a3a",
                marginBottom: "6px"
            }}>
                {achievement.name}
            </h4>

            {/* Description */}
            <p style={{
                fontSize: "12px",
                color: achievement.earned ? "var(--text-muted)" : "#2a2a2a",
                lineHeight: 1.5,
                marginBottom: "12px"
            }}>
                {achievement.description}
            </p>

            {/* Rarity badge */}
            <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "20px",
                background: achievement.earned ? colors.bg : "rgba(30, 30, 30, 0.5)",
                border: `1px solid ${achievement.earned ? colors.border : "#2a2a2a"}`,
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: achievement.earned ? colors.text : "#3a3a3a"
            }}>
                <Star size={10} />
                {achievement.rarity}
            </div>
        </div>
    );
}

export default function AchievementsDisplay({ compact = false }: { compact?: boolean }) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [earnedCount, setEarnedCount] = useState(0);

    useEffect(() => {
        async function fetchAchievements() {
            try {
                const res = await fetch("/api/achievements");
                const data = await res.json();
                if (data.success) {
                    setAchievements(data.achievements);
                    setEarnedCount(data.earnedCount);
                }
            } catch (error) {
                console.error("Failed to fetch achievements:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAchievements();
    }, []);

    if (loading) {
        return (
            <div style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-muted)"
            }}>
                Loading achievements...
            </div>
        );
    }

    if (compact) {
        // Show only earned achievements in a row
        const earned = achievements.filter(a => a.earned);
        if (earned.length === 0) {
            return (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text-muted)",
                    fontSize: "13px"
                }}>
                    <Trophy size={16} />
                    No achievements yet
                </div>
            );
        }

        return (
            <div style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap"
            }}>
                {earned.map(a => {
                    const IconComponent = iconMap[a.icon] || Target;
                    const colors = rarityColors[a.rarity];
                    return (
                        <div
                            key={a.id}
                            title={`${a.name}: ${a.description}`}
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <IconComponent size={18} style={{ color: colors.text }} />
                        </div>
                    );
                })}
            </div>
        );
    }

    // Full display
    return (
        <div>
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px"
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <Trophy size={24} style={{ color: "var(--yellow)" }} />
                    <h3 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.25rem",
                        fontWeight: 600
                    }}>
                        Achievements
                    </h3>
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    background: "rgba(250, 204, 21, 0.1)",
                    border: "1px solid rgba(250, 204, 21, 0.2)",
                    borderRadius: "20px",
                    color: "var(--yellow)"
                }}>
                    <Star size={14} />
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>
                        {earnedCount} / {achievements.length}
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "16px"
            }}>
                {achievements.map(achievement => (
                    <AchievementBadge
                        key={achievement.id}
                        achievement={achievement}
                    />
                ))}
            </div>
        </div>
    );
}
