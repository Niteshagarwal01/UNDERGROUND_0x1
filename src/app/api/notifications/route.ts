import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET: Fetch user's notifications
export async function GET(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Get query params for pagination
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        // Fetch notifications
        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id,
                ...(unreadOnly ? { isRead: false } : {})
            },
            orderBy: { createdAt: "desc" },
            take: limit
        });

        // Get unread count
        const unreadCount = await prisma.notification.count({
            where: {
                userId: user.id,
                isRead: false
            }
        });

        return NextResponse.json({
            success: true,
            notifications,
            unreadCount
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// POST: Mark notifications as read
export async function POST(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { notificationIds, markAllRead } = body;

        if (markAllRead) {
            // Mark all notifications as read
            await prisma.notification.updateMany({
                where: {
                    userId: user.id,
                    isRead: false
                },
                data: { isRead: true }
            });
        } else if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: user.id
                },
                data: { isRead: true }
            });
        }

        return NextResponse.json({
            success: true,
            message: "Notifications marked as read"
        });

    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update notifications" },
            { status: 500 }
        );
    }
}
