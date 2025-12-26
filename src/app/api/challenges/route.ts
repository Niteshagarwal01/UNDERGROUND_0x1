import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
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

        // Calculate totals
        const totalChallenges = categories.reduce(
            (sum, cat) => sum + cat.challenges.length,
            0
        );
        const totalPoints = categories.reduce(
            (sum, cat) =>
                sum + cat.challenges.reduce((s, c) => s + c.points, 0),
            0
        );

        return NextResponse.json({
            success: true,
            totalChallenges,
            totalPoints,
            categories,
        });
    } catch (error) {
        console.error("Error fetching challenges:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch challenges" },
            { status: 500 }
        );
    }
}
