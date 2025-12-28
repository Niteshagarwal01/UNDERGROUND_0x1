import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Check admin
async function checkAdmin() {
    const { userId } = await auth();
    if (!userId) {
        return { isAdmin: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!user) {
        return { isAdmin: false, error: "Forbidden" };
    }

    const isDirectAdmin = user.role === "ADMIN";
    const isModerator = user.role === "MODERATOR";

    if (!isDirectAdmin && !isModerator) {
        return { isAdmin: false, error: "Forbidden" };
    }

    return { isAdmin: true };
}

export async function GET() {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        // Get all certificates with team info
        const certificates = await prisma.certificate.findMany({
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        totalPoints: true,
                        solvedCount: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Get certificate stats
        const competitionCount = await prisma.certificate.count({
            where: { type: "COMPETITION" }
        });
        const firstBloodCount = await prisma.certificate.count({
            where: { type: "FIRST_BLOOD" }
        });

        return NextResponse.json({
            success: true,
            certificates: certificates.map(c => ({
                id: c.id,
                verificationId: c.verificationId,
                type: c.type,
                team: c.team,
                metadata: c.metadata,
                createdAt: c.createdAt
            })),
            stats: {
                total: certificates.length,
                competition: competitionCount,
                firstBlood: firstBloodCount
            }
        });
    } catch (error) {
        console.error("Admin certificates error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch certificates" },
            { status: 500 }
        );
    }
}
