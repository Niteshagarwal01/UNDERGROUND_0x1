"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    Trophy,
    Medal,
    Loader2,
    Zap,
    ChevronDown,
    ChevronUp,
    Crown,
    Flame,
    Users,
    Target,
    Star
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface FirstBloodEntry {
    challengeId: string;
    challengeTitle: string;
    challengeSlug: string;
    difficulty: string;
    points: number;
    teamId: string;
    teamName: string;
    teamAvatar: string | null;
    solvedAt: string;
}

interface CategoryData {
    category: {
        id: string;
        name: string;
        slug: string;
        icon: string | null;
        color: string | null;
    };
    firstBloods: FirstBloodEntry[];
}

interface LeaderboardEntry {
    rank: number;
    teamId: string;
    teamName: string;
    teamAvatar: string | null;
    count: number;
}

interface HallOfFameData {
    stats: {
        totalFirstBloods: number;
        totalTeamsWithFirstBlood: number;
    };
    categories: CategoryData[];
    leaderboard: LeaderboardEntry[];
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getDifficultyBadge(difficulty: string) {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
        MEDIUM: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e", label: "Medium" },
        HARD: { bg: "rgba(249, 115, 22, 0.15)", color: "#f97316", label: "Hard" },
        GOD_LEVEL: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", label: "God Level" }
    };
    const style = styles[difficulty] || styles.MEDIUM;
    return (
        <span
            style={{
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                background: style.bg,
                color: style.color
            }}
        >
            {style.label}
        </span>
    );
}

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <Crown size={20} style={{ color: "#facc15" }} />;
    if (rank === 2) return <Medal size={18} style={{ color: "#a3a3a3" }} />;
    if (rank === 3) return <Medal size={18} style={{ color: "#cd7c2e" }} />;
    return <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>#{rank}</span>;
}

export default function HallOfFamePage() {
    const [data, setData] = useState<HallOfFameData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/hall-of-fame");
                const json = await res.json();
                if (json.success) {
                    setData(json);
                    // Expand all categories by default
                    setExpandedCategories(new Set(json.categories.map((c: CategoryData) => c.category.id)));
                } else {
                    setError(json.message);
                }
            } catch {
                setError("Failed to load hall of fame");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black grid-pattern" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={40} className="text-yellow spinner" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black grid-pattern">
            <Navbar />

            <main className="section" style={{ paddingTop: "calc(var(--nav-height) + 60px)" }}>
                <div className="container" style={{ maxWidth: "1200px" }}>
                    {/* Header */}
                    <div className="section-header" style={{ marginBottom: "40px", textAlign: "center" }}>
                        <div className="hall-of-fame-icon">
                            <Flame size={48} className="text-yellow" />
                        </div>
                        <h1 className="section-title" style={{ marginTop: "20px" }}>
                            <span style={{ color: "var(--text-muted)" }}>[</span>
                            Hall of Fame
                            <span style={{ color: "var(--text-muted)" }}>]</span>
                        </h1>
                        <p className="section-subtitle">
                            First Blood Champions • The fastest solvers in Underground 0x1
                        </p>
                    </div>

                    {/* Stats */}
                    {data && (
                        <div className="stats-grid" style={{ marginBottom: "40px", maxWidth: "600px", margin: "0 auto 40px" }}>
                            <div className="stat-card">
                                <Zap size={24} className="stat-icon" />
                                <div className="stat-value">{data.stats.totalFirstBloods}</div>
                                <div className="stat-label">First Bloods</div>
                            </div>
                            <div className="stat-card">
                                <Users size={24} className="stat-icon" />
                                <div className="stat-value">{data.stats.totalTeamsWithFirstBlood}</div>
                                <div className="stat-label">Teams with FB</div>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
                            <Trophy size={64} style={{ color: "var(--text-muted)", marginBottom: "24px" }} />
                            <h2 style={{ marginBottom: "12px" }}>Unable to Load</h2>
                            <p style={{ color: "var(--text-muted)" }}>{error}</p>
                        </div>
                    ) : data && data.categories.length === 0 ? (
                        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
                            <Star size={64} style={{ color: "var(--text-muted)", marginBottom: "24px" }} />
                            <h2 style={{ marginBottom: "12px" }}>No First Bloods Yet</h2>
                            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                                Be the first to claim a spot in the Hall of Fame!
                            </p>
                            <Link href="/challenges" className="btn btn-primary">
                                View Challenges
                            </Link>
                        </div>
                    ) : (
                        <div className="hall-of-fame-layout">
                            {/* Main Content - First Bloods by Category */}
                            <div className="first-bloods-section">
                                {data?.categories.map((cat) => (
                                    <div key={cat.category.id} className="category-section card">
                                        <button
                                            className="category-header"
                                            onClick={() => toggleCategory(cat.category.id)}
                                        >
                                            <div className="category-title">
                                                <span className="category-icon">{cat.category.icon || "📁"}</span>
                                                <h2>{cat.category.name}</h2>
                                                <span className="fb-count">{cat.firstBloods.length} FB</span>
                                            </div>
                                            {expandedCategories.has(cat.category.id) ? (
                                                <ChevronUp size={20} />
                                            ) : (
                                                <ChevronDown size={20} />
                                            )}
                                        </button>

                                        {expandedCategories.has(cat.category.id) && (
                                            <div className="first-bloods-list">
                                                {cat.firstBloods.map((fb) => (
                                                    <div key={fb.challengeId} className="first-blood-item">
                                                        <div className="fb-challenge">
                                                            <div className="fb-challenge-title">
                                                                <Zap size={16} className="text-yellow" />
                                                                {fb.challengeTitle}
                                                            </div>
                                                            <div className="fb-challenge-meta">
                                                                {getDifficultyBadge(fb.difficulty)}
                                                                <span className="fb-points">+{fb.points}</span>
                                                            </div>
                                                        </div>
                                                        <div className="fb-team">
                                                            <Link href={`/team/${fb.teamId}`} className="fb-team-link">
                                                                <Trophy size={14} className="text-yellow" />
                                                                {fb.teamName}
                                                            </Link>
                                                            <span className="fb-time">{formatDate(fb.solvedAt)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Sidebar - Leaderboard */}
                            <div className="leaderboard-sidebar">
                                <div className="card card-elevated">
                                    <h3 className="leaderboard-title">
                                        <Crown size={20} className="text-yellow" />
                                        Most First Bloods
                                    </h3>
                                    {data?.leaderboard && data.leaderboard.length > 0 ? (
                                        <div className="leaderboard-list">
                                            {data.leaderboard.map((entry) => (
                                                <Link
                                                    key={entry.teamId}
                                                    href={`/team/${entry.teamId}`}
                                                    className="leaderboard-item"
                                                >
                                                    <div className="lb-rank">
                                                        <RankIcon rank={entry.rank} />
                                                    </div>
                                                    <div className="lb-team">{entry.teamName}</div>
                                                    <div className="lb-count">
                                                        <Zap size={14} className="text-yellow" />
                                                        {entry.count}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
                                            No first bloods yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .hall-of-fame-icon {
                    display: inline-flex;
                    padding: 16px;
                    background: rgba(250, 204, 21, 0.1);
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
                
                .hall-of-fame-layout {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 24px;
                    align-items: start;
                }
                
                .first-bloods-section {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .category-section {
                    overflow: hidden;
                }
                
                .category-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    text-align: left;
                }
                
                .category-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .category-icon {
                    font-size: 1.25rem;
                }
                
                .category-title h2 {
                    font-size: 1.1rem;
                    margin: 0;
                }
                
                .fb-count {
                    padding: 2px 10px;
                    background: rgba(250, 204, 21, 0.15);
                    color: var(--yellow);
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .first-bloods-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid var(--black-border);
                }
                
                .first-blood-item {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 16px;
                    background: var(--black-lighter);
                    border: 1px solid var(--black-border);
                    border-radius: 8px;
                    transition: border-color 0.2s;
                }
                
                .first-blood-item:hover {
                    border-color: var(--yellow);
                }
                
                .fb-challenge {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .fb-challenge-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                }
                
                .fb-challenge-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .fb-points {
                    color: var(--yellow);
                    font-weight: 700;
                    font-size: 14px;
                }
                
                .fb-team {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .fb-team-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--yellow);
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 14px;
                }
                
                .fb-team-link:hover {
                    text-decoration: underline;
                }
                
                .fb-time {
                    color: var(--text-muted);
                    font-size: 12px;
                }
                
                .leaderboard-sidebar {
                    position: sticky;
                    top: calc(var(--nav-height) + 20px);
                }
                
                .leaderboard-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    font-size: 1rem;
                }
                
                .leaderboard-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .leaderboard-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: var(--black-lighter);
                    border: 1px solid var(--black-border);
                    border-radius: 8px;
                    text-decoration: none;
                    color: white;
                    transition: border-color 0.2s;
                }
                
                .leaderboard-item:hover {
                    border-color: var(--yellow);
                }
                
                .lb-rank {
                    width: 32px;
                    display: flex;
                    justify-content: center;
                }
                
                .lb-team {
                    flex: 1;
                    font-weight: 500;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .lb-count {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--yellow);
                    font-weight: 700;
                }
                
                @media (max-width: 900px) {
                    .hall-of-fame-layout {
                        grid-template-columns: 1fr;
                    }
                    
                    .leaderboard-sidebar {
                        position: static;
                        order: -1;
                    }
                }
                
                @media (max-width: 600px) {
                    .fb-challenge {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    
                    .fb-team {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            `}</style>
        </div>
    );
}
