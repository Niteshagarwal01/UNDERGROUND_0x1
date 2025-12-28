"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Trophy,
    Target,
    Hash,
    Users,
    Medal,
    Loader2,
    ChevronRight,
    Calendar,
    Clock,
    Zap,
    Crown,
    Shield,
    Star,
    Award,
    User,
    ArrowLeft,
    Search,
    FileSearch,
    Cpu,
    Globe,
    Droplet,
    Sword,
    Unlock,
    Gem,
    Skull,
    Swords,
    Dumbbell,
    Lock,
    LucideIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Icon mapping for achievements
const iconMap: Record<string, LucideIcon> = {
    Droplet, Sword, Crown, Target, Unlock, Gem, Trophy, Skull,
    Swords, Dumbbell, Search, FileSearch, Lock, Cpu, Globe, Medal, Zap,
    Star, Award, Shield, Users
};

// No longer needed - points come from API
// const rarityPoints: Record<string, number> = {...}

interface ProfileData {
    id: string;
    username: string;
    avatarUrl: string | null;
    totalPoints: number;
    solvedCount: number;
    rank: number | null; // null for admin users
    isAdmin?: boolean; // flag for admin users
    createdAt: string;
    lastActive: string;
    isTeamLeader: boolean;
    team: {
        id: string;
        name: string;
        totalPoints: number;
        solvedCount: number;
        rank: number | null;
        memberCount: number;
        firstBloodCount: number;
    } | null;
    achievements: {
        id: string;
        name: string;
        description: string;
        icon: string;
        points: number;
        rarity: string;
        category: string;
        earnedAt: string;
    }[];
    solveHistory: {
        challengeTitle: string;
        categoryName: string;
        points: number;
        isFirstBlood: boolean;
        solvedAt: string;
    }[];
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function getRarityColor(rarity: string): string {
    // Yellow and muted tones - higher rarity = more yellow
    switch (rarity) {
        case "LEGENDARY": return "#facc15"; // bright yellow
        case "EPIC": return "#d4a90a"; // gold yellow
        case "RARE": return "#a38a08"; // muted gold
        default: return "#666666"; // gray for common
    }
}

function getRarityBg(rarity: string): string {
    // Yellow-tinted backgrounds with varying intensity
    switch (rarity) {
        case "LEGENDARY": return "rgba(250, 204, 21, 0.15)";
        case "EPIC": return "rgba(250, 204, 21, 0.10)";
        case "RARE": return "rgba(250, 204, 21, 0.06)";
        default: return "rgba(255, 255, 255, 0.03)"; // subtle gray for common
    }
}

function getRarityBorder(rarity: string): string {
    switch (rarity) {
        case "LEGENDARY": return "rgba(250, 204, 21, 0.5)";
        case "EPIC": return "rgba(250, 204, 21, 0.3)";
        case "RARE": return "rgba(250, 204, 21, 0.2)";
        default: return "rgba(255, 255, 255, 0.1)";
    }
}

export default function ProfilePage() {
    const params = useParams();
    const username = params?.username as string;

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!username) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
                const json = await res.json();

                if (json.success) {
                    setProfile(json.profile);
                    setError(null);
                } else {
                    setError(json.message || "Failed to load profile");
                }
            } catch {
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black grid-pattern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={40} className="text-yellow spinner" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-black grid-pattern">
                <Navbar />
                <main className="section" style={{ paddingTop: 'calc(var(--nav-height) + 60px)' }}>
                    <div className="container" style={{ maxWidth: '600px' }}>
                        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                            <User size={64} style={{ color: 'var(--text-muted)', marginBottom: '24px' }} />
                            <h2 style={{ marginBottom: '12px' }}>User Not Found</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                                The user &quot;{username}&quot; doesn&apos;t exist or has been removed.
                            </p>
                            <Link href="/leaderboard" className="btn btn-primary">
                                <ArrowLeft size={18} />
                                Back to Leaderboard
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black grid-pattern">
            <Navbar />

            <main className="section" style={{ paddingTop: 'calc(var(--nav-height) + 60px)' }}>
                <div className="container" style={{ maxWidth: '900px' }}>
                    {/* Profile Header */}
                    <div className="card card-elevated" style={{ marginBottom: '32px' }}>
                        <div className="profile-header">
                            <div className="profile-avatar-section">
                                {profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt={profile.username}
                                        className="profile-avatar"
                                    />
                                ) : (
                                    <div className="profile-avatar profile-avatar-placeholder">
                                        {profile.username[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div className="profile-info">
                                    <h1 className="profile-username">
                                        {profile.username}
                                        {profile.isTeamLeader && (
                                            <Crown size={20} className="text-yellow" style={{ marginLeft: '8px' }} />
                                        )}
                                        {profile.isAdmin && (
                                            <span className="badge badge-medium" style={{ marginLeft: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>ADMIN</span>
                                        )}
                                    </h1>
                                    <div className="profile-meta">
                                        <span className="profile-meta-item">
                                            <Calendar size={14} />
                                            Joined {formatDate(profile.createdAt)}
                                        </span>
                                        <span className="profile-meta-item">
                                            <Clock size={14} />
                                            Active {formatTimeAgo(profile.lastActive)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {profile.team && (
                                <Link href={`/team/${profile.team.id}`} className="btn btn-secondary">
                                    <Users size={16} />
                                    {profile.team.name}
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid" style={{ marginBottom: '32px' }}>
                        <div className="stat-card">
                            <Trophy size={24} className="stat-icon" />
                            <div className="stat-value">{profile.totalPoints.toLocaleString()}</div>
                            <div className="stat-label">Points</div>
                        </div>
                        <div className="stat-card">
                            <Target size={24} className="stat-icon" />
                            <div className="stat-value">{profile.solvedCount}</div>
                            <div className="stat-label">Solves</div>
                        </div>
                        <div className="stat-card">
                            <Hash size={24} className="stat-icon" />
                            <div className="stat-value">
                                {profile.rank !== null ? `#${profile.rank}` : '—'}
                            </div>
                            <div className="stat-label">{profile.isAdmin ? 'Admin' : 'Rank'}</div>
                        </div>
                        <div className="stat-card">
                            <Zap size={24} className="stat-icon" />
                            <div className="stat-value">{profile.team?.firstBloodCount || 0}</div>
                            <div className="stat-label">First Bloods</div>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="profile-grid">
                        {/* Achievements */}
                        <div className="card">
                            <h2 className="card-title">
                                <Award size={24} className="text-yellow" />
                                Achievements
                                <span className="badge badge-easy" style={{ marginLeft: 'auto' }}>
                                    {profile.achievements.length}
                                </span>
                            </h2>

                            {profile.achievements.length > 0 ? (
                                <div className="achievements-grid">
                                    {profile.achievements.map((achievement) => {
                                        const IconComponent = iconMap[achievement.icon] || Award;
                                        const points = achievement.points; // Use points from API
                                        return (
                                            <div
                                                key={achievement.id}
                                                className="achievement-card"
                                                style={{
                                                    background: getRarityBg(achievement.rarity),
                                                    borderColor: getRarityColor(achievement.rarity)
                                                }}
                                            >
                                                <div className="achievement-icon-wrapper" style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '10px',
                                                    background: `linear-gradient(135deg, ${getRarityBg(achievement.rarity)}, transparent)`,
                                                    border: `1px solid ${getRarityColor(achievement.rarity)}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <IconComponent size={22} style={{ color: getRarityColor(achievement.rarity) }} />
                                                </div>
                                                <div className="achievement-info" style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="achievement-name" style={{
                                                        color: getRarityColor(achievement.rarity),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginBottom: '4px'
                                                    }}>
                                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{achievement.name}</span>
                                                        <span style={{
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            background: getRarityBg(achievement.rarity),
                                                            border: `1px solid ${getRarityColor(achievement.rarity)}`,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {achievement.rarity}
                                                        </span>
                                                    </div>
                                                    <div className="achievement-description" style={{
                                                        fontSize: '12px',
                                                        color: 'var(--text-muted)',
                                                        marginBottom: '6px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {achievement.description}
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        fontSize: '11px'
                                                    }}>
                                                        <span style={{
                                                            color: 'var(--yellow)',
                                                            fontWeight: 700,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            <Zap size={12} />
                                                            +{points} pts
                                                        </span>
                                                        <span style={{ color: '#666' }}>
                                                            {formatTimeAgo(achievement.earnedAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: '40px' }}>
                                    <Star size={48} className="empty-state-icon" />
                                    <p className="empty-state-text">No achievements yet</p>
                                </div>
                            )}
                        </div>

                        {/* Solve History */}
                        <div className="card">
                            <h2 className="card-title">
                                <Target size={24} className="text-yellow" />
                                Solve History
                            </h2>

                            {profile.solveHistory.length > 0 ? (
                                <div className="solve-history">
                                    {profile.solveHistory.map((solve, index) => (
                                        <div key={index} className="solve-item">
                                            <div className="solve-info">
                                                <div className="solve-title">
                                                    {solve.challengeTitle}
                                                    {solve.isFirstBlood && (
                                                        <Medal size={14} className="text-yellow" style={{ marginLeft: '6px' }} />
                                                    )}
                                                </div>
                                                <div className="solve-meta">
                                                    <span>{solve.categoryName}</span>
                                                    <span>•</span>
                                                    <span>{formatTimeAgo(solve.solvedAt)}</span>
                                                </div>
                                            </div>
                                            <div className="solve-points">+{solve.points}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: '40px' }}>
                                    <Shield size={48} className="empty-state-icon" />
                                    <p className="empty-state-text">No solves yet</p>
                                    {!profile.team && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            Join a team to start solving!
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Team Info (if has team) */}
                    {profile.team && (
                        <div className="card" style={{ marginTop: '32px' }}>
                            <h2 className="card-title">
                                <Users size={24} className="text-yellow" />
                                Team: {profile.team.name}
                                {profile.isTeamLeader && (
                                    <span className="badge badge-medium" style={{ marginLeft: '12px' }}>Leader</span>
                                )}
                            </h2>

                            <div className="team-stats-row">
                                <div className="team-stat">
                                    <Trophy size={18} className="text-yellow" />
                                    <span className="team-stat-value">{profile.team.totalPoints.toLocaleString()}</span>
                                    <span className="team-stat-label">Points</span>
                                </div>
                                <div className="team-stat">
                                    <Target size={18} className="text-yellow" />
                                    <span className="team-stat-value">{profile.team.solvedCount}</span>
                                    <span className="team-stat-label">Solves</span>
                                </div>
                                <div className="team-stat">
                                    <Users size={18} className="text-yellow" />
                                    <span className="team-stat-value">{profile.team.memberCount}/4</span>
                                    <span className="team-stat-label">Members</span>
                                </div>
                                <div className="team-stat">
                                    <Zap size={18} className="text-yellow" />
                                    <span className="team-stat-value">{profile.team.firstBloodCount}</span>
                                    <span className="team-stat-label">First Bloods</span>
                                </div>
                            </div>

                            <Link href={`/team/${profile.team.id}`} className="btn btn-primary" style={{ marginTop: '24px' }}>
                                View Team Profile
                                <ChevronRight size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .profile-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                
                .profile-avatar-section {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                
                .profile-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: 3px solid var(--yellow);
                    object-fit: cover;
                }
                
                .profile-avatar-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--yellow);
                    color: var(--black);
                    font-size: 2rem;
                    font-weight: 700;
                }
                
                .profile-username {
                    font-size: 1.75rem;
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .profile-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                
                .profile-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-muted);
                    font-size: 13px;
                }
                
                .profile-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }
                
                .card-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                    font-size: 1.1rem;
                }
                
                .achievements-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .achievement-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid;
                }
                
                .achievement-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                
                .achievement-name {
                    font-weight: 600;
                    font-size: 14px;
                }
                
                .achievement-description {
                    font-size: 12px;
                    color: var(--text-muted);
                }
                
                .solve-history {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .solve-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: var(--black-lighter);
                    border: 1px solid var(--black-border);
                    border-radius: 8px;
                }
                
                .solve-title {
                    font-weight: 600;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                }
                
                .solve-meta {
                    display: flex;
                    gap: 8px;
                    font-size: 12px;
                    color: var(--text-muted);
                    margin-top: 4px;
                }
                
                .solve-points {
                    color: var(--yellow);
                    font-weight: 700;
                    font-size: 14px;
                }
                
                .team-stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                }
                
                .team-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 16px;
                    background: var(--black-lighter);
                    border-radius: 8px;
                }
                
                .team-stat-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                
                .team-stat-label {
                    font-size: 12px;
                    color: var(--text-muted);
                }
                
                @media (max-width: 768px) {
                    .profile-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    
                    .profile-avatar-section {
                        flex-direction: column;
                        align-items: flex-start;
                        text-align: left;
                    }
                    
                    .profile-avatar {
                        width: 64px;
                        height: 64px;
                    }
                    
                    .profile-username {
                        font-size: 1.5rem;
                    }
                    
                    .profile-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .team-stats-row {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .profile-meta {
                        flex-direction: column;
                        gap: 8px;
                    }
                }
            `}</style>
        </div>
    );
}
