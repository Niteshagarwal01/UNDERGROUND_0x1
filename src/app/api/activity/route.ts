import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Get recent activity feed
export async function GET() {
    try {
        // Get recent solves with first blood info
        const recentSolves = await prisma.solve.findMany({
            take: 20,
            orderBy: { solvedAt: 'desc' },
            include: {
                team: {
                    select: { id: true, name: true }
                },
                challenge: {
                    select: {
                        id: true,
                        title: true,
                        points: true,
                        category: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        // Format as activity items
        const activities = recentSolves.map((solve) => ({
            id: solve.id,
            type: solve.isFirstBlood ? 'FIRST_BLOOD' : 'SOLVE',
            teamId: solve.team.id,
            teamName: solve.team.name,
            challengeId: solve.challenge.id,
            challengeTitle: solve.challenge.title,
            categoryName: solve.challenge.category?.name || 'Unknown',
            points: solve.points,
            isFirstBlood: solve.isFirstBlood,
            createdAt: solve.solvedAt
        }));

        // Get first bloods only for hall of fame
        const firstBloods = recentSolves
            .filter(s => s.isFirstBlood)
            .slice(0, 10);

        // Get stats
        const stats = {
            totalSolves: await prisma.solve.count(),
            totalFirstBloods: await prisma.solve.count({ where: { isFirstBlood: true } }),
            totalTeams: await prisma.team.count(),
            recentSolvesCount: recentSolves.length
        };

        return NextResponse.json({
            success: true,
            activities,
            firstBloods: firstBloods.map((fb) => ({
                teamName: fb.team.name,
                challengeTitle: fb.challenge.title,
                categoryName: fb.challenge.category?.name,
                points: fb.points,
                createdAt: fb.solvedAt
            })),
            stats
        });

    } catch (error) {
        console.error("Error fetching activity feed:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch activity" },
            { status: 500 }
        );
    }
}
