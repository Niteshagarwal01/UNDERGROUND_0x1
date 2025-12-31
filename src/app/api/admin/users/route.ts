import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/security";

export const dynamic = "force-dynamic";

// Check if user is admin (ADMIN role only can change roles)
async function checkIsAdmin(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return { isAdmin: false, error: "Unauthorized", adminId: null };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!user || user.role !== "ADMIN") {
        return { isAdmin: false, error: "Forbidden - Admin role required", adminId: null };
    }

    return { isAdmin: true, adminId: user.id };
}

// GET - Fetch all users
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if user has admin or moderator role
        const currentUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const users = await prisma.user.findMany({
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { totalPoints: "desc" }
        });

        // Also fetch teams for stats
        const teamsRaw = await prisma.team.findMany({
            select: {
                id: true,
                name: true,
                totalPoints: true,
                solvedCount: true,
                inviteCode: true,
                isBanned: true, // Include isBanned
                members: {
                    select: { id: true }
                }
            },
            orderBy: [
                { totalPoints: "desc" },
                { updatedAt: "asc" }
            ]
        });

        // Calculate rank
        const teams = teamsRaw.map((team, index) => ({
            ...team,
            rank: index + 1
        }));

        return NextResponse.json({
            success: true,
            users,
            teams,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update user role
export async function PUT(request: NextRequest) {
    try {
        const adminCheck = await checkIsAdmin(request);
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const body = await request.json();
        const { userId, role, isBanned } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
        }

        const updateData: any = {};

        // Handle Role Update
        if (role) {
            if (!["USER", "MODERATOR", "ADMIN"].includes(role)) {
                return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 });
            }
            updateData.role = role;
        }

        // Handle Ban Status Update
        if (typeof isBanned === "boolean") {
            updateData.isBanned = isBanned;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, message: "No fields to update. Provide 'role' or 'isBanned'." }, { status: 400 });
        }

        // Find user to update
        const userToUpdate = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userToUpdate) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const oldRole = userToUpdate.role;
        const oldBanStatus = userToUpdate.isBanned;

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        // Log admin action
        let actionDetails = "";
        let actionType = "UPDATE_USER";

        if (isBanned !== undefined && isBanned !== oldBanStatus) {
            actionType = isBanned ? "BAN_USER" : "UNBAN_USER";
            actionDetails = `${isBanned ? "Banned" : "Unbanned"} user ${updatedUser.username}`;
        } else if (role && role !== oldRole) {
            actionType = "UPDATE_USER_ROLE";
            actionDetails = `Changed ${updatedUser.username} role from ${oldRole} to ${role}`;
        } else {
            actionDetails = `Updated user ${updatedUser.username}`;
        }

        logAdminAction(
            adminCheck.adminId!,
            actionType,
            "USER",
            userId,
            actionDetails,
            request
        );

        return NextResponse.json({
            success: true,
            message: `User ${updatedUser.username} updated successfully.`,
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Remove user from team (admin action)
export async function DELETE(request: NextRequest) {
    try {
        const adminCheck = await checkIsAdmin(request);
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID required" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { team: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        if (!user.teamId) {
            return NextResponse.json(
                { success: false, message: "User is not in a team" },
                { status: 400 }
            );
        }

        const teamName = user.team?.name;

        // Remove user from team
        await prisma.user.update({
            where: { id: userId },
            data: {
                teamId: null,
                isTeamLeader: false,
            }
        });

        // Log admin action
        logAdminAction(
            adminCheck.adminId!,
            "REMOVE_USER_FROM_TEAM",
            "USER",
            userId,
            `Removed ${user.username} from team ${teamName}`,
            request
        );

        return NextResponse.json({
            success: true,
            message: `User removed from team ${teamName}`,
        });
    } catch (error) {
        console.error("Error removing user from team:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
