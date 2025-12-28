import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin";

export async function GET() {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.authorized) {
            return NextResponse.json(
                { success: false, message: adminCheck.message },
                { status: 403 }
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
