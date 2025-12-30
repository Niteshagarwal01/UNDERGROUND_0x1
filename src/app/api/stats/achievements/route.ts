
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const achievements = await prisma.achievement.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: [
                { rarity: 'desc' }, // LEGENDARY first
                { points: 'desc' }
            ]
        });

        // Format for frontend
        const stats = achievements.map(ach => ({
            id: ach.id,
            slug: ach.slug,
            name: ach.name,
            description: ach.description,
            icon: ach.icon,
            points: ach.points,
            rarity: ach.rarity,
            category: ach.category,
            unlockedCount: ach._count.users
        }));

        return NextResponse.json({
            success: true,
            achievements: stats
        });
    } catch (error) {
        console.error("Error fetching achievement stats:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
