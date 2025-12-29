import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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

        // Get rank suffix
        const getRankSuffix = (r: number) => {
            if (r % 100 >= 11 && r % 100 <= 13) return "th";
            switch (r % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
            }
        };

        return new ImageResponse(
            (
                <div
                    style={{
                        width: "1200px",
                        height: "850px",
                        display: "flex",
                        flexDirection: "column",
                        background: "linear-gradient(180deg, #0c0c0c 0%, #151515 40%, #0c0c0c 100%)",
                        fontFamily: "system-ui, sans-serif",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Animated background grid pattern */}
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: "linear-gradient(rgba(250, 204, 21, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 204, 21, 0.03) 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                        display: "flex"
                    }} />

                    {/* Glowing orbs */}
                    <div style={{
                        position: "absolute",
                        top: "100px",
                        left: "100px",
                        width: "300px",
                        height: "300px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(250, 204, 21, 0.08) 0%, transparent 70%)",
                        display: "flex"
                    }} />
                    <div style={{
                        position: "absolute",
                        bottom: "100px",
                        right: "100px",
                        width: "400px",
                        height: "400px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(239, 68, 68, 0.06) 0%, transparent 70%)",
                        display: "flex"
                    }} />

                    {/* Main border frame with double line */}
                    <div style={{
                        position: "absolute",
                        top: "24px",
                        left: "24px",
                        right: "24px",
                        bottom: "24px",
                        border: "2px solid rgba(250, 204, 21, 0.6)",
                        borderRadius: "16px",
                        display: "flex",
                    }} />
                    <div style={{
                        position: "absolute",
                        top: "32px",
                        left: "32px",
                        right: "32px",
                        bottom: "32px",
                        border: "1px solid rgba(250, 204, 21, 0.3)",
                        borderRadius: "12px",
                        display: "flex",
                    }} />

                    {/* Corner ornaments - top left */}
                    <div style={{ position: "absolute", top: "40px", left: "40px", display: "flex", flexDirection: "column" }}>
                        <div style={{ width: "80px", height: "3px", background: "linear-gradient(90deg, #facc15 0%, transparent 100%)", display: "flex" }} />
                        <div style={{ width: "3px", height: "80px", background: "linear-gradient(180deg, #facc15 0%, transparent 100%)", display: "flex" }} />
                    </div>
                    {/* Corner ornaments - top right */}
                    <div style={{ position: "absolute", top: "40px", right: "40px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{ width: "80px", height: "3px", background: "linear-gradient(270deg, #facc15 0%, transparent 100%)", display: "flex" }} />
                        <div style={{ width: "3px", height: "80px", background: "linear-gradient(180deg, #facc15 0%, transparent 100%)", marginLeft: "auto", display: "flex" }} />
                    </div>
                    {/* Corner ornaments - bottom left */}
                    <div style={{ position: "absolute", bottom: "40px", left: "40px", display: "flex", flexDirection: "column" }}>
                        <div style={{ width: "3px", height: "80px", background: "linear-gradient(0deg, #facc15 0%, transparent 100%)", display: "flex" }} />
                        <div style={{ width: "80px", height: "3px", background: "linear-gradient(90deg, #facc15 0%, transparent 100%)", display: "flex" }} />
                    </div>
                    {/* Corner ornaments - bottom right */}
                    <div style={{ position: "absolute", bottom: "40px", right: "40px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{ width: "3px", height: "80px", background: "linear-gradient(0deg, #facc15 0%, transparent 100%)", marginLeft: "auto", display: "flex" }} />
                        <div style={{ width: "80px", height: "3px", background: "linear-gradient(270deg, #facc15 0%, transparent 100%)", display: "flex" }} />
                    </div>

                    {/* Header section */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "70px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                            <div style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, transparent 0%, #facc15 100%)", display: "flex" }} />
                            <span style={{ fontSize: "14px", color: "#facc15", letterSpacing: "6px", fontWeight: 500, textTransform: "uppercase" }}>Certificate of Achievement</span>
                            <div style={{ width: "60px", height: "1px", background: "linear-gradient(270deg, transparent 0%, #facc15 100%)", display: "flex" }} />
                        </div>
                        <span style={{
                            fontSize: "64px",
                            fontWeight: 900,
                            background: "linear-gradient(180deg, #facc15 0%, #ca9a04 100%)",
                            backgroundClip: "text",
                            color: "transparent",
                            letterSpacing: "-2px"
                        }}>UNDERGROUND_0x1</span>
                        <span style={{ fontSize: "18px", color: "#666", marginTop: "8px", letterSpacing: "4px" }}>CAPTURE THE FLAG COMPETITION</span>
                    </div>

                    {/* Team Name with decorative line */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "48px" }}>
                        <span style={{ fontSize: "14px", color: "#555", letterSpacing: "3px", textTransform: "uppercase" }}>This is to certify that</span>
                        <div style={{
                            marginTop: "16px",
                            padding: "16px 48px",
                            background: "linear-gradient(90deg, transparent 0%, rgba(250, 204, 21, 0.1) 50%, transparent 100%)",
                            borderRadius: "8px",
                            display: "flex"
                        }}>
                            <span style={{ fontSize: "52px", fontWeight: 800, color: "#fff", textShadow: "0 2px 20px rgba(250, 204, 21, 0.3)" }}>{team.name}</span>
                        </div>
                        <span style={{ fontSize: "14px", color: "#555", marginTop: "12px" }}>has successfully participated and competed</span>
                    </div>

                    {/* Stats Grid - Premium cards */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "48px" }}>
                        {/* Rank Card */}
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "28px 48px",
                            background: "linear-gradient(180deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.05) 100%)",
                            borderRadius: "16px",
                            border: "1px solid rgba(250, 204, 21, 0.4)",
                            boxShadow: "0 8px 32px rgba(250, 204, 21, 0.1)"
                        }}>
                            <span style={{ fontSize: "14px", color: "#888", marginBottom: "8px", letterSpacing: "2px" }}>RANK</span>
                            <div style={{ display: "flex", alignItems: "baseline" }}>
                                <span style={{ fontSize: "56px", fontWeight: 900, color: "#facc15" }}>{rank}</span>
                                <span style={{ fontSize: "24px", color: "#facc15", marginLeft: "2px" }}>{getRankSuffix(rank)}</span>
                            </div>
                            <span style={{ fontSize: "12px", color: "#666" }}>of {totalTeams} teams</span>
                        </div>
                        {/* Points Card */}
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "28px 48px",
                            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
                            borderRadius: "16px",
                            border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}>
                            <span style={{ fontSize: "14px", color: "#888", marginBottom: "8px", letterSpacing: "2px" }}>POINTS</span>
                            <span style={{ fontSize: "56px", fontWeight: 900, color: "#fff" }}>{team.totalPoints}</span>
                            <span style={{ fontSize: "12px", color: "#666" }}>total earned</span>
                        </div>
                        {/* Challenges Card */}
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "28px 48px",
                            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
                            borderRadius: "16px",
                            border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}>
                            <span style={{ fontSize: "14px", color: "#888", marginBottom: "8px", letterSpacing: "2px" }}>SOLVED</span>
                            <span style={{ fontSize: "56px", fontWeight: 900, color: "#fff" }}>{team.solvedCount}</span>
                            <span style={{ fontSize: "12px", color: "#666" }}>challenges</span>
                        </div>
                        {/* First Bloods Card */}
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "28px 48px",
                            background: "linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)",
                            borderRadius: "16px",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            boxShadow: "0 8px 32px rgba(239, 68, 68, 0.1)"
                        }}>
                            <span style={{ fontSize: "14px", color: "#888", marginBottom: "8px", letterSpacing: "2px" }}>FIRST BLOOD</span>
                            <span style={{ fontSize: "56px", fontWeight: 900, color: "#ef4444" }}>{firstBloods}</span>
                            <span style={{ fontSize: "12px", color: "#666" }}>achieved</span>
                        </div>
                    </div>

                    {/* Category badges */}
                    {Object.keys(categoryStats).length > 0 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "32px" }}>
                            {Object.entries(categoryStats).slice(0, 6).map(([name, stats]) => (
                                <div key={name} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 16px",
                                    background: "rgba(255,255,255,0.05)",
                                    borderRadius: "20px",
                                    border: "1px solid rgba(255,255,255,0.1)"
                                }}>
                                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#facc15" }}>{stats.solved}</span>
                                    <span style={{ fontSize: "12px", color: "#888" }}>{name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        padding: "0 80px",
                        marginTop: "auto",
                        marginBottom: "56px"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "11px", color: "#555", letterSpacing: "1px" }}>ISSUED ON</span>
                            <span style={{ fontSize: "14px", color: "#888", marginTop: "4px" }}>{date}</span>
                            <span style={{ fontSize: "10px", color: "#444", marginTop: "8px" }}>Verify: {verifyUrl}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: "120px", height: "1px", background: "#444", marginBottom: "8px", display: "flex" }} />
                            <span style={{ fontSize: "12px", color: "#666" }}>Event Organizer</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <span style={{ fontSize: "11px", color: "#555", letterSpacing: "1px" }}>CERTIFICATE ID</span>
                            <span style={{ fontSize: "14px", color: "#facc15", marginTop: "4px", fontFamily: "monospace" }}>{certificate.verificationId.slice(0, 16).toUpperCase()}</span>
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
