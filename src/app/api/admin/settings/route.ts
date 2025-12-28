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

// GET - Fetch platform settings
export async function GET() {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        // Get or create default settings
        let settings = await prisma.platformSettings.findUnique({
            where: { id: "default" }
        });

        if (!settings) {
            settings = await prisma.platformSettings.create({
                data: { id: "default" }
            });
        }

        return NextResponse.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH - Update platform settings
export async function PATCH(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin || !adminCheck.user) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const body = await request.json();
        const {
            registrationOpen,
            submissionsEnabled,
            submissionRateLimit,
            maxTeamSize,
            competitionStart,
            competitionEnd
        } = body;

        // Get current settings for audit log
        const currentSettings = await prisma.platformSettings.findUnique({
            where: { id: "default" }
        });

        const updateData: Record<string, unknown> = {};

        if (typeof registrationOpen === "boolean") updateData.registrationOpen = registrationOpen;
        if (typeof submissionsEnabled === "boolean") updateData.submissionsEnabled = submissionsEnabled;
        if (typeof submissionRateLimit === "number") updateData.submissionRateLimit = submissionRateLimit;
        if (typeof maxTeamSize === "number") updateData.maxTeamSize = maxTeamSize;
        if (competitionStart !== undefined) updateData.competitionStart = competitionStart ? new Date(competitionStart) : null;
        if (competitionEnd !== undefined) updateData.competitionEnd = competitionEnd ? new Date(competitionEnd) : null;

        const settings = await prisma.platformSettings.upsert({
            where: { id: "default" },
            update: updateData,
            create: { id: "default", ...updateData }
        });

        // Log the action
        await logAction(
            adminCheck.user.id,
            adminCheck.user.email,
            "UPDATE_SETTINGS",
            "PlatformSettings",
            "default",
            JSON.stringify({ before: currentSettings, after: settings })
        );

        return NextResponse.json({
            success: true,
            message: "Settings updated successfully",
            settings
        });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
