import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Admin endpoint to fix first blood status for a solve
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const admin = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true }
        });

        if (admin?.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });
        }

        const { teamId, challengeId, setFirstBlood } = await request.json();

        if (!teamId || !challengeId) {
            return NextResponse.json({ success: false, message: "teamId and challengeId required" }, { status: 400 });
        }

        // Find the solve record
        const solve = await prisma.solve.findUnique({
            where: {
                teamId_challengeId: { teamId, challengeId }
            }
        });

        if (!solve) {
            return NextResponse.json({ success: false, message: "Solve not found" }, { status: 404 });
        }

        // Update first blood status
        const updated = await prisma.solve.update({
            where: { id: solve.id },
            data: {
                isFirstBlood: setFirstBlood,
                firstBloodId: setFirstBlood ? challengeId : null
            }
        });

        return NextResponse.json({
            success: true,
            message: `First blood ${setFirstBlood ? "awarded" : "removed"}`,
            solve: updated
        });

    } catch (error) {
        console.error("Fix first blood error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

// Get list of solves that should be first blood but aren't
export async function GET() {
    try {
        // Find all challenges and their first solves
        const challenges = await prisma.challenge.findMany({
            where: { isActive: true },
            select: {
                id: true,
                title: true,
                solveCount: true,
                solves: {
                    orderBy: { solvedAt: "asc" },
                    take: 1,
                    include: {
                        team: { select: { id: true, name: true } }
                    }
                }
            }
        });

        const fixNeeded = [];

        for (const challenge of challenges) {
            if (challenge.solves.length > 0) {
                const firstSolve = challenge.solves[0];
                if (!firstSolve.isFirstBlood) {
                    fixNeeded.push({
                        challengeId: challenge.id,
                        challengeTitle: challenge.title,
                        teamId: firstSolve.teamId,
                        teamName: firstSolve.team.name,
                        solvedAt: firstSolve.solvedAt,
                        isFirstBlood: firstSolve.isFirstBlood
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            fixNeeded,
            count: fixNeeded.length
        });

    } catch (error) {
        console.error("Check first bloods error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
