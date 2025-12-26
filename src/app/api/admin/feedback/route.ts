import { NextRequest, NextResponse } from "next/server";
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
        include: {
            team: {
                include: {
                    members: { select: { role: true } },
                },
            },
        },
    });

    if (!user) {
        return { isAdmin: false, error: "Forbidden" };
    }

    const isDirectAdmin = user.role === "ADMIN";
    const isModerator = user.role === "MODERATOR";
    const hasAdminInTeam = user.team?.members.some((m) => m.role === "ADMIN") || false;

    if (!isDirectAdmin && !isModerator && !hasAdminInTeam) {
        return { isAdmin: false, error: "Forbidden" };
    }

    return { isAdmin: true };
}

// GET - Get all feedback (admin only)
export async function GET(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status");

        const feedback = await prisma.feedback.findMany({
            where: status ? { status: status as "NEW" | "REVIEWED" | "RESOLVED" } : undefined,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const stats = {
            total: await prisma.feedback.count(),
            new: await prisma.feedback.count({ where: { status: "NEW" } }),
            reviewed: await prisma.feedback.count({ where: { status: "REVIEWED" } }),
            resolved: await prisma.feedback.count({ where: { status: "RESOLVED" } }),
            avgRating: await prisma.feedback.aggregate({ _avg: { rating: true } }),
        };

        return NextResponse.json({
            success: true,
            feedback,
            stats: {
                ...stats,
                avgRating: stats.avgRating._avg.rating?.toFixed(1) || "0.0",
            },
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch feedback" },
            { status: 500 }
        );
    }
}

// POST - Update feedback status or add response (admin only)
export async function POST(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const body = await request.json();
        const { feedbackId, status, adminResponse } = body;

        if (!feedbackId) {
            return NextResponse.json(
                { success: false, message: "Feedback ID required" },
                { status: 400 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};
        if (status && ["NEW", "REVIEWED", "RESOLVED"].includes(status)) {
            updateData.status = status;
        }
        if (adminResponse !== undefined) {
            updateData.adminResponse = adminResponse;
        }

        const updated = await prisma.feedback.update({
            where: { id: feedbackId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: "Feedback updated",
            feedback: updated,
        });
    } catch (error) {
        console.error("Error updating feedback:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update feedback" },
            { status: 500 }
        );
    }
}
