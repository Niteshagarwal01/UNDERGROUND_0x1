import prisma from "@/lib/prisma";
import { Users, Shield, Search, UserPlus, Trash2, Crown } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getUsersAndTeams() {
    try {
        const users = await prisma.user.findMany({
            include: {
                team: {
                    include: {
                        members: true
                    }
                }
            },
            orderBy: { totalPoints: "desc" }
        });

        const teams = await prisma.team.findMany({
            include: {
                members: true
            },
            orderBy: { totalPoints: "desc" }
        });

        return { users, teams };
    } catch (error) {
        console.error("Error fetching users and teams:", error);
        return { users: [], teams: [] };
    }
}

export default async function AdminUsersPage() {
    const { users, teams } = await getUsersAndTeams();

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
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
                    <Users size={32} style={{ color: 'var(--yellow)' }} />
                    Users & Teams Management
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                    Manage platform users, teams, and permissions.
                </p>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '24px',
                marginBottom: '48px'
            }}>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <Users size={24} style={{ color: 'var(--yellow)' }} />
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                                {users.length}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Total Users
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <Shield size={24} style={{ color: 'var(--yellow)' }} />
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                                {teams.length}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Active Teams
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teams Section */}
            <div style={{ marginBottom: '48px' }}>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '24px'
                }}>
                    Teams
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {teams.length > 0 ? (
                        teams.map((team) => (
                            <div key={team.id} className="card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {team.name}
                                            </h3>
                                            {team.rank && (
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: 'var(--yellow)',
                                                    background: 'rgba(250, 204, 21, 0.1)',
                                                    padding: '4px 10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(250, 204, 21, 0.2)'
                                                }}>
                                                    Rank #{team.rank}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            <span>Points: <strong style={{ color: 'var(--yellow)' }}>{team.totalPoints}</strong></span>
                                            <span>Solves: <strong>{team.solvedCount}</strong></span>
                                            <span>Members: <strong>{team.members.length}/4</strong></span>
                                        </div>
                                        {team.inviteCode && (
                                            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                Invite Code: <code style={{ color: 'var(--yellow)', fontFamily: 'var(--font-body)' }}>{team.inviteCode}</code>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                            <Shield size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No teams found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Users Section */}
            <div>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '24px'
                }}>
                    Users
                </h2>
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--black-border)' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                    Username
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                    Email
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                    Role
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                    Team
                                </th>
                                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                    Points
                                </th>
                                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                    Solves
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--black-border)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {(user.role === 'ADMIN' || user.role === 'MODERATOR') && <Crown size={16} style={{ color: 'var(--yellow)' }} />}
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                            {user.email}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '4px 10px',
                                                borderRadius: '4px',
                                                background: user.role === 'ADMIN' ? 'rgba(250, 204, 21, 0.1)' : user.role === 'MODERATOR' ? 'rgba(250, 204, 21, 0.1)' : 'rgba(163, 163, 163, 0.1)',
                                                color: user.role === 'ADMIN' ? 'var(--yellow)' : user.role === 'MODERATOR' ? 'var(--yellow)' : 'var(--text-secondary)',
                                                border: `1px solid ${user.role === 'ADMIN' ? 'rgba(250, 204, 21, 0.2)' : user.role === 'MODERATOR' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(163, 163, 163, 0.2)'}`,
                                                textTransform: 'uppercase',
                                                fontWeight: 600
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                            {user.team ? user.team.name : '—'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: 'var(--yellow)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                                            {user.totalPoints}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                            {user.solvedCount}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

