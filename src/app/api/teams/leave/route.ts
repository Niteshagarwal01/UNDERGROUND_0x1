import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user from database with team info
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                team: {
                    include: {
                        members: {
                            select: {
                                role: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found. Please refresh the page." },
                { status: 404 }
            );
        }

        if (!user.teamId) {
            return NextResponse.json(
                { success: false, message: "You are not in a team" },
                { status: 400 }
            );
        }

        const mainAdminEmail = process.env.ADMIN_EMAIL;
        const wasInAdminTeam = user.team?.members.some(
            (member) => member.email === mainAdminEmail && member.role === "ADMIN"
        ) || false;

        // Store old role for logging
        const oldRole = user.role;

        // Determine new role: if user was MODERATOR in admin team, demote to USER
        // Don't demote if user is ADMIN (main admin) or already USER
        let newRole = user.role;
        if (wasInAdminTeam && user.role === "MODERATOR" && user.email !== mainAdminEmail) {
            newRole = "USER";
        }

        // Leave team using transaction
        await prisma.$transaction(async (tx) => {
            // If user is team leader, we need to handle team deletion or transfer
            if (user.isTeamLeader) {
                const teamMemberCount = await tx.user.count({
                    where: { teamId: user.teamId },
                });

                // If only one member (the leader), delete the team
                if (teamMemberCount === 1) {
                    await tx.team.delete({
                        where: { id: user.teamId! },
                    });
                } else {
                    // Transfer leadership to another member
                    const newLeader = await tx.user.findFirst({
                        where: {
                            teamId: user.teamId,
                            id: { not: user.id },
                        },
                    });

                    if (newLeader) {
                        await tx.user.update({
                            where: { id: newLeader.id },
                            data: { isTeamLeader: true },
                        });
                    }
                }
            }

            // Remove user from team and update role
            await tx.user.update({
                where: { id: user.id },
                data: {
                    teamId: null,
                    isTeamLeader: false,
                    role: newRole,
                },
            });
        });

        // User left team successfully

        return NextResponse.json({
            success: true,
            message: `Left team "${user.team?.name}" successfully`,
        });
    } catch (error) {
        console.error("Error leaving team:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, message: `Failed to leave team: ${errorMessage}` },
            { status: 500 }
        );
    }
}

