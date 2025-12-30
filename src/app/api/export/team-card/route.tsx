import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get("teamId");

        if (!teamId) {
            return new Response("Team ID is required", { status: 400 });
        }

        // Fetch team data directly from database
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: {
                id: true,
                name: true,
                totalPoints: true,
                solvedCount: true,
                members: {
                    select: {
                        id: true,
                        role: true
                    }
                }
            }
        });

        if (!team) {
            return new Response("Team not found", { status: 404 });
        }

        // Check if admin team
        const isAdminTeam = team.members.some(
            m => m.role === "ADMIN" || m.role === "MODERATOR"
        );

        // Get first blood count
        const firstBloodCount = await prisma.solve.count({
            where: {
                teamId: teamId,
                isFirstBlood: true
            }
        });

        // Calculate rank if not admin team
        let teamRank: number | null = null;
        if (!isAdminTeam) {
            const teamsWithHigherPoints = await prisma.team.count({
                where: {
                    totalPoints: { gt: team.totalPoints }
                }
            });
            teamRank = teamsWithHigherPoints + 1;
        }

        const teamData = {
            name: team.name,
            totalPoints: team.totalPoints,
            solvedCount: team.solvedCount,
            rank: teamRank,
            memberCount: team.members.length,
            firstBloodCount,
            isAdminTeam
        };

        return new ImageResponse(
            (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
                        padding: "40px",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                >
                    {/* Header Row */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "32px",
                        }}
                    >
                        {/* Left: Avatar + Team Info */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                            }}
                        >
                            {/* Avatar Circle */}
                            <div
                                style={{
                                    width: "64px",
                                    height: "64px",
                                    borderRadius: "50%",
                                    background: "#facc15",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "28px",
                                    fontWeight: 700,
                                    color: "#0a0a0a",
                                }}
                            >
                                {teamData.name[0]?.toUpperCase() || "T"}
                            </div>
                            {/* Team Name + Rank */}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: 700,
                                        color: "#ffffff",
                                    }}
                                >
                                    {teamData.name}
                                </span>
                                <span
                                    style={{
                                        fontSize: "16px",
                                        color: "#facc15",
                                    }}
                                >
                                    {teamData.isAdminTeam ? "Admin Team" : `Rank #${teamData.rank || "—"}`}
                                </span>
                            </div>
                        </div>
                        {/* Right: Branding */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "14px",
                                    color: "#737373",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                UNDERGROUND
                            </span>
                            <span
                                style={{
                                    fontSize: "20px",
                                    color: "#facc15",
                                    fontWeight: 700,
                                }}
                            >
                                _0x1
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid Row */}
                    <div
                        style={{
                            display: "flex",
                            gap: "20px",
                            flex: 1,
                        }}
                    >
                        {/* Points Box */}
                        <div
                            style={{
                                flex: 1,
                                background: "rgba(250, 204, 21, 0.1)",
                                border: "1px solid rgba(250, 204, 21, 0.2)",
                                borderRadius: "16px",
                                padding: "24px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "48px",
                                    fontWeight: 700,
                                    color: "#facc15",
                                }}
                            >
                                {teamData.totalPoints.toLocaleString()}
                            </span>
                            <span
                                style={{
                                    fontSize: "14px",
                                    color: "#737373",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                Total Points
                            </span>
                        </div>

                        {/* Solves Box */}
                        <div
                            style={{
                                flex: 1,
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "16px",
                                padding: "24px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "48px",
                                    fontWeight: 700,
                                    color: "#ffffff",
                                }}
                            >
                                {teamData.solvedCount}
                            </span>
                            <span
                                style={{
                                    fontSize: "14px",
                                    color: "#737373",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                Challenges Solved
                            </span>
                        </div>
                    </div>

                    {/* Bottom Stats Row */}
                    <div
                        style={{
                            display: "flex",
                            gap: "20px",
                            marginTop: "20px",
                        }}
                    >
                        {/* Members Box */}
                        <div
                            style={{
                                flex: 1,
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "28px",
                                    fontWeight: 700,
                                    color: "#ffffff",
                                }}
                            >
                                {teamData.memberCount}/4
                            </span>
                            <span
                                style={{
                                    fontSize: "12px",
                                    color: "#737373",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                Members
                            </span>
                        </div>

                        {/* First Bloods Box */}
                        <div
                            style={{
                                flex: 1,
                                background: "rgba(250, 204, 21, 0.05)",
                                border: "1px solid rgba(250, 204, 21, 0.15)",
                                borderRadius: "12px",
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "28px",
                                    fontWeight: 700,
                                    color: "#facc15",
                                }}
                            >
                                {teamData.firstBloodCount}
                            </span>
                            <span
                                style={{
                                    fontSize: "12px",
                                    color: "#737373",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                First Bloods
                            </span>
                        </div>

                        {/* Rank Box */}
                        <div
                            style={{
                                flex: 1,
                                background: "rgba(250, 204, 21, 0.1)",
                                border: "1px solid rgba(250, 204, 21, 0.2)",
                                borderRadius: "12px",
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "28px",
                                    fontWeight: 700,
                                    color: "#facc15",
                                }}
                            >
                                {teamData.isAdminTeam ? "—" : `#${teamData.rank || "—"}`}
                            </span>
                            <span
                                style={{
                                    fontSize: "12px",
                                    color: "#737373",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                {teamData.isAdminTeam ? "Admin" : "Rank"}
                            </span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 800,
                height: 450,
            }
        );
    } catch (error) {
        console.error("Error generating team card:", error);
        return new Response(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
    }
}
