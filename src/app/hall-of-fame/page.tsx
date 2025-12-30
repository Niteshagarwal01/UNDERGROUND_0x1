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
    Star,
    Search,
    FileSearch,
    Cpu,
    Globe,
    Shield,
    Lock,
    Key,
    Code,
    Binary,
    Bug,
    Wifi,
    Server,
    Database,
    Swords,
    Sword,
    Skull,
    Gem,
    Unlock,
    Dumbbell,
    Droplet,
    LucideIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Icon mapping for categories
const iconMap: Record<string, LucideIcon> = {
    Search, FileSearch, Cpu, Globe, Shield, Lock, Key, Code, Binary, Bug,
    Wifi, Server, Database, Target, Trophy, Medal, Star, Flame, Users, Crown, Zap,
    Swords, Sword, Skull, Gem, Unlock, Dumbbell, Droplet
};

function getCategoryIcon(iconName: string | null): LucideIcon {
    if (!iconName) return Target;
    return iconMap[iconName] || Target;
}


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
    const config: Record<string, { label: string; bg: string; border: string }> = {
        MEDIUM: { label: "Medium", bg: "rgba(250, 204, 21, 0.1)", border: "rgba(250, 204, 21, 0.3)" },
        HARD: { label: "Hard", bg: "rgba(250, 204, 21, 0.15)", border: "rgba(250, 204, 21, 0.4)" },
        GOD_LEVEL: { label: "God Level", bg: "rgba(250, 204, 21, 0.2)", border: "rgba(250, 204, 21, 0.5)" }
    };
    const style = config[difficulty] || config.MEDIUM;
    return (
        <span
            style={{
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                background: style.bg,
                color: "var(--yellow)",
                border: `1px solid ${style.border}`
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

    const [activeTab, setActiveTab] = useState<'overview' | 'badges'>('overview');
    const [achievements, setAchievements] = useState<any[]>([]);
    const [loadingBadges, setLoadingBadges] = useState(false);
    const [badgeFilter, setBadgeFilter] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/hall-of-fame");
                const json = await res.json();
                if (json.success) {
                    setData(json);
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

    // Fetch badges when tab changes
    useEffect(() => {
        if (activeTab === 'badges' && achievements.length === 0) {
            const fetchBadges = async () => {
                setLoadingBadges(true);
                try {
                    const res = await fetch("/api/stats/achievements");
                    const json = await res.json();
                    if (json.success) {
                        setAchievements(json.achievements);
                    }
                } catch (e) {
                    console.error("Failed to fetch badges", e);
                } finally {
                    setLoadingBadges(false);
                }
            };
            fetchBadges();
        }
    }, [activeTab]);

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

                    {/* Tabs */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', gap: '8px' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ borderRadius: '20px', padding: '8px 24px' }}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('badges')}
                            className={`btn ${activeTab === 'badges' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ borderRadius: '20px', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Medal size={16} />
                            Mission Badges
                        </button>
                    </div>

                    {activeTab === 'overview' ? (
                        <>
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
                                                        <span className="category-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.2)' }}>
                                                            {(() => {
                                                                const IconComp = getCategoryIcon(cat.category.icon);
                                                                return <IconComp size={18} style={{ color: 'var(--yellow)' }} />;
                                                            })()}
                                                        </span>
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
                        </>
                    ) : (
                        /* Mission Badges Tab */
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            {loadingBadges ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                                    <Loader2 size={32} className="spinner text-yellow" />
                                </div>
                            ) : (
                                <>
                                    {/* Category Filter Buttons */}
                                    <div className="badge-filters">
                                        <button
                                            className={`filter-btn ${badgeFilter === 'all' ? 'active' : ''}`}
                                            onClick={() => setBadgeFilter('all')}
                                        >
                                            All Badges
                                        </button>
                                        {Array.from(new Set(achievements.map(a => a.category))).map(cat => (
                                            <button
                                                key={cat}
                                                className={`filter-btn ${badgeFilter === cat ? 'active' : ''}`}
                                                onClick={() => setBadgeFilter(cat)}
                                            >
                                                {cat.replace(/_/g, ' ')}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Grouped Badges */}
                                    {Array.from(new Set(achievements.filter(a => badgeFilter === 'all' || a.category === badgeFilter).map(a => a.category))).map(category => {
                                        const catAchievements = achievements.filter(a => a.category === category && (badgeFilter === 'all' || a.category === badgeFilter));
                                        if (catAchievements.length === 0) return null;

                                        return (
                                            <div key={category} className="badge-category-section">
                                                <h3 className="badge-category-title">
                                                    <Target size={18} className="text-yellow" />
                                                    {category.replace(/_/g, ' ')}
                                                    <span className="badge-category-count">{catAchievements.length}</span>
                                                </h3>
                                                <div className="badges-grid">
                                                    {catAchievements.map(ach => {
                                                        const IconComp = getCategoryIcon(ach.icon);
                                                        const isLegendary = ach.rarity === 'LEGENDARY';

                                                        return (
                                                            <div key={ach.id} className={`badge-card ${ach.rarity.toLowerCase()}`}>
                                                                <div className="badge-header">
                                                                    <div className="badge-icon-wrapper">
                                                                        <IconComp size={32} className={isLegendary ? 'text-yellow glow-pulse' : 'text-yellow'} />
                                                                    </div>
                                                                    <span className={`rarity-tag ${ach.rarity.toLowerCase()}`}>
                                                                        {ach.rarity}
                                                                    </span>
                                                                </div>

                                                                <div className="badge-content">
                                                                    <h3>{ach.name}</h3>
                                                                    <p>{ach.description}</p>
                                                                </div>

                                                                <div className="badge-footer">
                                                                    <div className="badge-points">
                                                                        <Trophy size={14} />
                                                                        <span>+{ach.points} pts</span>
                                                                    </div>
                                                                    <div className="badge-unlocks">
                                                                        <Users size={12} />
                                                                        <span>{ach.unlockedCount} unlocked</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .badges-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                    margin-bottom: 40px;
                }

                .badge-card {
                    display: flex;
                    flex-direction: column;
                    background: rgba(10, 10, 10, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 24px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }

                .badge-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(250, 204, 21, 0.4);
                    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
                }

                .badge-card.legendary {
                    background: linear-gradient(145deg, rgba(250, 204, 21, 0.05), rgba(0, 0, 0, 0.8));
                    border-color: rgba(250, 204, 21, 0.3);
                }
                .badge-card.legendary:hover {
                    border-color: var(--yellow);
                    box-shadow: 0 0 20px rgba(250, 204, 21, 0.1);
                }

                .badge-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .badge-icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 56px;
                    height: 56px;
                    background: rgba(250, 204, 21, 0.05);
                    border-radius: 12px;
                    border: 1px solid rgba(250, 204, 21, 0.1);
                }

                .badge-card:hover .badge-icon-wrapper {
                    background: rgba(250, 204, 21, 0.1);
                    border-color: rgba(250, 204, 21, 0.3);
                }

                .rarity-tag {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 4px 8px;
                    border-radius: 4px;
                    letter-spacing: 0.5px;
                }

                .rarity-tag.common { background: rgba(250, 204, 21, 0.03); color: rgba(250, 204, 21, 0.6); border: 1px solid rgba(250, 204, 21, 0.1); }
                .rarity-tag.rare { background: rgba(250, 204, 21, 0.06); color: #a38a08; border: 1px solid rgba(250, 204, 21, 0.2); }
                .rarity-tag.epic { background: rgba(250, 204, 21, 0.10); color: #d4a90a; border: 1px solid rgba(250, 204, 21, 0.3); }
                .rarity-tag.legendary { 
                    background: rgba(250, 204, 21, 0.15); 
                    color: #facc15; 
                    border: 1px solid rgba(250, 204, 21, 0.5);
                    box-shadow: 0 0 10px rgba(250, 204, 21, 0.2);
                }

                .badge-content {
                    flex: 1;
                    margin-bottom: 20px;
                }

                .badge-content h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 8px;
                    line-height: 1.3;
                }

                .badge-content p {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                    line-height: 1.5;
                }

                .badge-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .badge-points {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--yellow);
                    font-weight: 600;
                    font-size: 0.85rem;
                }

                .badge-unlocks {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                }

                .glow-pulse {
                    animation: glowPulse 3s infinite;
                }

                @keyframes glowPulse {
                    0% { filter: drop-shadow(0 0 2px rgba(250, 204, 21, 0.3)); }
                    50% { filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6)); }
                    100% { filter: drop-shadow(0 0 2px rgba(250, 204, 21, 0.3)); }
                }

                .badge-filters {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    justify-content: center;
                    margin-bottom: 40px;
                }

                .filter-btn {
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid rgba(250, 204, 21, 0.2);
                    background: transparent;
                    color: var(--text-muted);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-transform: capitalize;
                }

                .filter-btn:hover {
                    border-color: rgba(250, 204, 21, 0.5);
                    color: var(--yellow);
                }

                .filter-btn.active {
                    background: rgba(250, 204, 21, 0.1);
                    border-color: var(--yellow);
                    color: var(--yellow);
                }

                .badge-category-section {
                    margin-bottom: 48px;
                }

                .badge-category-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(250, 204, 21, 0.1);
                    text-transform: capitalize;
                }

                .badge-category-count {
                    font-size: 12px;
                    padding: 2px 10px;
                    background: rgba(250, 204, 21, 0.1);
                    border: 1px solid rgba(250, 204, 21, 0.2);
                    border-radius: 12px;
                    color: var(--yellow);
                    font-weight: 600;
                }

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
