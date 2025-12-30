"use client";

import { useState, useEffect } from "react";
import { Users, Shield, Crown, Loader2, Check, X, UserMinus, RefreshCw } from "lucide-react";

interface User {
    id: string;
    username: string;
    email: string;
    role: "USER" | "MODERATOR" | "ADMIN";
    totalPoints: number;
    solvedCount: number;
    isTeamLeader: boolean;
    team: {
        id: string;
        name: string;
    } | null;
}

interface Team {
    id: string;
    name: string;
    totalPoints: number;
    solvedCount: number;
    rank: number | null;
    inviteCode: string;
    members: { id: string }[];
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            const json = await res.json();
            if (json.success) {
                setUsers(json.users);
                if (json.teams) {
                    setTeams(json.teams);
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdating(userId);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole }),
            });
            const json = await res.json();
            if (json.success) {
                setMessage({ type: "success", text: json.message });
                // Update local state
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as User["role"] } : u));
            } else {
                setMessage({ type: "error", text: json.message });
            }
        } catch {
            setMessage({ type: "error", text: "Failed to update role" });
        } finally {
            setUpdating(null);
        }
    };

    const handleRemoveFromTeam = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to remove ${username} from their team?`)) return;

        setUpdating(userId);
        setMessage(null);
        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (json.success) {
                setMessage({ type: "success", text: json.message });
                fetchData();
            } else {
                setMessage({ type: "error", text: json.message });
            }
        } catch {
            setMessage({ type: "error", text: "Failed to remove user from team" });
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <Loader2 size={48} className="spinner" style={{ color: 'var(--yellow)' }} />
            </div>
        );
    }

    const adminCount = users.filter(u => u.role === "ADMIN").length;
    const modCount = users.filter(u => u.role === "MODERATOR").length;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <Users size={28} style={{ color: 'var(--yellow)' }} />
                        Users & Teams
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Manage platform users and their roles.
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Message */}
            {message && (
                <div
                    style={{
                        padding: '16px',
                        marginBottom: '24px',
                        borderRadius: '8px',
                        background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        color: message.type === 'success' ? '#22c55e' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '14px'
                    }}
                >
                    {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
                    {message.text}
                </div>
            )}

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '40px'
            }}>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                        {users.length}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Total Users
                    </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                        {adminCount}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Admins
                    </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                        {modCount}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Moderators
                    </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                        {teams.length}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Total Teams
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--black-border)' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                User
                            </th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                Role
                            </th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                Team
                            </th>
                            <th style={{ padding: '16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                Points
                            </th>
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--black-border)' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {user.role !== 'USER' && <Crown size={14} style={{ color: 'var(--yellow)' }} />}
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                                                {user.username}
                                                {user.isTeamLeader && <span style={{ color: 'var(--yellow)', marginLeft: '6px', fontSize: '10px' }}>(Leader)</span>}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        disabled={updating === user.id}
                                        style={{
                                            padding: '8px 12px',
                                            fontSize: '12px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--black-border)',
                                            background: 'var(--black-card)',
                                            color: user.role === 'ADMIN' ? 'var(--yellow)' : user.role === 'MODERATOR' ? 'var(--yellow)' : 'var(--text-secondary)',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            minWidth: '120px'
                                        }}
                                    >
                                        <option value="USER">USER</option>
                                        <option value="MODERATOR">MODERATOR</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                    {updating === user.id && (
                                        <Loader2 size={14} className="spinner" style={{ marginLeft: '8px', color: 'var(--yellow)' }} />
                                    )}
                                </td>
                                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    {user.team ? user.team.name : '—'}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', color: 'var(--yellow)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                                    {user.totalPoints}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    {user.team && (
                                        <button
                                            onClick={() => handleRemoveFromTeam(user.id, user.username)}
                                            disabled={updating === user.id}
                                            title="Remove from team"
                                            style={{
                                                padding: '6px 10px',
                                                fontSize: '11px',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <UserMinus size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Teams Table */}
            <div style={{ marginTop: '40px', marginBottom: '20px' }}>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Shield size={24} style={{ color: 'var(--yellow)' }} />
                    Active Squads
                </h2>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--black-border)' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                Team Name
                            </th>
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                Members
                            </th>
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                Rank
                            </th>
                            <th style={{ padding: '16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                Points
                            </th>
                            <th style={{ padding: '16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                                Solves
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No teams formed yet.
                                </td>
                            </tr>
                        ) : (
                            teams.map((team) => (
                                <tr key={team.id} style={{ borderBottom: '1px solid var(--black-border)' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                                            {team.name}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            Code: {team.inviteCode}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        {team.members.length} / 4
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        {team.rank ? (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: team.rank <= 3 ? 'rgba(250, 204, 21, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                color: team.rank <= 3 ? 'var(--yellow)' : 'var(--text-muted)',
                                                fontSize: '12px',
                                                fontWeight: 600
                                            }}>
                                                #{team.rank}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--yellow)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                                        {team.totalPoints}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                        {team.solvedCount}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
