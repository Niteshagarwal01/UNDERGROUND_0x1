import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Get current user's team for solved challenges
        const { userId } = await auth();
        let solvedChallengeIds: string[] = [];

        if (userId) {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId },
                include: {
                    team: {
                        include: {
                            solves: {
                                select: {
                                    challengeId: true,
                                },
                            },
                        },
                    },
                },
            });

            if (user?.team?.solves) {
                solvedChallengeIds = user.team.solves.map(s => s.challengeId);
            }
        }

        // Fetch categories with challenges from database
        const categories = await prisma.category.findMany({
            orderBy: { order: "asc" },
            include: {
                challenges: {
                    where: {
                        isActive: true,
                        isHidden: false,
                    },
                    orderBy: { points: "asc" },
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        description: true,
                        difficulty: true,
                        points: true,
                        solveCount: true,
                        attemptCount: true,
                        resourceUrl: true,
                        driveUrl: true,
                        linktreeUrl: true,
                        // Challenge unlocking system
                        prerequisiteId: true,
                        prerequisite: {
                            select: {
                                id: true,
                                title: true,
                            }
                        },
                        files: {
                            select: {
                                id: true,
                                name: true,
                                url: true,
                                size: true,
                            },
                        },
                    },
                },
            },
        });

        // Calculate totals and add isSolved to each challenge
        const categoriesWithSolveStatus = categories.map(cat => ({
            ...cat,
            challenges: cat.challenges.map(ch => ({
                ...ch,
                isSolved: solvedChallengeIds.includes(ch.id),
            })),
        }));

        const totalChallenges = categories.reduce(
            (sum, cat) => sum + cat.challenges.length,
            0
        );
        const totalPoints = categories.reduce(
            (sum, cat) =>
                sum + cat.challenges.reduce((s, c) => s + c.points, 0),
            0
        );

        // Get total teams count for solve rate calculation
        const totalTeams = await prisma.team.count();

        return NextResponse.json({
            success: true,
            totalChallenges,
            totalPoints,
            totalTeams,
            categories: categoriesWithSolveStatus,
            solvedChallengeIds, // Also return separately for convenience
        });
    } catch (error) {
        console.error("Error fetching challenges:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch challenges" },
            { status: 500 }
        );
    }
}
