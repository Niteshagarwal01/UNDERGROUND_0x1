"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Lock, ChevronDown, ChevronUp, MapPin } from "lucide-react";

interface Challenge {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    points: number;
    solves: number;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    challenges: Challenge[];
}

interface IncidentTimelineProps {
    categories: Category[];
    solvedChallengeIds: string[];
    onChallengeClick?: (challengeSlug: string) => void;
}

// Metro line colors matching actual Delhi Metro lines
const lineColors: Record<string, { primary: string; secondary: string; name: string }> = {
    // Exact slug matches
    "osint": { primary: "#3b82f6", secondary: "rgba(59, 130, 246, 0.2)", name: "Blue Line" },
    "forensics": { primary: "#facc15", secondary: "rgba(250, 204, 21, 0.2)", name: "Yellow Line" },
    "cryptography": { primary: "#ef4444", secondary: "rgba(239, 68, 68, 0.2)", name: "Red Line" },
    "crypto": { primary: "#ef4444", secondary: "rgba(239, 68, 68, 0.2)", name: "Red Line" },
    "steganography": { primary: "#22c55e", secondary: "rgba(34, 197, 94, 0.2)", name: "Green Line" },
    "stego": { primary: "#22c55e", secondary: "rgba(34, 197, 94, 0.2)", name: "Green Line" },
    "web": { primary: "#a855f7", secondary: "rgba(168, 85, 247, 0.2)", name: "Violet Line" },
    "web-security": { primary: "#a855f7", secondary: "rgba(168, 85, 247, 0.2)", name: "Violet Line" },
    "websecurity": { primary: "#a855f7", secondary: "rgba(168, 85, 247, 0.2)", name: "Violet Line" },
    "reverse-engineering": { primary: "#ec4899", secondary: "rgba(236, 72, 153, 0.2)", name: "Pink Line" },
    "reverseengineering": { primary: "#ec4899", secondary: "rgba(236, 72, 153, 0.2)", name: "Pink Line" },
    "reverse": { primary: "#ec4899", secondary: "rgba(236, 72, 153, 0.2)", name: "Pink Line" },
    "pwn": { primary: "#f97316", secondary: "rgba(249, 115, 22, 0.2)", name: "Orange Line" },
    "binary": { primary: "#f97316", secondary: "rgba(249, 115, 22, 0.2)", name: "Orange Line" },
    "misc": { primary: "#06b6d4", secondary: "rgba(6, 182, 212, 0.2)", name: "Aqua Line" },
    "miscellaneous": { primary: "#06b6d4", secondary: "rgba(6, 182, 212, 0.2)", name: "Aqua Line" },
    "network": { primary: "#8b5cf6", secondary: "rgba(139, 92, 246, 0.2)", name: "Magenta Line" },
    "default": { primary: "#f97316", secondary: "rgba(249, 115, 22, 0.2)", name: "Orange Line" },
};

export default function IncidentTimeline({
    categories,
    solvedChallengeIds,
    onChallengeClick,
}: IncidentTimelineProps) {
    const [expandedLines, setExpandedLines] = useState<string[]>([]);
    const [animatedStations, setAnimatedStations] = useState<string[]>([]);

    // Animate solved stations on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedStations(solvedChallengeIds);
        }, 300);
        return () => clearTimeout(timer);
    }, [solvedChallengeIds]);

    const toggleLine = (categoryId: string) => {
        setExpandedLines(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const getLineColor = (slug: string) => {
        return lineColors[slug.toLowerCase()] || lineColors.default;
    };

    const getCategoryProgress = (category: Category) => {
        const solved = category.challenges.filter(c => solvedChallengeIds.includes(c.id)).length;
        return { solved, total: category.challenges.length };
    };

    // Calculate overall progress
    const totalChallenges = categories.reduce((sum, cat) => sum + cat.challenges.length, 0);
    const totalSolved = categories.reduce((sum, cat) =>
        sum + cat.challenges.filter(c => solvedChallengeIds.includes(c.id)).length, 0
    );
    const overallProgress = totalChallenges > 0 ? Math.round((totalSolved / totalChallenges) * 100) : 0;

    return (
        <div
            style={{
                background: "#0a0a0a",
                border: "1px solid #1a1a1a",
                borderRadius: "12px",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #1a1a1a",
                    background: "linear-gradient(135deg, rgba(250, 204, 21, 0.05) 0%, transparent 50%)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "rgba(250, 204, 21, 0.1)",
                                border: "1px solid rgba(250, 204, 21, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <MapPin size={20} style={{ color: "#facc15" }} />
                        </div>
                        <div>
                            <h3 style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "white",
                                marginBottom: "2px",
                            }}>
                                INCIDENT TIMELINE
                            </h3>
                            <p style={{ fontSize: "12px", color: "#71717a" }}>
                                OCC Metro Network Map
                            </p>
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{
                            fontSize: "24px",
                            fontWeight: 700,
                            color: "#facc15",
                            fontFamily: "var(--font-heading)",
                        }}>
                            {overallProgress}%
                        </div>
                        <p style={{ fontSize: "11px", color: "#71717a" }}>
                            {totalSolved}/{totalChallenges} stations
                        </p>
                    </div>
                </div>

                {/* Overall progress bar */}
                <div style={{ marginTop: "16px" }}>
                    <div
                        style={{
                            height: "6px",
                            background: "#1a1a1a",
                            borderRadius: "3px",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${overallProgress}%`,
                                background: "linear-gradient(90deg, #facc15, #f97316)",
                                borderRadius: "3px",
                                transition: "width 0.5s ease-out",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Metro Lines */}
            <div style={{ padding: "16px" }}>
                {categories.map((category) => {
                    const lineColor = getLineColor(category.slug);
                    const progress = getCategoryProgress(category);
                    const isExpanded = expandedLines.includes(category.id);
                    const progressPercent = progress.total > 0
                        ? Math.round((progress.solved / progress.total) * 100)
                        : 0;

                    return (
                        <div
                            key={category.id}
                            style={{
                                marginBottom: "12px",
                                background: "#0d0d0d",
                                border: `1px solid ${isExpanded ? lineColor.primary : '#1a1a1a'}`,
                                borderRadius: "10px",
                                overflow: "hidden",
                                transition: "border-color 0.2s",
                            }}
                        >
                            {/* Line Header */}
                            <button
                                onClick={() => toggleLine(category.id)}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "16px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                }}
                            >
                                {/* Line indicator */}
                                <div
                                    style={{
                                        width: "8px",
                                        height: "40px",
                                        borderRadius: "4px",
                                        background: lineColor.primary,
                                        flexShrink: 0,
                                    }}
                                />

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                        <span style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: "white",
                                            fontFamily: "var(--font-heading)",
                                        }}>
                                            {category.name}
                                        </span>
                                        <span style={{
                                            fontSize: "10px",
                                            padding: "2px 8px",
                                            borderRadius: "10px",
                                            background: lineColor.secondary,
                                            color: lineColor.primary,
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                        }}>
                                            {lineColor.name}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <span style={{ fontSize: "12px", color: "#71717a" }}>
                                            {progress.solved}/{progress.total} stations cleared
                                        </span>
                                        <div
                                            style={{
                                                flex: 1,
                                                maxWidth: "120px",
                                                height: "4px",
                                                background: "#1a1a1a",
                                                borderRadius: "2px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${progressPercent}%`,
                                                    background: lineColor.primary,
                                                    transition: "width 0.3s ease-out",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isExpanded ? (
                                    <ChevronUp size={20} style={{ color: lineColor.primary }} />
                                ) : (
                                    <ChevronDown size={20} style={{ color: "#71717a" }} />
                                )}
                            </button>

                            {/* Stations (Challenges) */}
                            {isExpanded && (
                                <div style={{ padding: "0 16px 16px 16px" }}>
                                    <div style={{ position: "relative", paddingLeft: "24px" }}>
                                        {/* Vertical line */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: "11px",
                                                top: "0",
                                                bottom: "0",
                                                width: "2px",
                                                background: `linear-gradient(180deg, ${lineColor.primary} 0%, ${lineColor.secondary} 100%)`,
                                            }}
                                        />

                                        {category.challenges.map((challenge, idx) => {
                                            const isSolved = solvedChallengeIds.includes(challenge.id);
                                            const isAnimated = animatedStations.includes(challenge.id);

                                            return (
                                                <div
                                                    key={challenge.id}
                                                    onClick={() => onChallengeClick?.(challenge.slug)}
                                                    style={{
                                                        position: "relative",
                                                        padding: "12px 0",
                                                        paddingLeft: "20px",
                                                        cursor: onChallengeClick ? "pointer" : "default",
                                                    }}
                                                >
                                                    {/* Station marker */}
                                                    <div
                                                        style={{
                                                            position: "absolute",
                                                            left: "-13px",
                                                            top: "50%",
                                                            width: "24px",
                                                            height: "24px",
                                                            borderRadius: "50%",
                                                            background: isSolved ? lineColor.primary : "#0d0d0d",
                                                            border: `3px solid ${isSolved ? lineColor.primary : "#3f3f46"}`,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            transition: "all 0.3s ease-out",
                                                            transform: isAnimated && isSolved
                                                                ? "translateY(-50%) scale(1.1)"
                                                                : "translateY(-50%)",
                                                        }}
                                                    >
                                                        {isSolved ? (
                                                            <CheckCircle size={14} style={{ color: "#0a0a0a" }} />
                                                        ) : (
                                                            <Circle size={8} style={{ color: "#3f3f46" }} />
                                                        )}
                                                    </div>

                                                    {/* Station info */}
                                                    <div
                                                        style={{
                                                            background: isSolved ? lineColor.secondary : "transparent",
                                                            border: `1px solid ${isSolved ? lineColor.primary : '#1a1a1a'}`,
                                                            borderRadius: "8px",
                                                            padding: "12px 16px",
                                                            transition: "all 0.2s",
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                            <div>
                                                                <h4 style={{
                                                                    fontSize: "13px",
                                                                    fontWeight: 600,
                                                                    color: isSolved ? "white" : "#a1a1aa",
                                                                    marginBottom: "4px",
                                                                    fontFamily: "var(--font-heading)",
                                                                }}>
                                                                    {challenge.title}
                                                                </h4>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <span style={{
                                                                        fontSize: "11px",
                                                                        padding: "2px 6px",
                                                                        borderRadius: "4px",
                                                                        background: challenge.difficulty === "GOD_LEVEL"
                                                                            ? "rgba(239, 68, 68, 0.2)"
                                                                            : challenge.difficulty === "HARD"
                                                                                ? "rgba(249, 115, 22, 0.2)"
                                                                                : "rgba(250, 204, 21, 0.2)",
                                                                        color: challenge.difficulty === "GOD_LEVEL"
                                                                            ? "#ef4444"
                                                                            : challenge.difficulty === "HARD"
                                                                                ? "#f97316"
                                                                                : "#facc15",
                                                                        fontWeight: 600,
                                                                    }}>
                                                                        {challenge.difficulty.replace("_", " ")}
                                                                    </span>
                                                                    <span style={{ fontSize: "11px", color: "#71717a" }}>
                                                                        {challenge.solves} solves
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: "right" }}>
                                                                <span style={{
                                                                    fontSize: "14px",
                                                                    fontWeight: 700,
                                                                    color: isSolved ? lineColor.primary : "#71717a",
                                                                    fontFamily: "var(--font-heading)",
                                                                }}>
                                                                    {challenge.points} pts
                                                                </span>
                                                                {isSolved && (
                                                                    <div style={{
                                                                        fontSize: "10px",
                                                                        color: "#22c55e",
                                                                        fontWeight: 600,
                                                                        marginTop: "2px",
                                                                    }}>
                                                                        ✓ CLEARED
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
