import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Tier configuration
const TIERS = {
    champion: { rank: 1, title: "CHAMPION", color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" },
    runner_up: { rank: 2, title: "RUNNER UP", color: "#C0C0C0", gradient: "linear-gradient(135deg, #C0C0C0 0%, #808080 100%)" },
    third_place: { rank: 3, title: "THIRD PLACE", color: "#CD7F32", gradient: "linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)" },
    top10: { maxRank: 10, title: "TOP 10", color: "#8B5CF6", gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" },
    top25: { maxRank: 25, title: "TOP 25", color: "#06B6D4", gradient: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)" },
    top50: { maxRank: 50, title: "TOP 50", color: "#10B981", gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)" },
};

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            include: { team: true }
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

        // Determine tier
        let tier: { title: string; color: string; gradient: string } | null = null;

        if (rank === 1) tier = TIERS.champion;
        else if (rank === 2) tier = TIERS.runner_up;
        else if (rank === 3) tier = TIERS.third_place;
        else if (rank <= 10) tier = TIERS.top10;
        else if (rank <= 25) tier = TIERS.top25;
        else if (rank <= 50) tier = TIERS.top50;

        if (!tier) {
            return new Response("Not eligible for achievement certificate. Must be in top 50.", { status: 403 });
        }

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
                    {/* Background patterns */}
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `linear-gradient(${tier.color}10 1px, transparent 1px), linear-gradient(90deg, ${tier.color}10 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                        display: "flex"
                    }} />

                    {/* Glowing orb */}
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "600px",
                        height: "600px",
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${tier.color}15 0%, transparent 60%)`,
                        transform: "translate(-50%, -50%)",
                        display: "flex"
                    }} />

                    {/* Border frame */}
                    <div style={{
                        position: "absolute",
                        top: "24px",
                        left: "24px",
                        right: "24px",
                        bottom: "24px",
                        border: `3px solid ${tier.color}80`,
                        borderRadius: "16px",
                        display: "flex",
                    }} />

                    {/* Inner border */}
                    <div style={{
                        position: "absolute",
                        top: "36px",
                        left: "36px",
                        right: "36px",
                        bottom: "36px",
                        border: `1px solid ${tier.color}40`,
                        borderRadius: "12px",
                        display: "flex",
                    }} />

                    {/* Header - Achievement type */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "80px" }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            marginBottom: "24px"
                        }}>
                            <div style={{ width: "80px", height: "2px", background: `linear-gradient(90deg, transparent 0%, ${tier.color} 100%)`, display: "flex" }} />
                            <span style={{
                                fontSize: "16px",
                                color: tier.color,
                                letterSpacing: "8px",
                                fontWeight: 700
                            }}>CERTIFICATE OF ACHIEVEMENT</span>
                            <div style={{ width: "80px", height: "2px", background: `linear-gradient(270deg, transparent 0%, ${tier.color} 100%)`, display: "flex" }} />
                        </div>

                        {/* Tier badge */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "20px 48px",
                            background: tier.gradient,
                            borderRadius: "12px",
                            boxShadow: `0 8px 32px ${tier.color}40`
                        }}>
                            <span style={{ fontSize: "42px", fontWeight: 900, color: "#000", letterSpacing: "4px" }}>{tier.title}</span>
                        </div>

                        <span style={{ fontSize: "20px", color: "#666", marginTop: "20px", letterSpacing: "6px" }}>UNDERGROUND_0x1 CTF</span>
                    </div>

                    {/* Team Name */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "56px" }}>
                        <span style={{ fontSize: "14px", color: "#555", letterSpacing: "4px", textTransform: "uppercase" }}>Awarded To</span>
                        <span style={{
                            fontSize: "56px",
                            fontWeight: 900,
                            color: "#fff",
                            marginTop: "16px",
                            textShadow: `0 4px 24px ${tier.color}40`
                        }}>{team.name}</span>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "48px", marginTop: "56px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", color: "#666", letterSpacing: "2px", marginBottom: "8px" }}>FINAL RANK</span>
                            <div style={{ display: "flex", alignItems: "baseline" }}>
                                <span style={{ fontSize: "64px", fontWeight: 900, color: tier.color }}>{rank}</span>
                                <span style={{ fontSize: "28px", color: tier.color }}>{getRankSuffix(rank)}</span>
                            </div>
                            <span style={{ fontSize: "13px", color: "#555" }}>of {totalTeams} teams</span>
                        </div>
                        <div style={{ width: "1px", height: "100px", background: "#333", display: "flex" }} />
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", color: "#666", letterSpacing: "2px", marginBottom: "8px" }}>TOTAL POINTS</span>
                            <span style={{ fontSize: "64px", fontWeight: 900, color: "#fff" }}>{team.totalPoints}</span>
                            <span style={{ fontSize: "13px", color: "#555" }}>earned</span>
                        </div>
                        <div style={{ width: "1px", height: "100px", background: "#333", display: "flex" }} />
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", color: "#666", letterSpacing: "2px", marginBottom: "8px" }}>CHALLENGES</span>
                            <span style={{ fontSize: "64px", fontWeight: 900, color: "#fff" }}>{team.solvedCount}</span>
                            <span style={{ fontSize: "13px", color: "#555" }}>solved</span>
                        </div>
                    </div>

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
                            <span style={{ fontSize: "11px", color: "#555", letterSpacing: "1px" }}>DATE ISSUED</span>
                            <span style={{ fontSize: "14px", color: "#888", marginTop: "4px" }}>{date}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: "150px", height: "1px", background: "#444", marginBottom: "8px", display: "flex" }} />
                            <span style={{ fontSize: "12px", color: "#666" }}>Competition Director</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <span style={{ fontSize: "11px", color: "#555", letterSpacing: "1px" }}>VERIFICATION</span>
                            <span style={{
                                fontSize: "14px",
                                color: tier.color,
                                marginTop: "4px",
                                fontFamily: "monospace",
                                letterSpacing: "1px"
                            }}>UG0X1-{rank.toString().padStart(3, "0")}-{team.id.slice(0, 8).toUpperCase()}</span>
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
        console.error("Achievement certificate error:", error);
        return new Response("Error generating certificate", { status: 500 });
    }
}
