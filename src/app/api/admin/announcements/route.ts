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

// GET - Fetch all announcements
export async function GET() {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const announcements = await prisma.announcement.findMany({
            orderBy: [
                { isPinned: "desc" },
                { createdAt: "desc" }
            ]
        });

        return NextResponse.json({
            success: true,
            announcements
        });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create new announcement
export async function POST(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin || !adminCheck.user) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const body = await request.json();
        const { title, content, isPinned = false, notifyUsers = false } = body;

        if (!title || !content) {
            return NextResponse.json(
                { success: false, message: "Title and content are required" },
                { status: 400 }
            );
        }

        const announcement = await prisma.announcement.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                isPinned
            }
        });

        // Send notifications to all users if requested
        if (notifyUsers) {
            const allUsers = await prisma.user.findMany({
                select: { id: true }
            });

            // Create notifications for all users
            await prisma.notification.createMany({
                data: allUsers.map(user => ({
                    userId: user.id,
                    type: "ANNOUNCEMENT",
                    title: `📢 ${title}`,
                    message: content.length > 100 ? content.substring(0, 100) + "..." : content,
                    link: null
                }))
            });
        }

        // Log the action
        await logAction(
            adminCheck.user.id,
            adminCheck.user.email,
            "CREATE_ANNOUNCEMENT",
            "Announcement",
            announcement.id,
            JSON.stringify({ title, isPinned, notifyUsers })
        );

        return NextResponse.json({
            success: true,
            message: notifyUsers
                ? "Announcement created and notifications sent"
                : "Announcement created successfully",
            announcement
        });
    } catch (error) {
        console.error("Error creating announcement:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
