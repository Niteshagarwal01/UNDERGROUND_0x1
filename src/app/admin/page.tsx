import { prisma } from "@/lib/prisma";
import { Users, Shield, Target, Flag, Layers, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";

export const dynamic = "force-dynamic";

async function getStats() {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Current counts
        const userCount = await prisma.user.count();
        const teamCount = await prisma.team.count();
        const challengeCount = await prisma.challenge.count();
        const submissionCount = await prisma.submission.count();

        // Get counts from yesterday/last week for trend calculation
        const usersYesterday = await prisma.user.count({
            where: { createdAt: { lt: yesterday } }
        });
        const teamsYesterday = await prisma.team.count({
            where: { createdAt: { lt: yesterday } }
        });

        // Calculate trends
        const userTrend = usersYesterday > 0
            ? Math.round(((userCount - usersYesterday) / usersYesterday) * 100)
            : userCount > 0 ? 100 : 0;
        const teamTrend = teamsYesterday > 0
            ? Math.round(((teamCount - teamsYesterday) / teamsYesterday) * 100)
            : teamCount > 0 ? 100 : 0;

        // Recent activity
        const recentActivity = await prisma.submission.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { username: true } },
                challenge: { select: { title: true, points: true } }
            }
        });

        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        return {
            userCount,
            teamCount,
            challengeCount,
            submissionCount,
            userTrend,
            teamTrend,
            recentActivity,
            dbConnected: true
        };
    } catch (error) {
        console.error("Admin stats error:", error);
        return null;
    }
}

export default async function AdminDashboard() {
    const stats = await getStats();

    if (!stats) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <Shield size={48} style={{ margin: '0 auto 24px', color: '#ef4444' }} />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '12px' }}>System Offline</h2>
                <p style={{ color: 'var(--text-muted)' }}>Database connection failed.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '12px'
                }}>
                    Command Center
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                    Platform telemetry and operational oversight.
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
            }}
                className="admin-stats-grid"
            >
                <StatCard
                    label="Operatives"
                    value={stats.userCount}
                    icon={Users}
                    color="var(--yellow)"
                    trend={stats.userTrend}
                />
                <StatCard
                    label="Active Cells"
                    value={stats.teamCount}
                    icon={Shield}
                    color="var(--yellow)"
                    trend={stats.teamTrend}
                />
                <StatCard
                    label="Challenges"
                    value={stats.challengeCount}
                    icon={Target}
                    color="var(--yellow)"
                    trend={null}
                />
                <StatCard
                    label="Total Submissions"
                    value={stats.submissionCount}
                    icon={Flag}
                    color="var(--yellow)"
                    trend={null}
                    liveIndicator
                />
            </div>

            {/* Analytics Charts */}
            <AnalyticsCharts />

            {/* Main Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(1, 1fr)',
                gap: '32px'
            }}>
                {/* Recent Activity Feed */}
                <div style={{ gridColumn: 'span 1' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '24px'
                    }}>
                        <h2 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <Layers size={24} className="text-yellow" style={{ color: 'var(--yellow)' }} />
                            Incoming Intelligence
                        </h2>
                        <Link
                            href="/admin/submissions"
                            className="admin-link-hover"
                            style={{
                                fontSize: '14px',
                                color: 'var(--yellow)',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 500,
                                transition: 'opacity 0.2s ease'
                            }}
                        >
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((sub, i) => (
                                <div
                                    key={i}
                                    className="card"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '20px 24px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            background: sub.isCorrect ? '#22c55e' : '#ef4444',
                                            flexShrink: 0
                                        }} />
                                        <div>
                                            <p style={{
                                                fontFamily: 'var(--font-heading)',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                marginBottom: '4px',
                                                fontSize: '14px'
                                            }}>
                                                <span style={{ color: 'var(--yellow)' }}>{sub.user.username}</span> submitted flag for
                                                <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>{sub.challenge.title}</span>
                                            </p>
                                            <p style={{
                                                fontSize: '12px',
                                                color: 'var(--text-muted)',
                                                fontFamily: 'var(--font-body)'
                                            }}>
                                                {new Date(sub.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{
                                        color: sub.isCorrect ? '#22c55e' : '#ef4444',
                                        fontFamily: 'var(--font-body)',
                                        fontWeight: 700,
                                        fontSize: '16px'
                                    }}>
                                        {sub.isCorrect ? `+${sub.challenge.points}` : '✗'}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                                <Flag size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                    No recent activity detected.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Status */}
                <div>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '24px'
                    }}>
                        System Status
                    </h2>
                    <div className="card">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <StatusRow
                                label="Database"
                                status={stats.dbConnected ? "ONLINE" : "OFFLINE"}
                                isHealthy={stats.dbConnected}
                            />
                            <StatusRow
                                label="Flag System"
                                status={stats.challengeCount > 0 ? "ACTIVE" : "NO CHALLENGES"}
                                isHealthy={stats.challengeCount > 0}
                            />
                            <StatusRow
                                label="Registration"
                                status="OPEN"
                                isHealthy={true}
                            />
                            <StatusRow
                                label="Submissions"
                                status={stats.submissionCount > 0 ? "ACTIVE" : "AWAITING"}
                                isHealthy={true}
                            />

                            <div style={{ height: '1px', background: 'var(--black-border)', margin: '12px 0' }} />

                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Emergency controls available in Settings
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusRow({ label, status, isHealthy }: { label: string; status: string; isHealthy: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{label}</span>
            <span style={{
                color: isHealthy ? '#22c55e' : '#f59e0b',
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                letterSpacing: '0.1em'
            }}>
                {status}
            </span>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, trend, liveIndicator }: {
    label: string;
    value: number;
    icon: any;
    color: string;
    trend: number | null;
    liveIndicator?: boolean;
}) {
    const getTrendDisplay = () => {
        if (liveIndicator) {
            return (
                <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    color: '#22c55e',
                    background: 'rgba(34, 197, 94, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        animation: 'pulse 2s infinite'
                    }} />
                    Live
                </span>
            );
        }

        if (trend === null) {
            return (
                <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-muted)',
                    background: 'var(--black-lighter)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--black-border)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <Minus size={10} />
                    Stable
                </span>
            );
        }

        if (trend > 0) {
            return (
                <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    color: '#22c55e',
                    background: 'rgba(34, 197, 94, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <TrendingUp size={10} />
                    +{trend}%
                </span>
            );
        }

        if (trend < 0) {
            return (
                <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <TrendingDown size={10} />
                    {trend}%
                </span>
            );
        }

        return (
            <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-body)',
                color: 'var(--text-muted)',
                background: 'var(--black-lighter)',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid var(--black-border)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                <Minus size={10} />
                0%
            </span>
        );
    };

    return (
        <div className="card card-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(250, 204, 21, 0.1)',
                    border: '1px solid rgba(250, 204, 21, 0.2)',
                    color: color
                }}>
                    <Icon size={24} />
                </div>
                {getTrendDisplay()}
            </div>
            <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--yellow)',
                marginBottom: '8px',
                lineHeight: 1
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-heading)',
                fontWeight: 500
            }}>
                {label}
            </div>
        </div>
    );
}
