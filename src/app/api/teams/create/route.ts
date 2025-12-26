import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name } = body;

        // Validate team name
        if (!name || name.length < 3 || name.length > 30) {
            return NextResponse.json(
                { success: false, message: "Team name must be 3-30 characters" },
                { status: 400 }
            );
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            return NextResponse.json(
                { success: false, message: "Only letters, numbers, underscores and hyphens allowed" },
                { status: 400 }
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

        if (user.teamId) {
            return NextResponse.json(
                { success: false, message: "You are already in a team" },
                { status: 400 }
            );
        }

        // Check if team name is taken
        const existingTeam = await prisma.team.findUnique({
            where: { name },
        });

        if (existingTeam) {
            return NextResponse.json(
                { success: false, message: "Team name is already taken" },
                { status: 400 }
            );
        }

        // Create team with transaction
        const result = await prisma.$transaction(async (tx) => {
            // Generate unique invite code
            let inviteCode: string;
            let isUnique = false;
            let attempts = 0;

            while (!isUnique && attempts < 10) {
                // Generate random invite code (12 characters)
                inviteCode = randomBytes(6).toString("hex").toUpperCase();

                const existing = await tx.team.findUnique({
                    where: { inviteCode },
                });

                if (!existing) {
                    isUnique = true;
                } else {
                    attempts++;
                    // Collision detected, retry
                }
            }

            if (!isUnique) {
                throw new Error("Failed to generate unique invite code");
            }

            // Create the team with explicit invite code
            const team = await tx.team.create({
                data: {
                    name,
                    inviteCode: inviteCode!,
                    members: { connect: { id: user.id } },
                },
            });

            // Update user to be team leader
            await tx.user.update({
                where: { id: user.id },
                data: { isTeamLeader: true },
            });

            return team;
        });

        // Team created successfully

        return NextResponse.json({
            success: true,
            message: "Team created successfully!",
            team: {
                id: result.id,
                name: result.name,
                inviteCode: result.inviteCode,
            },
        });
    } catch (error) {
        console.error("Error creating team:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create team. Database error." },
            { status: 500 }
        );
    }
}
