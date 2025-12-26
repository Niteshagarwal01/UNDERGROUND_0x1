import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const team = await prisma.team.findUnique({
            where: { id },
            include: {
                members: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        totalPoints: true,
                        isTeamLeader: true,
                    },
                },
                solves: {
                    orderBy: { solvedAt: "desc" },
                    take: 20,
                    include: {
                        challenge: {
                            select: {
                                title: true,
                                points: true,
                                category: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!team) {
            return NextResponse.json(
                { success: false, message: "Team not found" },
                { status: 404 }
            );
        }

        // Get team rank
        const teamsAbove = await prisma.team.count({
            where: { totalPoints: { gt: team.totalPoints } },
        });

        // Calculate category breakdown
        const categories = await prisma.category.findMany({
            include: {
                _count: { select: { challenges: true } },
                challenges: {
                    select: {
                        id: true,
                        solves: {
                            where: { teamId: id },
                            select: { id: true },
                        },
                    },
                },
            },
        });

        const categoryBreakdown = categories.map((cat) => ({
            category: cat.name,
            solved: cat.challenges.filter((c) => c.solves.length > 0).length,
            total: cat._count.challenges,
        }));

        return NextResponse.json({
            success: true,
            team: {
                id: team.id,
                name: team.name,
                rank: teamsAbove + 1,
                points: team.totalPoints,
                members: team.members.map((m) => ({
                    name: m.username,
                    role: m.isTeamLeader ? "Leader" : "Member",
                    points: m.totalPoints,
                    avatarUrl: m.avatarUrl,
                })),
                solves: team.solves.map((s) => ({
                    challenge: s.challenge.title,
                    category: s.challenge.category.name,
                    points: s.points,
                    time: s.solvedAt.toISOString(),
                    isFirstBlood: s.isFirstBlood,
                })),
                categoryBreakdown,
            },
        });
    } catch (error) {
        console.error("Error fetching team:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch team" },
            { status: 500 }
        );
    }
}
