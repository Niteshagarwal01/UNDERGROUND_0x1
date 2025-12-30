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

    // ADMIN and MODERATOR roles get admin access
    // Team members get MODERATOR role when joining admin team
    const isDirectAdmin = user.role === "ADMIN";
    const isModerator = user.role === "MODERATOR";

    if (!isDirectAdmin && !isModerator) {
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
        const type = searchParams.get("type");
        const priority = searchParams.get("priority");
        const search = searchParams.get("search");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (status && ["NEW", "REVIEWED", "RESOLVED"].includes(status)) {
            where.status = status;
        }
        if (type && ["BUG", "FEATURE", "SUGGESTION", "GENERAL", "PRAISE"].includes(type)) {
            where.type = type;
        }
        if (priority && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority)) {
            where.priority = priority;
        }
        if (search) {
            where.OR = [
                { subject: { contains: search, mode: "insensitive" } },
                { message: { contains: search, mode: "insensitive" } },
            ];
        }

        // Build order by
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderBy: any = {};
        if (["createdAt", "rating", "status", "priority"].includes(sortBy)) {
            orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
        } else {
            orderBy.createdAt = "desc";
        }

        const feedback = await prisma.feedback.findMany({
            where,
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
            orderBy,
        });

        // Calculate statistics
        const [total, newCount, reviewedCount, resolvedCount, avgRatingResult] = await Promise.all([
            prisma.feedback.count(),
            prisma.feedback.count({ where: { status: "NEW" } }),
            prisma.feedback.count({ where: { status: "REVIEWED" } }),
            prisma.feedback.count({ where: { status: "RESOLVED" } }),
            prisma.feedback.aggregate({ _avg: { rating: true } }),
        ]);

        // Type distribution
        const [bugCount, featureCount, suggestionCount, generalCount, praiseCount] = await Promise.all([
            prisma.feedback.count({ where: { type: "BUG" } }),
            prisma.feedback.count({ where: { type: "FEATURE" } }),
            prisma.feedback.count({ where: { type: "SUGGESTION" } }),
            prisma.feedback.count({ where: { type: "GENERAL" } }),
            prisma.feedback.count({ where: { type: "PRAISE" } }),
        ]);

        // Priority distribution
        const [criticalCount, highCount, mediumCount, lowCount] = await Promise.all([
            prisma.feedback.count({ where: { priority: "CRITICAL" } }),
            prisma.feedback.count({ where: { priority: "HIGH" } }),
            prisma.feedback.count({ where: { priority: "MEDIUM" } }),
            prisma.feedback.count({ where: { priority: "LOW" } }),
        ]);

        // Response rate
        const respondedCount = await prisma.feedback.count({
            where: { adminResponse: { not: null } }
        });

        return NextResponse.json({
            success: true,
            feedback,
            stats: {
                total,
                new: newCount,
                reviewed: reviewedCount,
                resolved: resolvedCount,
                avgRating: avgRatingResult._avg.rating?.toFixed(1) || "0.0",
                responseRate: total > 0 ? ((respondedCount / total) * 100).toFixed(0) : "0",
                typeDistribution: {
                    bug: bugCount,
                    feature: featureCount,
                    suggestion: suggestionCount,
                    general: generalCount,
                    praise: praiseCount,
                },
                priorityDistribution: {
                    critical: criticalCount,
                    high: highCount,
                    medium: mediumCount,
                    low: lowCount,
                },
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
            updateData.adminResponse = adminResponse || null;
            // Track when admin responded
            if (adminResponse) {
                updateData.respondedAt = new Date();
            } else {
                updateData.respondedAt = null;
            }
        }

        const updated = await prisma.feedback.update({
            where: { id: feedbackId },
            data: updateData,
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

// DELETE - Delete feedback (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const feedbackId = searchParams.get("id");

        if (!feedbackId) {
            return NextResponse.json(
                { success: false, message: "Feedback ID required" },
                { status: 400 }
            );
        }

        await prisma.feedback.delete({
            where: { id: feedbackId },
        });

        return NextResponse.json({
            success: true,
            message: "Feedback deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting feedback:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete feedback" },
            { status: 500 }
        );
    }
}
