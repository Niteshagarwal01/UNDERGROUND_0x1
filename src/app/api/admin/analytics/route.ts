import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Check if user is admin
async function checkAdmin() {
    const { userId } = await auth();
    if (!userId) {
        return { isAdmin: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!user) {
        return { isAdmin: false, error: "Forbidden" };
    }

    const isDirectAdmin = user.role === "ADMIN";
    const isModerator = user.role === "MODERATOR";

    if (!isDirectAdmin && !isModerator) {
        return { isAdmin: false, error: "Forbidden" };
    }

    return { isAdmin: true };
}

// GET - Fetch analytics data
export async function GET() {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get solves per day for last 30 days
        const solves = await prisma.solve.findMany({
            where: { solvedAt: { gte: thirtyDaysAgo } },
            select: { solvedAt: true, points: true }
        });

        // Group solves by date
        const solvesByDate: Record<string, { count: number; points: number }> = {};
        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split("T")[0];
            solvesByDate[dateKey] = { count: 0, points: 0 };
        }
        solves.forEach(solve => {
            const dateKey = solve.solvedAt.toISOString().split("T")[0];
            if (solvesByDate[dateKey]) {
                solvesByDate[dateKey].count++;
                solvesByDate[dateKey].points += solve.points;
            }
        });

        // Get user registrations per day for last 30 days
        const users = await prisma.user.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true }
        });

        const usersByDate: Record<string, number> = {};
        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split("T")[0];
            usersByDate[dateKey] = 0;
        }
        users.forEach(user => {
            const dateKey = user.createdAt.toISOString().split("T")[0];
            if (usersByDate[dateKey] !== undefined) {
                usersByDate[dateKey]++;
            }
        });

        // Get category distribution
        const categories = await prisma.category.findMany({
            include: {
                challenges: {
                    select: { solveCount: true }
                }
            }
        });

        const categoryStats = categories.map(cat => ({
            name: cat.name,
            totalSolves: cat.challenges.reduce((sum, c) => sum + c.solveCount, 0),
            challengeCount: cat.challenges.length
        }));

        // Get challenge difficulty distribution
        const difficultyStats = await prisma.challenge.groupBy({
            by: ["difficulty"],
            _count: { id: true },
            _sum: { solveCount: true }
        });

        // Get top 10 most solved challenges
        const topChallenges = await prisma.challenge.findMany({
            take: 10,
            orderBy: { solveCount: "desc" },
            select: {
                title: true,
                solveCount: true,
                points: true,
                difficulty: true,
                category: { select: { name: true } }
            }
        });

        // Get top 10 least solved (excluding 0 solves)
        const hardestChallenges = await prisma.challenge.findMany({
            where: {
                isActive: true,
                attemptCount: { gt: 0 }
            },
            take: 10,
            orderBy: { solveCount: "asc" },
            select: {
                title: true,
                solveCount: true,
                attemptCount: true,
                points: true,
                difficulty: true,
                category: { select: { name: true } }
            }
        });

        // Calculate solve rates
        const challengesWithRates = await prisma.challenge.findMany({
            where: { attemptCount: { gt: 0 } },
            select: {
                title: true,
                solveCount: true,
                attemptCount: true
            }
        });

        const avgSolveRate = challengesWithRates.length > 0
            ? challengesWithRates.reduce((sum, c) => sum + (c.solveCount / c.attemptCount), 0) / challengesWithRates.length
            : 0;

        // Get first bloods
        const firstBloods = await prisma.solve.findMany({
            where: { isFirstBlood: true },
            orderBy: { solvedAt: "desc" },
            take: 10,
            include: {
                team: { select: { name: true } },
                challenge: {
                    select: {
                        title: true,
                        points: true,
                        category: { select: { name: true } }
                    }
                }
            }
        });

        // Weekly stats
        const weeklyStats = {
            solves: solves.filter(s => s.solvedAt >= sevenDaysAgo).length,
            users: users.filter(u => u.createdAt >= sevenDaysAgo).length,
            teams: await prisma.team.count({ where: { createdAt: { gte: sevenDaysAgo } } })
        };

        return NextResponse.json({
            success: true,
            analytics: {
                solveTrends: Object.entries(solvesByDate)
                    .map(([date, data]) => ({ date, ...data }))
                    .sort((a, b) => a.date.localeCompare(b.date)),
                userTrends: Object.entries(usersByDate)
                    .map(([date, count]) => ({ date, count }))
                    .sort((a, b) => a.date.localeCompare(b.date)),
                categoryStats,
                difficultyStats: difficultyStats.map(d => ({
                    difficulty: d.difficulty,
                    count: d._count.id,
                    totalSolves: d._sum.solveCount || 0
                })),
                topChallenges,
                hardestChallenges: hardestChallenges.map(c => ({
                    ...c,
                    solveRate: c.attemptCount > 0 ? (c.solveCount / c.attemptCount * 100).toFixed(1) : "0"
                })),
                avgSolveRate: (avgSolveRate * 100).toFixed(1),
                firstBloods,
                weeklyStats
            }
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
