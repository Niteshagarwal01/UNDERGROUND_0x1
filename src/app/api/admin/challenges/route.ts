import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
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

    const isDirectAdmin = user.role === "ADMIN";
    const isModerator = user.role === "MODERATOR";
    const hasAdminInTeam = user.team?.members.some((member) => member.role === "ADMIN") || false;

    if (!isDirectAdmin && !isModerator && !hasAdminInTeam) {
        return { isAdmin: false, error: "Forbidden" };
    }

    return { isAdmin: true };
}

// GET - Fetch all challenges
export async function GET() {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const challenges = await prisma.challenge.findMany({
            include: {
                category: true,
                _count: {
                    select: { solves: true }
                }
            },
            orderBy: [
                { category: { order: "asc" } },
                { points: "asc" }
            ]
        });

        const categories = await prisma.category.findMany({
            orderBy: { order: "asc" }
        });

        return NextResponse.json({
            success: true,
            challenges,
            categories
        });
    } catch (error) {
        console.error("Error fetching challenges:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create new challenge
export async function POST(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const body = await request.json();
        const {
            title,
            slug,
            description,
            categoryId,
            difficulty,
            points,
            flag, // Plain text flag (will be hashed)
            resourceUrl,
            isActive = true,
            isHidden = false,
        } = body;

        // Validate required fields
        if (!title || !slug || !description || !categoryId || !points || !flag) {
            return NextResponse.json(
                { success: false, message: "All fields are required: title, slug, description, categoryId, points, flag" },
                { status: 400 }
            );
        }

        // Validate flag format
        const flagRegex = /^ug0x1\{[a-zA-Z0-9_]{10,50}\}$/i;
        if (!flagRegex.test(flag.trim())) {
            return NextResponse.json(
                { success: false, message: "Invalid flag format. Expected: UG0x1{...} with 10-50 alphanumeric characters" },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existingSlug = await prisma.challenge.findUnique({
            where: { slug }
        });

        if (existingSlug) {
            return NextResponse.json(
                { success: false, message: "A challenge with this slug already exists" },
                { status: 400 }
            );
        }

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return NextResponse.json(
                { success: false, message: "Invalid category" },
                { status: 400 }
            );
        }

        // Hash the flag
        const flagHash = await bcrypt.hash(flag.toLowerCase().trim(), 12);

        // Create challenge
        const challenge = await prisma.challenge.create({
            data: {
                title: title.trim(),
                slug: slug.trim().toLowerCase(),
                description: description.trim(),
                categoryId,
                difficulty: difficulty || "MEDIUM",
                points: parseInt(points),
                flagHash,
                resourceUrl: resourceUrl?.trim() || null,
                isActive,
                isHidden,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Challenge created successfully!",
            challenge,
        });
    } catch (error) {
        console.error("Error creating challenge:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
