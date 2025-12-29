import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

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

        const time = new Date(solve.solvedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });

        return new ImageResponse(
            (
                <div
                    style={{
                        width: "700px",
                        height: "400px",
                        display: "flex",
                        flexDirection: "column",
                        background: "linear-gradient(180deg, #0c0c0c 0%, #1a0808 50%, #0c0c0c 100%)",
                        fontFamily: "system-ui, sans-serif",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Blood drip gradients on top */}
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "6px",
                        background: "linear-gradient(90deg, transparent 0%, #ef4444 20%, #dc2626 50%, #ef4444 80%, transparent 100%)",
                        display: "flex"
                    }} />

                    {/* Glowing orb effect */}
                    <div style={{
                        position: "absolute",
                        top: "40px",
                        left: "50%",
                        width: "300px",
                        height: "300px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 40%, transparent 70%)",
                        transform: "translateX(-50%)",
                        display: "flex"
                    }} />

                    {/* Grid pattern */}
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: "linear-gradient(rgba(239, 68, 68, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.03) 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                        display: "flex"
                    }} />

                    {/* Double border frame */}
                    <div style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        right: "12px",
                        bottom: "12px",
                        border: "2px solid rgba(239, 68, 68, 0.6)",
                        borderRadius: "12px",
                        display: "flex"
                    }} />
                    <div style={{
                        position: "absolute",
                        top: "20px",
                        left: "20px",
                        right: "20px",
                        bottom: "20px",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "8px",
                        display: "flex"
                    }} />

                    {/* Content */}
                    <div style={{ display: "flex", flexDirection: "column", padding: "40px 48px", flex: 1, zIndex: 1 }}>
                        {/* Header badge */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 24px",
                                background: "linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.2) 50%, transparent 100%)",
                                borderRadius: "24px"
                            }}>
                                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 10px #ef4444", display: "flex" }} />
                                <span style={{
                                    fontSize: "18px",
                                    color: "#ef4444",
                                    fontWeight: 800,
                                    letterSpacing: "6px",
                                    textTransform: "uppercase"
                                }}>FIRST BLOOD</span>
                                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 10px #ef4444", display: "flex" }} />
                            </div>
                        </div>

                        {/* Challenge Name */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "28px" }}>
                            <span style={{
                                fontSize: "40px",
                                fontWeight: 900,
                                color: "#fff",
                                textAlign: "center",
                                textShadow: "0 2px 20px rgba(239, 68, 68, 0.3)"
                            }}>{solve.challenge.title}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" }}>
                                <span style={{
                                    fontSize: "14px",
                                    color: "#888",
                                    padding: "4px 12px",
                                    background: "rgba(255,255,255,0.05)",
                                    borderRadius: "12px"
                                }}>{solve.challenge.category?.name || "Challenge"}</span>
                                <span style={{
                                    fontSize: "14px",
                                    color: "#facc15",
                                    padding: "4px 12px",
                                    background: "rgba(250, 204, 21, 0.1)",
                                    borderRadius: "12px",
                                    fontWeight: 700
                                }}>{solve.points} pts</span>
                            </div>
                        </div>

                        {/* Team and date */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "11px", color: "#555", letterSpacing: "2px", textTransform: "uppercase" }}>Claimed By</span>
                                <span style={{
                                    fontSize: "28px",
                                    fontWeight: 800,
                                    background: "linear-gradient(90deg, #facc15 0%, #fbbf24 100%)",
                                    backgroundClip: "text",
                                    color: "transparent",
                                    marginTop: "4px"
                                }}>{solve.team.name}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                <span style={{ fontSize: "14px", color: "#888" }}>{date}</span>
                                <span style={{ fontSize: "12px", color: "#555" }}>{time}</span>
                                <span style={{ fontSize: "10px", color: "#facc15", marginTop: "8px", letterSpacing: "2px" }}>UNDERGROUND_0x1</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 700,
                height: 400,
            }
        );
    } catch (error) {
        console.error("First blood badge error:", error);
        return new Response("Error generating badge", { status: 500 });
    }
}
