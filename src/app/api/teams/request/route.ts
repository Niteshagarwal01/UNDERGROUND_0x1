import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const MAX_TEAM_SIZE = 4;

const joinRequestSchema = z.object({
    inviteCode: z.string().min(1, "Invite code is required"),
});

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found. Please refresh the page." },
                { status: 404 }
            );
        }

        // Check if user is already in a team
        if (user.teamId) {
            return NextResponse.json(
                { success: false, message: "You are already in a team. Leave your current team first." },
                { status: 400 }
            );
        }

        // Parse request
        const body = await request.json();
        const validation = joinRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { inviteCode } = validation.data;
        const normalizedCode = inviteCode.trim().toUpperCase();

        // Find team by invite code
        const team = await prisma.team.findUnique({
            where: { inviteCode: normalizedCode },
            include: {
                _count: { select: { members: true } },
            },
        });

        if (!team) {
            return NextResponse.json(
                { success: false, message: "Invalid invite code. Please check the code and try again." },
                { status: 404 }
            );
        }

        // Check team size
        if (team._count.members >= MAX_TEAM_SIZE) {
            return NextResponse.json(
                { success: false, message: `Team is full (max ${MAX_TEAM_SIZE} members)` },
                { status: 400 }
            );
        }

        // Check if user already has a pending request for this team
        const existingRequest = await prisma.joinRequest.findUnique({
            where: {
                userId_teamId: {
                    userId: user.id,
                    teamId: team.id,
                },
            },
        });

        if (existingRequest) {
            if (existingRequest.status === "PENDING") {
                return NextResponse.json(
                    { success: false, message: "You already have a pending request for this team." },
                    { status: 400 }
                );
            } else if (existingRequest.status === "DECLINED") {
                // Allow re-requesting after being declined
                await prisma.joinRequest.update({
                    where: { id: existingRequest.id },
                    data: { status: "PENDING", updatedAt: new Date() },
                });

                return NextResponse.json({
                    success: true,
                    message: `Join request re-submitted to team "${team.name}". Waiting for leader approval.`,
                });
            }
        }

        // Create join request
        await prisma.joinRequest.create({
            data: {
                userId: user.id,
                teamId: team.id,
                status: "PENDING",
            },
        });

        return NextResponse.json({
            success: true,
            message: `Join request sent to team "${team.name}". Waiting for leader approval.`,
            team: {
                id: team.id,
                name: team.name,
            },
        });
    } catch (error) {
        console.error("Error creating join request:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, message: `Failed to submit join request: ${errorMessage}` },
            { status: 500 }
        );
    }
}
