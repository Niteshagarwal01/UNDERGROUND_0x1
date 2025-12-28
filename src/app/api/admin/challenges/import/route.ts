import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

interface ChallengeImport {
    title: string;
    slug: string;
    description: string;
    categoryId?: string;
    categoryName?: string;
    difficulty?: "MEDIUM" | "HARD" | "GOD_LEVEL";
    points: number;
    flag: string;
    resourceUrl?: string;
    isActive?: boolean;
    isHidden?: boolean;
}

// POST - Bulk import challenges
export async function POST(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin || !adminCheck.user) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const body = await request.json();
        const { challenges, preview = false } = body as { challenges: ChallengeImport[]; preview?: boolean };

        if (!Array.isArray(challenges) || challenges.length === 0) {
            return NextResponse.json(
                { success: false, message: "No challenges provided" },
                { status: 400 }
            );
        }

        // Get all categories for lookup
        const categories = await prisma.category.findMany();
        const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
        const categoryIdSet = new Set(categories.map(c => c.id));

        // Get existing slugs
        const existingSlugs = new Set(
            (await prisma.challenge.findMany({ select: { slug: true } })).map(c => c.slug)
        );

        // Validate all challenges
        const validationResults: Array<{
            index: number;
            title: string;
            valid: boolean;
            errors: string[];
            challenge?: ChallengeImport;
        }> = [];

        const flagRegex = /^ug0x1\{[a-zA-Z0-9_]{10,50}\}$/i;

        for (let i = 0; i < challenges.length; i++) {
            const c = challenges[i];
            const errors: string[] = [];

            if (!c.title?.trim()) errors.push("Title is required");
            if (!c.slug?.trim()) errors.push("Slug is required");
            if (!c.description?.trim()) errors.push("Description is required");
            if (!c.points || c.points <= 0) errors.push("Points must be a positive number");
            if (!c.flag?.trim()) errors.push("Flag is required");
            else if (!flagRegex.test(c.flag.trim())) {
                errors.push("Invalid flag format. Expected: UG0x1{...} with 10-50 alphanumeric characters");
            }

            // Check category
            let categoryId = c.categoryId;
            if (!categoryId && c.categoryName) {
                categoryId = categoryMap.get(c.categoryName.toLowerCase());
                if (!categoryId) errors.push(`Category "${c.categoryName}" not found`);
            } else if (categoryId && !categoryIdSet.has(categoryId)) {
                errors.push(`Category ID "${categoryId}" not found`);
            }
            if (!categoryId) errors.push("Category is required");

            // Check for duplicate slug
            const slug = c.slug?.trim().toLowerCase();
            if (slug && existingSlugs.has(slug)) {
                errors.push(`Slug "${slug}" already exists`);
            }

            // Check for duplicate slug in import batch
            const duplicateInBatch = challenges.filter((ch, idx) =>
                idx !== i && ch.slug?.trim().toLowerCase() === slug
            );
            if (duplicateInBatch.length > 0) {
                errors.push(`Duplicate slug "${slug}" in import batch`);
            }

            validationResults.push({
                index: i,
                title: c.title || `Challenge ${i + 1}`,
                valid: errors.length === 0,
                errors,
                challenge: errors.length === 0 ? { ...c, categoryId } : undefined
            });
        }

        const validCount = validationResults.filter(r => r.valid).length;
        const invalidCount = validationResults.filter(r => !r.valid).length;

        // If preview mode, just return validation results
        if (preview) {
            return NextResponse.json({
                success: true,
                preview: true,
                validCount,
                invalidCount,
                results: validationResults
            });
        }

        // Import valid challenges
        if (validCount === 0) {
            return NextResponse.json({
                success: false,
                message: "No valid challenges to import",
                validCount: 0,
                invalidCount,
                results: validationResults
            });
        }

        const importedChallenges: string[] = [];

        for (const result of validationResults) {
            if (!result.valid || !result.challenge) continue;

            const c = result.challenge;
            const flagHash = await bcrypt.hash(c.flag.toLowerCase().trim(), 12);

            try {
                const challenge = await prisma.challenge.create({
                    data: {
                        title: c.title.trim(),
                        slug: c.slug.trim().toLowerCase(),
                        description: c.description.trim(),
                        categoryId: c.categoryId!,
                        difficulty: c.difficulty || "MEDIUM",
                        points: c.points,
                        flagHash,
                        resourceUrl: c.resourceUrl?.trim() || null,
                        isActive: c.isActive ?? true,
                        isHidden: c.isHidden ?? false,
                    }
                });
                importedChallenges.push(challenge.id);
            } catch (error) {
                console.error(`Failed to import challenge ${c.title}:`, error);
                result.valid = false;
                result.errors.push("Database error during import");
            }
        }

        // Log the action
        await logAction(
            adminCheck.user.id,
            adminCheck.user.email,
            "BULK_IMPORT_CHALLENGES",
            "Challenge",
            undefined,
            JSON.stringify({
                totalProvided: challenges.length,
                imported: importedChallenges.length,
                failed: challenges.length - importedChallenges.length
            })
        );

        return NextResponse.json({
            success: true,
            message: `Successfully imported ${importedChallenges.length} challenges`,
            importedCount: importedChallenges.length,
            failedCount: challenges.length - importedChallenges.length,
            results: validationResults
        });
    } catch (error) {
        console.error("Error importing challenges:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
