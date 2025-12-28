"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Trophy,
    Target,
    Hash,
    Users,
    Copy,
    Check,
    Plus,
    LogIn,
    LogOut,
    Loader2,
    ChevronRight,
    Shield,
    AlertCircle,
    UserPlus,
    UserCheck,
    UserX,
    Download
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AchievementsDisplay from "@/components/AchievementsDisplay";

interface UserData {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    totalPoints: number;
    solvedCount: number;
    rank: number;
    team: {
        id: string;
        name: string;
        totalPoints: number;
        memberCount: number;
        solveCount: number;
        inviteCode?: string;
    } | null;
    isTeamLeader: boolean;
    recentSolves: {
        challengeTitle: string;
        points: number;
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
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DashboardPage() {
    const { user: clerkUser, isLoaded } = useUser();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Team actions
    const [teamName, setTeamName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [copied, setCopied] = useState(false);

    // Join requests (for team leaders)
    interface JoinRequest {
        id: string;
        user: {
            id: string;
            username: string;
            email: string;
            avatarUrl: string | null;
            totalPoints: number;
            solvedCount: number;
        };
        createdAt: string;
    }
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/user");
            const json = await res.json();
            if (json.success) {
                setUserData(json.user);
                setError(null);
            } else {
                setError(json.message);
            }
        } catch {
            setError("Failed to load user data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && clerkUser) {
            fetchUser();
        } else if (isLoaded) {
            setLoading(false);
        }
    }, [isLoaded, clerkUser]);

    // Fetch join requests for team leaders
    const fetchJoinRequests = async () => {
        if (!userData?.isTeamLeader) return;
        setRequestsLoading(true);
        try {
            const res = await fetch("/api/teams/requests");
            const json = await res.json();
            if (json.success) {
                setJoinRequests(json.requests);
            }
        } catch {
            console.error("Failed to fetch join requests");
        } finally {
            setRequestsLoading(false);
        }
    };

    useEffect(() => {
        if (userData?.isTeamLeader) {
            fetchJoinRequests();
        }
    }, [userData?.isTeamLeader]);

    const handleRequestAction = async (requestId: string, action: "accept" | "decline") => {
        setActionLoading(true);
        setActionMessage(null);
        try {
            const res = await fetch("/api/teams/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action }),
            });
            const json = await res.json();
            if (json.success) {
                setActionMessage({ type: "success", text: json.message });
                await fetchJoinRequests();
                await fetchUser();
            } else {
                setActionMessage({ type: "error", text: json.message });
            }
        } catch {
            setActionMessage({ type: "error", text: "Network error" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName.trim()) return;

        setActionLoading(true);
        setActionMessage(null);

        try {
            const res = await fetch("/api/teams/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: teamName.trim() }),
            });
            const json = await res.json();

            if (json.success) {
                setActionMessage({ type: "success", text: json.message });
                setTeamName("");
                // Refresh user data
                await fetchUser();
            } else {
                setActionMessage({ type: "error", text: json.message });
            }
        } catch {
            setActionMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;

        setActionLoading(true);
        setActionMessage(null);

        try {
            const res = await fetch("/api/teams/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: inviteCode.trim() }),
            });
            const json = await res.json();

            if (json.success) {
                setActionMessage({ type: "success", text: json.message });
                setInviteCode("");
                // Refresh user data
                await fetchUser();
            } else {
                setActionMessage({ type: "error", text: json.message });
            }
        } catch {
            setActionMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setActionLoading(false);
        }
    };

    const copyInviteCode = () => {
        if (userData?.team?.inviteCode) {
            navigator.clipboard.writeText(userData.team.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLeaveTeam = async () => {
        if (!confirm("Are you sure you want to leave this team? You will lose access to team features.")) {
            return;
        }

        setActionLoading(true);
        setActionMessage(null);

        try {
            const res = await fetch("/api/teams/leave", {
                method: "POST",
            });
            const json = await res.json();

            if (json.success) {
                setActionMessage({ type: "success", text: json.message });
                await fetchUser();
            } else {
                setActionMessage({ type: "error", text: json.message });
            }
        } catch {
            setActionMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setActionLoading(false);
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen bg-black grid-pattern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={40} className="text-yellow spinner" />
            </div>
        );
    }

    if (!clerkUser) {
        return (
            <div className="min-h-screen bg-black grid-pattern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ textAlign: 'center', padding: '60px', maxWidth: '400px' }}>
                    <Shield size={48} className="text-yellow" style={{ marginBottom: '24px' }} />
                    <h2 style={{ marginBottom: '12px' }}>Access Denied</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                        Please sign in to view your dashboard
                    </p>
                    <Link href="/enter" className="btn btn-primary">Sign In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black grid-pattern">
            <Navbar />

            {/* Main Content */}
            <main className="section" style={{ paddingTop: 'calc(var(--nav-height) + 60px)' }}>
                <div className="container" style={{ maxWidth: '900px' }}>
                    {error ? (
                        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    ) : null}

                    {/* Welcome Header */}
                    <div className="card card-elevated" style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {clerkUser.imageUrl && (
                                <img
                                    src={clerkUser.imageUrl}
                                    alt="Avatar"
                                    style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid var(--yellow)' }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>
                                    Welcome, <span className="text-yellow">{userData?.username || clerkUser.username || "Operator"}</span>
                                </h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{userData?.email || clerkUser.primaryEmailAddress?.emailAddress}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid" style={{ marginBottom: '32px' }}>
                        <div className="stat-card">
                            <Trophy size={24} className="stat-icon" />
                            <div className="stat-value">{userData?.totalPoints || 0}</div>
                            <div className="stat-label">Points</div>
                        </div>
                        <div className="stat-card">
                            <Target size={24} className="stat-icon" />
                            <div className="stat-value">{userData?.solvedCount || 0}</div>
                            <div className="stat-label">Solves</div>
                        </div>
                        <div className="stat-card">
                            <Hash size={24} className="stat-icon" />
                            <div className="stat-value">#{userData?.rank || "—"}</div>
                            <div className="stat-label">Rank</div>
                        </div>
                        <div className="stat-card">
                            <Users size={24} className="stat-icon" />
                            <div className="stat-value" style={{ fontSize: userData?.team ? '1rem' : '2.5rem' }}>
                                {userData?.team?.name || "—"}
                            </div>
                            <div className="stat-label">Team</div>
                        </div>
                    </div>

                    {/* Action Message */}
                    {actionMessage && (
                        <div
                            className={`alert ${actionMessage.type === "success" ? "alert-success" : "alert-error"}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                        >
                            {actionMessage.type === "success" ? <Check size={20} /> : <AlertCircle size={20} />}
                            {actionMessage.text}
                        </div>
                    )}

                    {/* ============ TEAM CREATION SECTION ============ */}
                    {!userData?.team ? (
                        <div className="card" style={{ marginBottom: '32px', borderColor: 'var(--yellow)', borderWidth: '2px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <UserPlus size={48} className="text-yellow" style={{ marginBottom: '16px' }} />
                                <h2 style={{ marginBottom: '8px' }}>Create or Join a Team</h2>
                                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                                    You need to be part of a team to submit flags and compete. Teams can have <strong className="text-yellow">1-4 members</strong>.
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                {/* Create Team Card */}
                                <div className="card" style={{ background: 'var(--black-lighter)' }}>
                                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Plus size={20} className="text-yellow" />
                                        Create New Team
                                    </h3>
                                    <form onSubmit={handleCreateTeam}>
                                        <div className="input-group">
                                            <label className="input-label">Team Name</label>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Enter team name (3-30 chars)"
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                disabled={actionLoading}
                                                minLength={3}
                                                maxLength={30}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            style={{ width: '100%' }}
                                            disabled={actionLoading || teamName.length < 3}
                                        >
                                            {actionLoading ? <Loader2 size={18} className="spinner" /> : <Plus size={18} />}
                                            Create Team
                                        </button>
                                    </form>
                                </div>

                                {/* Join Team Card */}
                                <div className="card" style={{ background: 'var(--black-lighter)' }}>
                                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <LogIn size={20} className="text-yellow" />
                                        Join Existing Team
                                    </h3>
                                    <form onSubmit={handleJoinTeam}>
                                        <div className="input-group">
                                            <label className="input-label">Invite Code</label>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Enter invite code"
                                                value={inviteCode}
                                                onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                                disabled={actionLoading}
                                                style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-body)' }}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-secondary"
                                            style={{ width: '100%' }}
                                            disabled={actionLoading || !inviteCode.trim()}
                                        >
                                            {actionLoading ? <Loader2 size={18} className="spinner" /> : <LogIn size={18} />}
                                            Join Team
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Team Info (if user has a team) */
                        <div className="card" style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Users size={24} className="text-yellow" />
                                    Team: {userData.team.name}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {userData.isTeamLeader && (
                                        <span className="badge badge-medium">Leader</span>
                                    )}
                                    <Link href={`/team/${userData.team.id}`} className="btn btn-secondary btn-sm">
                                        View Profile
                                    </Link>
                                    <a
                                        href="/api/export/team?format=csv"
                                        download
                                        className="btn btn-secondary btn-sm"
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Download size={14} />
                                        Export
                                    </a>
                                    <button
                                        onClick={handleLeaveTeam}
                                        className="btn btn-sm"
                                        disabled={actionLoading}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        {actionLoading ? <Loader2 size={14} className="spinner" /> : <LogOut size={14} />}
                                        Leave Team
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                <div className="card" style={{ textAlign: 'center', padding: '16px', background: 'var(--black-lighter)' }}>
                                    <div className="text-yellow" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                        {userData.team.totalPoints}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Points</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center', padding: '16px', background: 'var(--black-lighter)' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                        {userData.team.solveCount}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Solves</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center', padding: '16px', background: 'var(--black-lighter)' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                        {userData.team.memberCount}/4
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Members</div>
                                </div>
                            </div>

                            {/* Invite Code for Team Leaders */}
                            {userData.isTeamLeader && userData.team.inviteCode && (
                                <div style={{ background: 'var(--black-lighter)', border: '1px solid var(--black-border)', borderRadius: '8px', padding: '16px' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Invite Code (share with teammates to join your team)
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <code className="text-yellow" style={{ flex: 1, fontSize: '16px', fontWeight: 700, letterSpacing: '0.1em' }}>
                                            {userData.team.inviteCode}
                                        </code>
                                        <button onClick={copyInviteCode} className="btn btn-secondary btn-sm">
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Join Requests for Team Leaders */}
                            {userData.isTeamLeader && (
                                <div style={{ marginTop: '24px' }}>
                                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}>
                                        <UserPlus size={20} className="text-yellow" />
                                        Pending Join Requests
                                        {joinRequests.length > 0 && (
                                            <span style={{
                                                background: 'var(--yellow)',
                                                color: 'var(--black)',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 700
                                            }}>
                                                {joinRequests.length}
                                            </span>
                                        )}
                                    </h3>
                                    {requestsLoading ? (
                                        <div style={{ textAlign: 'center', padding: '24px' }}>
                                            <Loader2 size={24} className="spinner text-yellow" />
                                        </div>
                                    ) : joinRequests.length === 0 ? (
                                        <div style={{
                                            padding: '24px',
                                            textAlign: 'center',
                                            color: 'var(--text-muted)',
                                            background: 'var(--black-lighter)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--black-border)'
                                        }}>
                                            No pending requests
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {joinRequests.map((req) => (
                                                <div
                                                    key={req.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '16px',
                                                        background: 'var(--black-lighter)',
                                                        border: '1px solid var(--black-border)',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            background: 'var(--yellow)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'var(--black)',
                                                            fontWeight: 700
                                                        }}>
                                                            {req.user.username[0]?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{req.user.username}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                                {req.user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handleRequestAction(req.id, "accept")}
                                                            className="btn btn-primary btn-sm"
                                                            disabled={actionLoading || (userData.team?.memberCount ?? 0) >= 4}
                                                            title={(userData.team?.memberCount ?? 0) >= 4 ? "Team is full" : "Accept"}
                                                        >
                                                            <UserCheck size={16} />
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRequestAction(req.id, "decline")}
                                                            className="btn btn-secondary btn-sm"
                                                            disabled={actionLoading}
                                                        >
                                                            <UserX size={16} />
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent Solves */}
                    <div className="card">
                        <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Target size={24} className="text-yellow" />
                            Recent Solves
                        </h2>

                        {userData?.recentSolves && userData.recentSolves.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {userData.recentSolves.map((solve, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px',
                                            background: 'var(--black-lighter)',
                                            border: '1px solid var(--black-border)',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{solve.challengeTitle}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatTimeAgo(solve.solvedAt)}</div>
                                        </div>
                                        <div className="text-yellow" style={{ fontWeight: 700 }}>+{solve.points}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <Target size={48} className="empty-state-icon" />
                                <h3 className="empty-state-title">No Solves Yet</h3>
                                <p className="empty-state-text">
                                    {userData?.team
                                        ? "Start solving challenges to earn points!"
                                        : "Create or join a team first, then start solving!"}
                                </p>
                                <Link href="/challenges" className="btn btn-primary">
                                    View Challenges <ChevronRight size={18} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Achievements */}
                    <div className="card">
                        <AchievementsDisplay />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
