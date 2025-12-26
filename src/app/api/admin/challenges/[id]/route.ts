import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Check if user is admin or in admin team
async function checkAdmin() {
    const { userId } = await auth();
    if (!userId) {
        return { isAdmin: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
            team: {
                include: {
                    members: {
                        select: {
                            role: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) {
        return { isAdmin: false, error: "Forbidden" };
    }

    // ADMIN and MODERATOR roles get admin access
    // Team members get MODERATOR role when joining admin team
    const isDirectAdmin = user.role === "ADMIN";
    const isModerator = user.role === "MODERATOR";

    if (!isDirectAdmin && !isModerator) {
        return { isAdmin: false, error: "Forbidden" };
    }

    return { isAdmin: true };
}

// GET - Fetch single challenge
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { id } = await params;
        const challenge = await prisma.challenge.findUnique({
            where: { id },
            include: {
                category: true,
                files: true,
                hints: true,
            },
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, message: "Challenge not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            challenge,
        });
    } catch (error) {
        console.error("Error fetching challenge:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update challenge
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const {
            title,
            slug,
            description,
            categoryId,
            difficulty,
            points,
            flag, // Plain text flag (will be hashed)
            isActive,
            isHidden,
        } = body;

        // Validate required fields
        if (!title || !slug || !description || !categoryId || !points) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if challenge exists
        const existingChallenge = await prisma.challenge.findUnique({
            where: { id },
        });

        if (!existingChallenge) {
            return NextResponse.json(
                { success: false, message: "Challenge not found" },
                { status: 404 }
            );
        }

        // Check if slug is already taken by another challenge
        if (slug !== existingChallenge.slug) {
            const slugExists = await prisma.challenge.findUnique({
                where: { slug },
            });
            if (slugExists) {
                return NextResponse.json(
                    { success: false, message: "Slug already exists" },
                    { status: 400 }
                );
            }
        }

        // Hash flag if provided
        let flagHash = existingChallenge.flagHash;
        if (flag) {
            flagHash = await bcrypt.hash(flag.toLowerCase(), 12);
        }

        // Update challenge
        const updatedChallenge = await prisma.challenge.update({
            where: { id },
            data: {
                title,
                slug,
                description,
                categoryId,
                difficulty: difficulty || existingChallenge.difficulty,
                points: parseInt(points),
                flagHash,
                isActive: isActive !== undefined ? isActive : existingChallenge.isActive,
                isHidden: isHidden !== undefined ? isHidden : existingChallenge.isHidden,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Challenge updated successfully",
            challenge: updatedChallenge,
        });
    } catch (error) {
        console.error("Error updating challenge:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete challenge
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { id } = await params;
        const challenge = await prisma.challenge.findUnique({
            where: { id },
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, message: "Challenge not found" },
                { status: 404 }
            );
        }

        await prisma.challenge.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Challenge deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting challenge:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

