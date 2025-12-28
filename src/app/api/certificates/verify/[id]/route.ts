import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const certificate = await prisma.certificate.findUnique({
            where: { verificationId: id },
            include: {
                team: {
                    select: {
                        name: true,
                        totalPoints: true,
                        solvedCount: true
                    }
                }
            }
        });

        if (!certificate) {
            return NextResponse.json(
                { success: false, message: "Certificate not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            certificate: {
                id: certificate.id,
                verificationId: certificate.verificationId,
                type: certificate.type,
                team: certificate.team,
                metadata: certificate.metadata,
                issuedAt: certificate.createdAt
            }
        });
    } catch (error) {
        console.error("Certificate verification error:", error);
        return NextResponse.json(
            { success: false, message: "Error verifying certificate" },
            { status: 500 }
        );
    }
}
