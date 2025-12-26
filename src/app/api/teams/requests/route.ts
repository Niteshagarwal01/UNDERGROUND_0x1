import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "musicniteshagarwal@gmail.com";

// GET: List pending requests for team leader
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || !user.teamId || !user.isTeamLeader) {
            return NextResponse.json(
                { success: false, message: "You must be a team leader to view requests" },
                { status: 403 }
            );
        }

        // Get pending requests for user's team
        const requests = await prisma.joinRequest.findMany({
            where: {
                teamId: user.teamId,
                status: "PENDING",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        avatarUrl: true,
                        totalPoints: true,
                        solvedCount: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            requests: requests.map((r: { id: string; user: any; createdAt: Date }) => ({
                id: r.id,
                user: r.user,
                createdAt: r.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error("Error fetching join requests:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch requests" },
            { status: 500 }
        );
    }
}

// POST: Accept or decline a request
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                team: {
                    include: {
                        _count: { select: { members: true } },
                        members: { select: { role: true, email: true } },
                    },
                },
            },
        });

        if (!user || !user.teamId || !user.isTeamLeader) {
            return NextResponse.json(
                { success: false, message: "You must be a team leader to manage requests" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { requestId, action } = body;

        if (!requestId || !["accept", "decline"].includes(action)) {
            return NextResponse.json(
                { success: false, message: "Invalid request" },
                { status: 400 }
            );
        }

        // Find the join request
        const joinRequest = await prisma.joinRequest.findUnique({
            where: { id: requestId },
            include: { user: true },
        });

        if (!joinRequest || joinRequest.teamId !== user.teamId) {
            return NextResponse.json(
                { success: false, message: "Request not found" },
                { status: 404 }
            );
        }

        if (joinRequest.status !== "PENDING") {
            return NextResponse.json(
                { success: false, message: "Request already processed" },
                { status: 400 }
            );
        }

        if (action === "decline") {
            await prisma.joinRequest.update({
                where: { id: requestId },
                data: { status: "DECLINED" },
            });

            return NextResponse.json({
                success: true,
                message: `Declined request from ${joinRequest.user.username}`,
            });
        }

        // Accept: Check team size first
        if (user.team!._count.members >= 4) {
            return NextResponse.json(
                { success: false, message: "Team is full (max 4 members)" },
                { status: 400 }
            );
        }

        // Check if the requesting user is already in a team now
        const requestingUser = await prisma.user.findUnique({
            where: { id: joinRequest.userId },
        });

        if (requestingUser?.teamId) {
            await prisma.joinRequest.update({
                where: { id: requestId },
                data: { status: "DECLINED" },
            });
            return NextResponse.json(
                { success: false, message: "User has already joined another team" },
                { status: 400 }
            );
        }

        // Determine role for new member
        const hasAdminInTeam = user.team?.members.some(
            (m) => m.email === ADMIN_EMAIL && m.role === "ADMIN"
        );
        const newRole = hasAdminInTeam && joinRequest.user.email !== ADMIN_EMAIL && joinRequest.user.role !== "ADMIN"
            ? "MODERATOR"
            : joinRequest.user.role;

        // Accept the request using transaction
        await prisma.$transaction([
            prisma.joinRequest.update({
                where: { id: requestId },
                data: { status: "ACCEPTED" },
            }),
            prisma.user.update({
                where: { id: joinRequest.userId },
                data: {
                    teamId: user.teamId,
                    role: newRole,
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: `${joinRequest.user.username} has joined your team!`,
        });
    } catch (error) {
        console.error("Error processing join request:", error);
        return NextResponse.json(
            { success: false, message: "Failed to process request" },
            { status: 500 }
        );
    }
}
