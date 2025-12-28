import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Check if user is admin
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

// GET - Fetch audit log with pagination
export async function GET(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const action = searchParams.get("action");
        const entityType = searchParams.get("entityType");

        const where: Record<string, unknown> = {};
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.auditLog.count({ where })
        ]);

        // Get unique actions and entity types for filters
        const [actions, entityTypes] = await Promise.all([
            prisma.auditLog.findMany({
                select: { action: true },
                distinct: ["action"]
            }),
            prisma.auditLog.findMany({
                select: { entityType: true },
                distinct: ["entityType"]
            })
        ]);

        return NextResponse.json({
            success: true,
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            filters: {
                actions: actions.map(a => a.action),
                entityTypes: entityTypes.map(e => e.entityType)
            }
        });
    } catch (error) {
        console.error("Error fetching audit log:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
