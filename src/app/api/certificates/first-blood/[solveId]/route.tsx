import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// Use Node.js runtime (no size limit, unlike Edge which has 1MB limit)

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ solveId: string }> }
) {
    try {
        const { solveId } = await params;

        // Get the solve with first blood
        const solve = await prisma.solve.findFirst({
            where: {
                id: solveId,
                isFirstBlood: true
            },
            include: {
                team: true,
                challenge: {
                    include: { category: true }
                }
            }
        });

        if (!solve) {
            return new Response("First blood not found", { status: 404 });
        }

        const date = new Date(solve.solvedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

        return new ImageResponse(
            (
                <div
                    style={{
                        width: "600px",
                        height: "300px",
                        display: "flex",
                        flexDirection: "column",
                        background: "linear-gradient(135deg, #1a0505 0%, #0a0a0a 50%, #1a0505 100%)",
                        fontFamily: "system-ui, sans-serif",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Blood drip effect on top */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #ef4444, #dc2626, #ef4444)", display: "flex" }} />

                    {/* Border */}
                    <div style={{ position: "absolute", top: "8px", left: "8px", right: "8px", bottom: "8px", border: "2px solid rgba(239, 68, 68, 0.4)", borderRadius: "8px", display: "flex" }} />

                    {/* Content */}
                    <div style={{ display: "flex", flexDirection: "column", padding: "24px 32px", flex: 1 }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "14px", color: "#ef4444", fontWeight: 700, letterSpacing: "4px" }}>🩸 FIRST BLOOD</span>
                            <div style={{ flex: 1, height: "1px", background: "rgba(239, 68, 68, 0.3)", display: "flex" }} />
                        </div>

                        {/* Challenge Name */}
                        <div style={{ display: "flex", flexDirection: "column", marginTop: "20px" }}>
                            <span style={{ fontSize: "32px", fontWeight: 800, color: "#fff" }}>{solve.challenge.title}</span>
                            <span style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>{solve.challenge.category?.name || "Challenge"} • {solve.points} pts</span>
                        </div>

                        {/* Team */}
                        <div style={{ display: "flex", alignItems: "center", marginTop: "auto", gap: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "12px", color: "#666" }}>Claimed by</span>
                                <span style={{ fontSize: "20px", fontWeight: 700, color: "#facc15" }}>{solve.team.name}</span>
                            </div>
                            <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                <span style={{ fontSize: "12px", color: "#666" }}>{date}</span>
                                <span style={{ fontSize: "10px", color: "#444" }}>UNDERGROUND_0x1</span>
                            </div>
                        </div>
                    </div>

                    {/* Glow effect */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)", transform: "translate(-50%, -50%)", display: "flex" }} />
                </div>
            ),
            {
                width: 600,
                height: 300,
            }
        );
    } catch (error) {
        console.error("First blood badge error:", error);
        return new Response("Error generating badge", { status: 500 });
    }
}
