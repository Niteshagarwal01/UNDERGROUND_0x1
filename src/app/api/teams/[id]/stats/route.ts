import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Team ID is required" },
                { status: 400 }
            );
        }

        // Fetch team with stats
        const team = await prisma.team.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                avatarUrl: true,
                totalPoints: true,
                solvedCount: true,
                rank: true,
                createdAt: true,
                _count: {
                    select: { members: true }
                },
                members: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        totalPoints: true,
                        solvedCount: true,
                        isTeamLeader: true,
                        role: true
                    }
                }
            }
        });

        if (!team) {
            return NextResponse.json(
                { success: false, message: "Team not found" },
                { status: 404 }
            );
        }

        // Get first blood count
        const firstBloodCount = await prisma.solve.count({
            where: {
                teamId: id,
                isFirstBlood: true
            }
        });

        // Check if this is an admin team
        const isAdminTeam = team.members.some(
            member => member.role === "ADMIN" || member.role === "MODERATOR"
        );

        // Calculate team rank if not admin team
        let teamRank: number | null = null;
        if (!isAdminTeam) {
            if (team.rank) {
                teamRank = team.rank;
            } else {
                const teamsWithHigherPoints = await prisma.team.count({
                    where: {
                        totalPoints: { gt: team.totalPoints }
                    }
                });
                teamRank = teamsWithHigherPoints + 1;
            }
        }

        return NextResponse.json({
            success: true,
            team: {
                id: team.id,
                name: team.name,
                description: team.description,
                avatarUrl: team.avatarUrl,
                totalPoints: team.totalPoints,
                solvedCount: team.solvedCount,
                rank: teamRank,
                memberCount: team._count.members,
                firstBloodCount,
                createdAt: team.createdAt,
                isAdminTeam,
                members: team.members.map(m => ({
                    id: m.id,
                    username: m.username,
                    avatarUrl: m.avatarUrl,
                    totalPoints: m.totalPoints,
                    solvedCount: m.solvedCount,
                    isTeamLeader: m.isTeamLeader
                }))
            }
        });

    } catch (error) {
        console.error("Error fetching team stats:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch team stats" },
            { status: 500 }
        );
    }
}
