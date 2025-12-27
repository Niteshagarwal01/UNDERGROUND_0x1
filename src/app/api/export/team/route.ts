import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Export team stats as JSON or CSV
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user and their team
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                team: {
                    include: {
                        members: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                totalPoints: true,
                                solvedCount: true,
                                isTeamLeader: true,
                            }
                        },
                        solves: {
                            include: {
                                challenge: {
                                    include: {
                                        category: true
                                    }
                                }
                            },
                            orderBy: { createdAt: "desc" }
                        }
                    }
                }
            }
        });

        if (!user || !user.team) {
            return NextResponse.json(
                { success: false, message: "You must be in a team to export stats" },
                { status: 400 }
            );
        }

        const team = user.team;
        const format = request.nextUrl.searchParams.get("format") || "json";

        // Prepare export data
        const exportData = {
            exportedAt: new Date().toISOString(),
            team: {
                name: team.name,
                rank: team.rank,
                totalPoints: team.totalPoints,
                solvedCount: team.solvedCount,
                memberCount: team.members.length,
            },
            members: team.members.map(m => ({
                username: m.username,
                email: m.email,
                points: m.totalPoints,
                solves: m.solvedCount,
                isLeader: m.isTeamLeader,
            })),
            solves: team.solves.map(s => ({
                challenge: s.challenge.title,
                category: s.challenge.category?.name || "Unknown",
                points: s.points,
                isFirstBlood: s.isFirstBlood,
                solvedAt: s.createdAt.toISOString(),
            })),
            statistics: {
                firstBloods: team.solves.filter(s => s.isFirstBlood).length,
                categoriesPlayed: [...new Set(team.solves.map(s => s.challenge.category?.name))].length,
                averagePointsPerSolve: team.solvedCount > 0
                    ? Math.round(team.totalPoints / team.solvedCount)
                    : 0,
            }
        };

        if (format === "csv") {
            // Generate CSV format
            const csvLines = [
                "UNDERGROUND_0x1 CTF - Team Export",
                `Team: ${team.name}`,
                `Rank: #${team.rank || "N/A"}`,
                `Total Points: ${team.totalPoints}`,
                `Total Solves: ${team.solvedCount}`,
                `Exported: ${exportData.exportedAt}`,
                "",
                "MEMBERS",
                "Username,Email,Points,Solves,Leader",
                ...exportData.members.map(m =>
                    `${m.username},${m.email},${m.points},${m.solves},${m.isLeader ? "Yes" : "No"}`
                ),
                "",
                "SOLVES",
                "Challenge,Category,Points,First Blood,Solved At",
                ...exportData.solves.map(s =>
                    `"${s.challenge}",${s.category},${s.points},${s.isFirstBlood ? "Yes" : "No"},${s.solvedAt}`
                ),
            ];

            const csvContent = csvLines.join("\n");

            return new NextResponse(csvContent, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="${team.name.replace(/[^a-z0-9]/gi, '_')}_stats.csv"`,
                },
            });
        }

        // Return JSON format by default
        return NextResponse.json({
            success: true,
            data: exportData,
        });

    } catch (error) {
        console.error("Error exporting team stats:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
