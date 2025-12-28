import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// GET: Get all achievements and user's earned achievements
export async function GET() {
    try {
        const { userId: clerkId } = await auth();

        // Get all achievements
        const achievements = await prisma.achievement.findMany({
            orderBy: [
                { rarity: 'desc' },
                { category: 'asc' },
                { name: 'asc' }
            ]
        });

        // If user is logged in, get their earned achievements
        let earnedAchievementIds: string[] = [];
        if (clerkId) {
            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (user) {
                const userAchievements = await prisma.userAchievement.findMany({
                    where: { userId: user.id },
                    select: { achievementId: true, earnedAt: true }
                });
                earnedAchievementIds = userAchievements.map(ua => ua.achievementId);
            }
        }

        // Format response
        const formattedAchievements = achievements.map(a => ({
            ...a,
            earned: earnedAchievementIds.includes(a.id)
        }));

        return NextResponse.json({
            success: true,
            achievements: formattedAchievements,
            earnedCount: earnedAchievementIds.length,
            totalCount: achievements.length
        });

    } catch (error) {
        console.error("Error fetching achievements:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch achievements" },
            { status: 500 }
        );
    }
}
