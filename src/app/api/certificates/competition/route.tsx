import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Get team data
        const user = await prisma.user.findUnique({
            where: { clerkId },
            include: {
                team: {
                    include: {
                        solves: {
                            include: {
                                challenge: {
                                    include: { category: true }
                                }
                            }
                        },
                        members: true
                    }
                }
            }
        });

        if (!user?.team) {
            return new Response("No team found", { status: 404 });
        }

        const team = user.team;

        // Calculate rank
        const higherRankedTeams = await prisma.team.count({
            where: { totalPoints: { gt: team.totalPoints } }
        });
        const rank = higherRankedTeams + 1;
        const totalTeams = await prisma.team.count();

        // Calculate category breakdown
        const categoryStats: Record<string, { solved: number; points: number }> = {};
        for (const solve of team.solves) {
            const catName = solve.challenge.category?.name || "Other";
            if (!categoryStats[catName]) {
                categoryStats[catName] = { solved: 0, points: 0 };
            }
            categoryStats[catName].solved++;
            categoryStats[catName].points += solve.points;
        }

        // First bloods count
        const firstBloods = team.solves.filter(s => s.isFirstBlood).length;

        // Generate or find existing certificate
        let certificate = await prisma.certificate.findFirst({
            where: { teamId: team.id, type: "COMPETITION" }
        });

        if (!certificate) {
            certificate = await prisma.certificate.create({
                data: {
                    teamId: team.id,
                    type: "COMPETITION",
                    metadata: {
                        rank,
                        totalPoints: team.totalPoints,
                        solvedCount: team.solvedCount,
                        firstBloods,
                        generatedAt: new Date().toISOString()
                    }
                }
            });
        }

        const verifyUrl = `${request.nextUrl.origin}/verify/${certificate.verificationId}`;
        const date = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        return new ImageResponse(
            (
                <div
                    style={{
                        width: "1200px",
                        height: "850px",
                        display: "flex",
                        flexDirection: "column",
                        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
                        fontFamily: "system-ui, sans-serif",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Border frame */}
                    <div
                        style={{
                            position: "absolute",
                            top: "20px",
                            left: "20px",
                            right: "20px",
                            bottom: "20px",
                            border: "3px solid #facc15",
                            borderRadius: "12px",
                            display: "flex",
                        }}
                    />

                    {/* Corner decorations */}
                    <div style={{ position: "absolute", top: "30px", left: "30px", width: "60px", height: "60px", borderTop: "4px solid #facc15", borderLeft: "4px solid #facc15", display: "flex" }} />
                    <div style={{ position: "absolute", top: "30px", right: "30px", width: "60px", height: "60px", borderTop: "4px solid #facc15", borderRight: "4px solid #facc15", display: "flex" }} />
                    <div style={{ position: "absolute", bottom: "30px", left: "30px", width: "60px", height: "60px", borderBottom: "4px solid #facc15", borderLeft: "4px solid #facc15", display: "flex" }} />
                    <div style={{ position: "absolute", bottom: "30px", right: "30px", width: "60px", height: "60px", borderBottom: "4px solid #facc15", borderRight: "4px solid #facc15", display: "flex" }} />

                    {/* Header */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "60px" }}>
                        <span style={{ fontSize: "18px", color: "#facc15", letterSpacing: "8px", fontWeight: 600 }}>CERTIFICATE OF PARTICIPATION</span>
                        <span style={{ fontSize: "56px", fontWeight: 800, color: "#facc15", marginTop: "16px" }}>UNDERGROUND_0x1</span>
                        <span style={{ fontSize: "20px", color: "#888", marginTop: "8px" }}>Capture The Flag Competition</span>
                    </div>

                    {/* Team Name */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "40px" }}>
                        <span style={{ fontSize: "16px", color: "#666" }}>This certifies that</span>
                        <span style={{ fontSize: "42px", fontWeight: 700, color: "#fff", marginTop: "12px" }}>{team.name}</span>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "40px", marginTop: "50px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px", background: "rgba(250, 204, 21, 0.1)", borderRadius: "12px", border: "1px solid rgba(250, 204, 21, 0.3)" }}>
                            <span style={{ fontSize: "48px", fontWeight: 800, color: "#facc15" }}>#{rank}</span>
                            <span style={{ fontSize: "14px", color: "#888" }}>of {totalTeams} teams</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px", background: "rgba(250, 204, 21, 0.1)", borderRadius: "12px", border: "1px solid rgba(250, 204, 21, 0.3)" }}>
                            <span style={{ fontSize: "48px", fontWeight: 800, color: "#facc15" }}>{team.totalPoints}</span>
                            <span style={{ fontSize: "14px", color: "#888" }}>Total Points</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px", background: "rgba(250, 204, 21, 0.1)", borderRadius: "12px", border: "1px solid rgba(250, 204, 21, 0.3)" }}>
                            <span style={{ fontSize: "48px", fontWeight: 800, color: "#facc15" }}>{team.solvedCount}</span>
                            <span style={{ fontSize: "14px", color: "#888" }}>Challenges Solved</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                            <span style={{ fontSize: "48px", fontWeight: 800, color: "#ef4444" }}>{firstBloods}</span>
                            <span style={{ fontSize: "14px", color: "#888" }}>First Bloods</span>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "40px" }}>
                        {Object.entries(categoryStats).slice(0, 5).map(([name, stats]) => (
                            <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 20px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                                <span style={{ fontSize: "20px", fontWeight: 700, color: "#facc15" }}>{stats.solved}</span>
                                <span style={{ fontSize: "12px", color: "#666" }}>{name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 80px", marginTop: "auto", marginBottom: "50px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "12px", color: "#666" }}>Issued: {date}</span>
                            <span style={{ fontSize: "10px", color: "#444", marginTop: "4px" }}>Verify: {verifyUrl}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <span style={{ fontSize: "14px", color: "#888" }}>UNDERGROUND_0x1 CTF</span>
                            <span style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>ID: {certificate.verificationId.slice(0, 12)}</span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 850,
            }
        );
    } catch (error) {
        console.error("Certificate generation error:", error);
        return new Response("Error generating certificate", { status: 500 });
    }
}
