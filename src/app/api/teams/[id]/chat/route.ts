import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Fetch team chat messages
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth();
        const { id: teamId } = await params;

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user and verify team membership
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, teamId: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Verify user is member of this team
        if (user.teamId !== teamId) {
            return NextResponse.json(
                { success: false, message: "You are not a member of this team" },
                { status: 403 }
            );
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const before = searchParams.get("before"); // For pagination

        // Fetch messages (no auto-delete for team messages)
        const messages = await prisma.teamChatMessage.findMany({
            where: {
                teamId,
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
                        isTeamLeader: true
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
                    isTeamLeader: m.user.isTeamLeader
                }
            }))
        });

    } catch (error) {
        console.error("Error fetching team chat messages:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

// POST: Send a new team message
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth();
        const { id: teamId } = await params;

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, teamId: true, isBanned: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Verify user is member of this team
        if (user.teamId !== teamId) {
            return NextResponse.json(
                { success: false, message: "You are not a member of this team" },
                { status: 403 }
            );
        }

        if (user.isBanned) {
            return NextResponse.json(
                { success: false, message: "You are banned" },
                { status: 403 }
            );
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

        // Create message (no rate limiting for team chat)
        const message = await prisma.teamChatMessage.create({
            data: {
                userId: user.id,
                teamId,
                content: trimmedContent
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        isTeamLeader: true
                    }
                }
            }
        });

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
                    isTeamLeader: message.user.isTeamLeader
                }
            }
        });

    } catch (error) {
        console.error("Error sending team message:", error);
        return NextResponse.json(
            { success: false, message: "Failed to send message" },
            { status: 500 }
        );
    }
}
