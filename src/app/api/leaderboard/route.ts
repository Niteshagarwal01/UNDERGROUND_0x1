import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        // Get all teams with their members
        const teams = await prisma.team.findMany({
            orderBy: [
                { totalPoints: "desc" },
                { updatedAt: "asc" },
            ],
            include: {
                members: {
                    select: {
                        role: true,
                    },
                },
                _count: {
                    select: { solves: true, members: true },
                },
                solves: {
                    orderBy: { solvedAt: "desc" },
                    take: 1,
                },
            },
        });

        // Filter out teams that have admin or moderator members
        const nonAdminTeams = teams.filter((team) => {
            return !team.members.some((member) => 
                member.role === "ADMIN" || member.role === "MODERATOR"
            );
        });

        // Calculate ranks with proper tie handling
        const leaderboard = nonAdminTeams.map((team, index) => {
            // Handle ties: if previous teams have same points, share rank
            let rank = index + 1;
            if (index > 0) {
                for (let j = index - 1; j >= 0; j--) {
                    if (nonAdminTeams[j].totalPoints === team.totalPoints) {
                        rank = j + 1;
                    } else {
                        break;
                    }
                }
            }

            return {
                rank,
                id: team.id,
                name: team.name,
                points: team.totalPoints,
                solves: team._count.solves,
                members: team._count.members,
                lastSolve: team.solves[0]?.solvedAt?.toISOString() || null,
            };
        });

        const totalTeams = nonAdminTeams.length;
        const totalSolves = nonAdminTeams.reduce((sum, t) => sum + t._count.solves, 0);
        const topScore = nonAdminTeams[0]?.totalPoints || 0;

        return NextResponse.json({
            success: true,
            leaderboard,
            stats: {
                totalTeams,
                totalSolves,
                topScore,
            },
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { 
                success: false, 
                message: `Failed to fetch leaderboard: ${errorMessage}` 
            },
            { status: 500 }
        );
    }
}
