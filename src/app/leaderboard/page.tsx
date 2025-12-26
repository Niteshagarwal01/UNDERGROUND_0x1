"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Trophy, Users, Target, Medal, Loader2, Plus, TrendingUp, BarChart3, RefreshCw, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface TeamData {
    rank: number;
    id: string;
    name: string;
    points: number;
    solves: number;
    members: number;
    lastSolve: string | null;
}

interface LeaderboardData {
    leaderboard: TeamData[];
    stats: {
        totalTeams: number;
        totalSolves: number;
        topScore: number;
    };
}

function formatTimeAgo(dateString: string | null): string {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Medal size={24} className="text-yellow" />
                <span style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '1.1rem' }}>#1</span>
            </div>
        );
    }
    if (rank === 2) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Medal size={20} style={{ color: '#a3a3a3' }} />
                <span style={{ color: '#a3a3a3', fontWeight: 700 }}>#2</span>
            </div>
        );
    }
    if (rank === 3) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Medal size={20} style={{ color: '#b45309' }} />
                <span style={{ color: '#b45309', fontWeight: 700 }}>#3</span>
            </div>
        );
    }
    return <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>#{rank}</span>;
}

export default function LeaderboardPage() {
    const { user, isLoaded: userLoaded } = useUser();
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasTeam, setHasTeam] = useState<boolean | null>(null);
    const [lastUpdateDisplay, setLastUpdateDisplay] = useState<string>("—");
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch("/api/leaderboard", { cache: "no-store" });
            const json = await res.json();
            if (json.success) {
                setData(json);
                setError(null);
                // Update time display only on client
                setLastUpdateDisplay(new Date().toLocaleTimeString());
            } else {
                setError(json.message || "Failed to load leaderboard");
            }
        } catch {
            setError("Database connection error. Please check your configuration.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        // Real-time updates every 15 seconds
        intervalRef.current = setInterval(fetchLeaderboard, 15000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (user && userLoaded) {
            fetch("/api/user")
                .then((res) => res.json())
                .then((json) => setHasTeam(!!json.user?.team))
                .catch(() => setHasTeam(false));
        } else if (userLoaded) {
            setHasTeam(false);
        }
    }, [user, userLoaded]);

    const stats = data?.stats || { totalTeams: 0, totalSolves: 0, topScore: 0 };
    const leaderboard = data?.leaderboard || [];

    // Chart data for team points (only if we have data)
    const pointsChartData = {
        labels: leaderboard.slice(0, 10).map(t => t.name),
        datasets: [
            {
                label: "Points",
                data: leaderboard.slice(0, 10).map(t => t.points),
                backgroundColor: "rgba(250, 204, 21, 0.3)",
                borderColor: "#facc15",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
            },
        ],
    };

    // Chart data for solves comparison
    const solvesChartData = {
        labels: leaderboard.slice(0, 10).map(t => t.name),
        datasets: [
            {
                label: "Solves",
                data: leaderboard.slice(0, 10).map(t => t.solves),
                backgroundColor: "#facc15",
                borderRadius: 4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#0d0d0d",
                borderColor: "#1a1a1a",
                borderWidth: 1,
                titleColor: "#facc15",
                bodyColor: "#ffffff",
            },
        },
        scales: {
            x: {
                grid: { color: "rgba(255,255,255,0.05)" },
                ticks: { color: "#525252", font: { size: 10 } },
            },
            y: {
                grid: { color: "rgba(255,255,255,0.05)" },
                ticks: { color: "#525252" },
            },
        },
    };

    return (
        <div className="min-h-screen bg-black grid-pattern">
            <Navbar />

            {/* Header */}
            <section className="section" style={{ paddingTop: 'calc(var(--nav-height) + 60px)', paddingBottom: '40px' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <div className="section-header" style={{ marginBottom: '40px' }}>
                        <h1 className="section-title">
                            <span style={{ color: 'var(--text-muted)' }}>[</span>
                            Leaderboard
                            <span style={{ color: 'var(--text-muted)' }}>]</span>
                        </h1>
                        <p className="section-subtitle">
                            Top teams ranked by total points • Real-time updates
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: '40px' }}>
                        <div className="stat-card">
                            <Users size={24} className="stat-icon" />
                            <div className="stat-value">{stats.totalTeams}</div>
                            <div className="stat-label">Teams</div>
                        </div>
                        <div className="stat-card">
                            <Target size={24} className="stat-icon" />
                            <div className="stat-value">{stats.totalSolves}</div>
                            <div className="stat-label">Total Solves</div>
                        </div>
                        <div className="stat-card">
                            <Trophy size={24} className="stat-icon" />
                            <div className="stat-value">{stats.topScore.toLocaleString()}</div>
                            <div className="stat-label">Top Score</div>
                        </div>
                        <div className="stat-card">
                            <RefreshCw size={24} className="stat-icon" />
                            <div className="stat-value" style={{ fontSize: '1rem' }}>{lastUpdateDisplay}</div>
                            <div className="stat-label">Last Update</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Charts Section - only show if we have data */}
            {leaderboard.length > 0 && (
                <section style={{ paddingBottom: '40px' }}>
                    <div className="container" style={{ maxWidth: '1200px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                            {/* Points Chart */}
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <TrendingUp size={20} className="text-yellow" />
                                    <h3 style={{ fontSize: '1rem' }}>Team Points</h3>
                                </div>
                                <div style={{ height: '200px' }}>
                                    <Line data={pointsChartData} options={chartOptions} />
                                </div>
                            </div>

                            {/* Solves Chart */}
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <BarChart3 size={20} className="text-yellow" />
                                    <h3 style={{ fontSize: '1rem' }}>Challenges Solved</h3>
                                </div>
                                <div style={{ height: '200px' }}>
                                    <Bar data={solvesChartData} options={chartOptions} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Team Requirement Message */}
            {userLoaded && user && hasTeam === false && (
                <section style={{ paddingBottom: '40px' }}>
                    <div className="container" style={{ maxWidth: '1200px' }}>
                        <div className="card" style={{ textAlign: 'center', padding: '40px', borderColor: 'var(--yellow)' }}>
                            <Users size={48} className="text-yellow" style={{ marginBottom: '16px' }} />
                            <h3 style={{ marginBottom: '12px' }}>Create or Join a Team</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                                You need to be in a team to participate. Teams can have 1-4 members.
                            </p>
                            <Link href="/dashboard" className="btn btn-primary">
                                <Plus size={18} /> Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Leaderboard Table */}
            <section style={{ paddingBottom: '100px' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    {loading ? (
                        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
                            <Loader2 size={32} className="text-yellow spinner" />
                        </div>
                    ) : error ? (
                        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
                            <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
                            <button onClick={fetchLeaderboard} className="btn btn-secondary">
                                <RefreshCw size={16} /> Retry
                            </button>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="empty-state">
                            <Trophy size={64} className="empty-state-icon" />
                            <h3 className="empty-state-title">No Teams Yet</h3>
                            <p className="empty-state-text">Be the first to create a team and start competing!</p>
                            <Link href="/enter" className="btn btn-primary">Get Started</Link>
                        </div>
                    ) : (
                        <div className="card card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
                            <table className="leaderboard-table">
                                <thead className="leaderboard-header">
                                    <tr>
                                        <th style={{ width: '100px' }}>Rank</th>
                                        <th>Team</th>
                                        <th style={{ width: '100px', textAlign: 'center' }}>Solves</th>
                                        <th style={{ width: '120px', textAlign: 'right' }}>Points</th>
                                        <th style={{ width: '140px', textAlign: 'right' }} className="hide-mobile">Last Solve</th>
                                        <th style={{ width: '100px', textAlign: 'center' }} className="hide-mobile">Profile</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((team, index) => (
                                        <tr key={team.id} className={`leaderboard-row ${index < 3 ? 'top-3' : ''}`}>
                                            <td><RankBadge rank={team.rank} /></td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: index < 3 ? 'var(--yellow)' : 'white' }}>
                                                    {team.name}
                                                </span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '8px' }}>
                                                    ({team.members})
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{team.solves}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>{team.points.toLocaleString()}</span>
                                            </td>
                                            <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px' }} className="hide-mobile">
                                                {formatTimeAgo(team.lastSolve)}
                                            </td>
                                            <td style={{ textAlign: 'center' }} className="hide-mobile">
                                                <Link href={`/team/${team.id}`} className="btn btn-secondary btn-sm">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>
                        Auto-refreshes every 15 seconds
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
}
