import { prisma } from "@/lib/prisma";
import { Flag, Target, Eye } from "lucide-react";
import ChallengesList from "./ChallengesList";

export const dynamic = "force-dynamic";

async function getChallenges() {
    try {
        const challenges = await prisma.challenge.findMany({
            include: {
                category: true,
                solves: {
                    include: {
                        team: true
                    }
                }
            },
            orderBy: [
                { category: { order: 'asc' } },
                { points: 'asc' }
            ]
        });

        const categories = await prisma.category.findMany({
            orderBy: { order: 'asc' }
        });

        const totalTeams = await prisma.team.count();

        return { challenges, categories, totalTeams };
    } catch (error) {
        console.error("Error fetching challenges:", error);
        return { challenges: [], categories: [], totalTeams: 0 };
    }
}

export default async function AdminChallengesPage() {
    const { challenges, categories, totalTeams } = await getChallenges();

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
                    <Flag size={32} style={{ color: 'var(--yellow)' }} />
                    Challenges Management
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                    Create, edit, and manage CTF challenges.
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
                        <Target size={24} style={{ color: 'var(--yellow)' }} />
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                                {challenges.length}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Total Challenges
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <Flag size={24} style={{ color: 'var(--yellow)' }} />
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                                {challenges.filter(c => c.isActive).length}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Active Challenges
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <Eye size={24} style={{ color: 'var(--yellow)' }} />
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                                {challenges.reduce((sum, c) => sum + c.solveCount, 0)}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Total Solves
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Challenges by Category - contains Create button inside */}
            <ChallengesList challenges={challenges} categories={categories} totalTeams={totalTeams} />
        </div>
    );
}
