"use client";

import { Settings, AlertTriangle, Shield, Users, Flag, Mail, Bell, Clock, Construction } from "lucide-react";

export default function AdminSettingsPage() {
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
                    <Settings size={32} style={{ color: 'var(--yellow)' }} />
                    Platform Settings
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                    Configure competition settings and platform behavior.
                </p>
            </div>

            {/* Coming Soon Banner */}
            <div className="card" style={{
                textAlign: 'center',
                padding: '60px 24px',
                background: 'rgba(250, 204, 21, 0.03)',
                border: '1px dashed rgba(250, 204, 21, 0.3)'
            }}>
                <Construction size={64} style={{ color: 'var(--yellow)', margin: '0 auto 24px', opacity: 0.8 }} />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '12px' }}>
                    Settings Coming Soon
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '500px', margin: '0 auto 32px' }}>
                    Platform configuration options are under development.
                    Currently, settings can be modified through environment variables.
                </p>

                {/* Current Settings Preview (Read-Only) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    maxWidth: '600px',
                    margin: '0 auto',
                    textAlign: 'left'
                }}>
                    <div className="card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Clock size={16} style={{ color: 'var(--yellow)' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rate Limit</span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>5 attempts/min</div>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Users size={16} style={{ color: 'var(--yellow)' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team Size</span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Max 4 members</div>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Shield size={16} style={{ color: 'var(--yellow)' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registration</span>
                        </div>
                        <div style={{ fontWeight: 600, color: '#22c55e' }}>Open</div>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Flag size={16} style={{ color: 'var(--yellow)' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submissions</span>
                        </div>
                        <div style={{ fontWeight: 600, color: '#22c55e' }}>Active</div>
                    </div>
                </div>
            </div>

            {/* Environment Variables Reference */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <AlertTriangle size={18} style={{ color: 'var(--yellow)' }} />
                    Environment Configuration
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                    The following environment variables can be set in your <code style={{ color: 'var(--yellow)' }}>.env.local</code> file:
                </p>
                <div style={{
                    background: 'var(--black-lighter)',
                    padding: '16px',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    lineHeight: '2'
                }}>
                    <div style={{ color: 'var(--text-muted)' }}># Database</div>
                    <div><span style={{ color: 'var(--yellow)' }}>DATABASE_URL</span>=your_neon_connection_string</div>
                    <br />
                    <div style={{ color: 'var(--text-muted)' }}># Authentication (Clerk)</div>
                    <div><span style={{ color: 'var(--yellow)' }}>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span>=pk_...</div>
                    <div><span style={{ color: 'var(--yellow)' }}>CLERK_SECRET_KEY</span>=sk_...</div>
                    <br />
                    <div style={{ color: 'var(--text-muted)' }}># Admin Email (for role management)</div>
                    <div><span style={{ color: 'var(--yellow)' }}>ADMIN_EMAIL</span>=your-admin@email.com</div>
                </div>
            </div>
        </div>
    );
}
