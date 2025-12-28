import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Get all first blood solves with challenge and team details
        const firstBloods = await prisma.solve.findMany({
            where: { isFirstBlood: true },
            include: {
                challenge: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        difficulty: true,
                        points: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                icon: true,
                                color: true
                            }
                        }
                    }
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { solvedAt: "desc" }
        });

        // Group first bloods by category
        const byCategory: Record<string, {
            category: {
                id: string;
                name: string;
                slug: string;
                icon: string | null;
                color: string | null;
            };
            firstBloods: {
                challengeId: string;
                challengeTitle: string;
                challengeSlug: string;
                difficulty: string;
                points: number;
                teamId: string;
                teamName: string;
                teamAvatar: string | null;
                solvedAt: Date;
            }[];
        }> = {};

        for (const fb of firstBloods) {
            const catId = fb.challenge.category.id;
            if (!byCategory[catId]) {
                byCategory[catId] = {
                    category: fb.challenge.category,
                    firstBloods: []
                };
            }
            byCategory[catId].firstBloods.push({
                challengeId: fb.challenge.id,
                challengeTitle: fb.challenge.title,
                challengeSlug: fb.challenge.slug,
                difficulty: fb.challenge.difficulty,
                points: fb.points,
                teamId: fb.team.id,
                teamName: fb.team.name,
                teamAvatar: fb.team.avatarUrl,
                solvedAt: fb.solvedAt
            });
        }

        // Calculate first blood leaderboard (teams with most first bloods)
        const teamFirstBloods = await prisma.solve.groupBy({
            by: ["teamId"],
            where: { isFirstBlood: true },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 10
        });

        // Get team details for the leaderboard
        const teamIds = teamFirstBloods.map(t => t.teamId);
        const teams = await prisma.team.findMany({
            where: { id: { in: teamIds } },
            select: {
                id: true,
                name: true,
                avatarUrl: true
            }
        });

        const teamMap = new Map(teams.map(t => [t.id, t]));

        const firstBloodLeaderboard = teamFirstBloods.map((t, index) => {
            const team = teamMap.get(t.teamId);
            return {
                rank: index + 1,
                teamId: t.teamId,
                teamName: team?.name || "Unknown",
                teamAvatar: team?.avatarUrl || null,
                count: t._count.id
            };
        });

        // Stats
        const totalFirstBloods = firstBloods.length;
        const totalTeamsWithFB = new Set(firstBloods.map(fb => fb.teamId)).size;

        return NextResponse.json({
            success: true,
            stats: {
                totalFirstBloods,
                totalTeamsWithFirstBlood: totalTeamsWithFB
            },
            categories: Object.values(byCategory).sort((a, b) =>
                a.category.name.localeCompare(b.category.name)
            ),
            leaderboard: firstBloodLeaderboard
        });

    } catch (error) {
        console.error("Error fetching hall of fame:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch hall of fame data" },
            { status: 500 }
        );
    }
}
