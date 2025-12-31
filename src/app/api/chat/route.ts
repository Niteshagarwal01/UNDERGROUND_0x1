import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Slow mode settings
const SLOW_MODE_THRESHOLD = 25; // Active users count to trigger slow mode
const SLOW_MODE_COOLDOWN = 10000; // 10 seconds between messages in slow mode
const NORMAL_COOLDOWN = 2000; // 2 seconds between messages normally
const MESSAGE_RETENTION_DAYS = 2; // Auto-delete messages older than this

// Track active users (in-memory for simplicity)
const activeUsers = new Map<string, number>(); // userId -> last activity timestamp
const ACTIVE_TIMEOUT = 60000; // User considered inactive after 1 minute

function getActiveUserCount(): number {
    const now = Date.now();
    // Clean up inactive users
    for (const [userId, lastActivity] of activeUsers.entries()) {
        if (now - lastActivity > ACTIVE_TIMEOUT) {
            activeUsers.delete(userId);
        }
    }
    return activeUsers.size;
}

function isSlowModeActive(): boolean {
    return getActiveUserCount() >= SLOW_MODE_THRESHOLD;
}

// GET: Fetch community chat messages
export async function GET(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user to mark as active
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

        // Mark user as active
        activeUsers.set(user.id, Date.now());

        // Get query params
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const before = searchParams.get("before"); // For pagination

        // Auto-delete old messages (2 days)
        const cutoffDate = new Date(Date.now() - MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        await prisma.chatMessage.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        });

        // Fetch messages
        const messages = await prisma.chatMessage.findMany({
            where: {
                isDeleted: false,
                ...(before ? { createdAt: { lt: new Date(before) } } : {})
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        role: true
                    }
                }
            }
        });

        // Reverse to show oldest first
        messages.reverse();

        return NextResponse.json({
            success: true,
            messages: messages.map(m => ({
                id: m.id,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
                user: {
                    id: m.user.id,
                    username: m.user.username,
                    avatarUrl: m.user.avatarUrl,
                    role: m.user.role
                }
            })),
            activeUsers: getActiveUserCount(),
            slowModeActive: isSlowModeActive(),
            slowModeCooldown: isSlowModeActive() ? SLOW_MODE_COOLDOWN : NORMAL_COOLDOWN
        });

    } catch (error) {
        console.error("Error fetching chat messages:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

// Store last message time per user
const lastMessageTime = new Map<string, number>();

// POST: Send a new message
export async function POST(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, isBanned: true, role: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        if (user.isBanned) {
            return NextResponse.json(
                { success: false, message: "You are banned from chat" },
                { status: 403 }
            );
        }

        // Rate limiting (except for admins)
        if (user.role === "USER") {
            const lastTime = lastMessageTime.get(user.id) || 0;
            const cooldown = isSlowModeActive() ? SLOW_MODE_COOLDOWN : NORMAL_COOLDOWN;
            const timeSinceLastMessage = Date.now() - lastTime;

            if (timeSinceLastMessage < cooldown) {
                const waitTime = Math.ceil((cooldown - timeSinceLastMessage) / 1000);
                return NextResponse.json(
                    {
                        success: false,
                        message: `Slow down! Wait ${waitTime} second(s) before sending another message.`,
                        slowModeActive: isSlowModeActive()
                    },
                    { status: 429 }
                );
            }
        }

        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { success: false, message: "Message content is required" },
                { status: 400 }
            );
        }

        const trimmedContent = content.trim();
        if (trimmedContent.length === 0) {
            return NextResponse.json(
                { success: false, message: "Message cannot be empty" },
                { status: 400 }
            );
        }

        if (trimmedContent.length > 500) {
            return NextResponse.json(
                { success: false, message: "Message too long (max 500 characters)" },
                { status: 400 }
            );
        }

        // Create message
        const message = await prisma.chatMessage.create({
            data: {
                userId: user.id,
                content: trimmedContent
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        role: true
                    }
                }
            }
        });

        // Update last message time
        lastMessageTime.set(user.id, Date.now());
        activeUsers.set(user.id, Date.now());

        return NextResponse.json({
            success: true,
            message: {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt.toISOString(),
                user: {
                    id: message.user.id,
                    username: message.user.username,
                    avatarUrl: message.user.avatarUrl,
                    role: message.user.role
                }
            }
        });

    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json(
            { success: false, message: "Failed to send message" },
            { status: 500 }
        );
    }
}

// DELETE: Delete a message (admin/moderator only)
export async function DELETE(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Only admins and moderators can delete messages
        if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
            return NextResponse.json(
                { success: false, message: "Not authorized to delete messages" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const messageId = searchParams.get("id");

        if (!messageId) {
            return NextResponse.json(
                { success: false, message: "Message ID is required" },
                { status: 400 }
            );
        }

        // Soft delete the message
        await prisma.chatMessage.update({
            where: { id: messageId },
            data: {
                isDeleted: true,
                deletedBy: user.id
            }
        });

        return NextResponse.json({
            success: true,
            message: "Message deleted"
        });

    } catch (error) {
        console.error("Error deleting message:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete message" },
            { status: 500 }
        );
    }
}
