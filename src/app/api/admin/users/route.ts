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

        return NextResponse.json({
            success: true,
            users,
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
        const { userId, role } = body;

        // Validate role
        if (!["USER", "MODERATOR", "ADMIN"].includes(role)) {
            return NextResponse.json(
                { success: false, message: "Invalid role" },
                { status: 400 }
            );
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

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
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
        logAdminAction(
            adminCheck.adminId!,
            "UPDATE_USER_ROLE",
            "USER",
            userId,
            `Changed ${updatedUser.username} role from ${oldRole} to ${role}`,
            request
        );

        return NextResponse.json({
            success: true,
            message: `User role updated to ${role}`,
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
