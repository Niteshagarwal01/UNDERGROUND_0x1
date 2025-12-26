import { prisma } from "@/lib/prisma";
import { Flag, CheckCircle, XCircle, ChevronLeft, User, Target, Clock, Filter } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getSubmissions() {
    const submissions = await prisma.submission.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { username: true, email: true } },
            team: { select: { name: true } },
            challenge: { select: { title: true, points: true, slug: true } },
        },
    });

    const stats = {
        total: await prisma.submission.count(),
        correct: await prisma.submission.count({ where: { isCorrect: true } }),
        incorrect: await prisma.submission.count({ where: { isCorrect: false } }),
        today: await prisma.submission.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        }),
    };

    return { submissions, stats };
}

function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

export default async function AdminSubmissionsPage() {
    const { submissions, stats } = await getSubmissions();

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <Link
                    href="/admin"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--text-muted)',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}
                >
                    <ChevronLeft size={16} />
                    Back to Overview
                </Link>
                <h1 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <Flag size={32} style={{ color: 'var(--yellow)' }} />
                    Submissions Log
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                    Complete audit trail of all flag submission attempts.
                </p>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
            }}>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)' }}>
                        {stats.total}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Total Submissions
                    </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}>
                        {stats.correct}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Correct
                    </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>
                        {stats.incorrect}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Incorrect
                    </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stats.today}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Today
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {submissions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                        <Flag size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            No submissions yet.
                        </p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{
                                borderBottom: '1px solid var(--black-border)',
                                background: 'var(--black-lighter)'
                            }}>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Status
                                </th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    User
                                </th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Team
                                </th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Challenge
                                </th>
                                <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Time
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub) => (
                                <tr
                                    key={sub.id}
                                    style={{
                                        borderBottom: '1px solid var(--black-border)',
                                    }}
                                >
                                    <td style={{ padding: '16px 24px' }}>
                                        {sub.isCorrect ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
                                                <CheckCircle size={16} />
                                                Correct
                                            </span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                                                <XCircle size={16} />
                                                Incorrect
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--yellow)' }}>
                                            {sub.user.username}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                                        {sub.team?.name || "—"}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ fontWeight: 500 }}>{sub.challenge.title}</span>
                                        {sub.isCorrect && (
                                            <span style={{ marginLeft: '8px', color: 'var(--yellow)', fontWeight: 700 }}>
                                                +{sub.challenge.points}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px' }}>
                                        {formatTime(sub.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>
                Showing latest 100 submissions
            </p>
        </div>
    );
}
