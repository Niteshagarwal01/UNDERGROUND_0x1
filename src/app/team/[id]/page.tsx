"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Trophy,
    Users,
    Target,
    Clock,
    Shield,
    ChevronLeft,
    Loader2,
    CheckCircle,
    TrendingUp,
    BarChart3,
    Zap
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

// Register Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface TeamData {
    id: string;
    name: string;
    rank: number;
    points: number;
    members: {
        name: string;
        role: string;
        points: number;
        avatarUrl: string | null;
    }[];
    solves: {
        challenge: string;
        category: string;
        points: number;
        time: string;
        isFirstBlood: boolean;
    }[];
    categoryBreakdown: {
        category: string;
        solved: number;
        total: number;
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

export default function TeamProfilePage() {
    const params = useParams();
    const teamId = params.id as string;
    const [team, setTeam] = useState<TeamData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTeam() {
            try {
                const res = await fetch(`/api/teams/${teamId}`);
                const json = await res.json();
                if (json.success) {
                    setTeam(json.team);
                } else {
                    setError(json.message || "Team not found");
                }
            } catch {
                setError("Failed to load team data");
            } finally {
                setLoading(false);
            }
        }

        fetchTeam();
    }, [teamId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black grid-pattern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={40} className="text-yellow spinner" />
            </div>
        );
    }

    if (error || !team) {
        return (
            <div className="min-h-screen bg-black grid-pattern">
                <Navbar />
                <div className="section" style={{ paddingTop: 'calc(var(--nav-height) + 100px)', textAlign: 'center' }}>
                    <Shield size={64} className="text-yellow" style={{ marginBottom: '24px' }} />
                    <h2>{error || "Team Not Found"}</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
                        The team you&apos;re looking for doesn&apos;t exist or there was an error.
                    </p>
                    <Link href="/leaderboard" className="btn btn-primary" style={{ marginTop: '32px' }}>
                        <ChevronLeft size={18} /> Back to Leaderboard
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    // Category breakdown chart
    const categoryChartData = {
        labels: team.categoryBreakdown.map(c => c.category),
        datasets: [{
            data: team.categoryBreakdown.map(c => c.solved),
            backgroundColor: [
                "rgba(250, 204, 21, 0.9)",
                "rgba(250, 204, 21, 0.7)",
                "rgba(250, 204, 21, 0.5)",
                "rgba(250, 204, 21, 0.3)",
                "rgba(250, 204, 21, 0.2)",
            ],
            borderColor: "#0d0d0d",
            borderWidth: 2,
        }],
    };

    // Solves by category bar chart
    const solvesBarData = {
        labels: team.categoryBreakdown.map(c => c.category.split(' ')[0]),
        datasets: [{
            label: "Solved",
            data: team.categoryBreakdown.map(c => c.solved),
            backgroundColor: "#facc15",
            borderRadius: 4,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#525252" } },
            y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#525252" } },
        },
    };

    return (
        <div className="min-h-screen bg-black grid-pattern">
            <Navbar />

            {/* Header */}
            <section className="section" style={{ paddingTop: 'calc(var(--nav-height) + 60px)', paddingBottom: '40px' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <Link href="/leaderboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '32px' }}>
                        <ChevronLeft size={16} /> Back to Leaderboard
                    </Link>

                    <div className="card card-elevated" style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{ width: '80px', height: '80px', background: 'rgba(250, 204, 21, 0.1)', border: '2px solid var(--yellow)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={36} className="text-yellow" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{team.name}</h1>
                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                        <Trophy size={16} className="text-yellow" />
                                        Rank #{team.rank}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                        <Target size={16} />
                                        {team.solves.length} solves
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                        <Users size={16} />
                                        {team.members.length} members
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="text-yellow" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                                    {team.points.toLocaleString()}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Points</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Charts */}
            {team.solves.length > 0 && (
                <section style={{ paddingBottom: '40px' }}>
                    <div className="container" style={{ maxWidth: '1200px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                            {/* Category Breakdown */}
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <TrendingUp size={20} className="text-yellow" />
                                    <h3 style={{ fontSize: '1rem' }}>Category Progress</h3>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                    <div style={{ width: '150px', height: '150px' }}>
                                        <Doughnut data={categoryChartData} options={{ plugins: { legend: { display: false } }, cutout: '60%' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {team.categoryBreakdown.map((cat) => (
                                            <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{cat.category}</span>
                                                <span className="text-yellow">{cat.solved}/{cat.total}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Solves Bar Chart */}
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <BarChart3 size={20} className="text-yellow" />
                                    <h3 style={{ fontSize: '1rem' }}>Solves by Category</h3>
                                </div>
                                <div style={{ height: '200px' }}>
                                    <Bar data={solvesBarData} options={chartOptions} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Members & Solves */}
            <section style={{ paddingBottom: '100px' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                        {/* Team Members */}
                        <div className="card">
                            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Users size={20} className="text-yellow" />
                                Team Members ({team.members.length}/4)
                            </h3>
                            {team.members.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {team.members.map((member, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--black-lighter)', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', background: 'rgba(250, 204, 21, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--yellow)', fontWeight: 700, fontSize: '14px' }}>
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{member.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{member.role}</div>
                                                </div>
                                            </div>
                                            <div className="text-yellow" style={{ fontWeight: 700 }}>{member.points} pts</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No members</p>
                            )}
                        </div>

                        {/* Recent Solves */}
                        <div className="card">
                            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <CheckCircle size={20} className="text-yellow" />
                                Recent Solves
                            </h3>
                            {team.solves.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {team.solves.slice(0, 8).map((solve, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--black-lighter)', borderRadius: '8px' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {solve.challenge}
                                                    {solve.isFirstBlood && (
                                                        <span style={{ color: '#ef4444', fontSize: '12px' }}>🩸 First Blood</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{solve.category} • {formatTimeAgo(solve.time)}</div>
                                            </div>
                                            <div className="text-yellow" style={{ fontWeight: 700 }}>+{solve.points}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <Target size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                    <p>No solves yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
