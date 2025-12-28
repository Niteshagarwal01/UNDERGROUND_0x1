import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Check if user is admin
async function checkAdmin() {
    const { userId } = await auth();
    if (!userId) {
        return { isAdmin: false, error: "Unauthorized", user: null };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!user) {
        return { isAdmin: false, error: "Forbidden", user: null };
    }

    const isDirectAdmin = user.role === "ADMIN";
    const isModerator = user.role === "MODERATOR";

    if (!isDirectAdmin && !isModerator) {
        return { isAdmin: false, error: "Forbidden", user: null };
    }

    return { isAdmin: true, user };
}

// Log admin actions
async function logAction(adminId: string, adminEmail: string, action: string, entityType: string, entityId?: string, details?: string) {
    try {
        await prisma.auditLog.create({
            data: {
                adminId,
                adminEmail,
                action,
                entityType,
                entityId,
                details,
            }
        });
    } catch (error) {
        console.error("Failed to log action:", error);
    }
}

// PATCH - Update announcement
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin || !adminCheck.user) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { title, content, isPinned } = body;

        const existing = await prisma.announcement.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Announcement not found" },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title.trim();
        if (content !== undefined) updateData.content = content.trim();
        if (typeof isPinned === "boolean") updateData.isPinned = isPinned;

        const announcement = await prisma.announcement.update({
            where: { id },
            data: updateData
        });

        // Log the action
        await logAction(
            adminCheck.user.id,
            adminCheck.user.email,
            "UPDATE_ANNOUNCEMENT",
            "Announcement",
            id,
            JSON.stringify({ before: existing, after: announcement })
        );

        return NextResponse.json({
            success: true,
            message: "Announcement updated successfully",
            announcement
        });
    } catch (error) {
        console.error("Error updating announcement:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete announcement
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin || !adminCheck.user) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { id } = await params;

        const existing = await prisma.announcement.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Announcement not found" },
                { status: 404 }
            );
        }

        await prisma.announcement.delete({
            where: { id }
        });

        // Log the action
        await logAction(
            adminCheck.user.id,
            adminCheck.user.email,
            "DELETE_ANNOUNCEMENT",
            "Announcement",
            id,
            JSON.stringify({ deleted: existing })
        );

        return NextResponse.json({
            success: true,
            message: "Announcement deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
