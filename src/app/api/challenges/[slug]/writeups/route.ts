
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/challenges/[slug]/writeups
// Fetch all visible writeups for a challenge
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { userId: clerkId } = await auth();

        if (!slug) {
            return NextResponse.json({ success: false, message: "Slug required" }, { status: 400 });
        }

        // Get Current User (if logged in)
        let userId: string | undefined;
        let teamId: string | undefined;
        let role: string = "USER";

        if (clerkId) {
            const user = await prisma.user.findUnique({
                where: { clerkId },
                select: { id: true, teamId: true, role: true }
            });
            if (user) {
                userId = user.id;
                teamId = user.teamId || undefined;
                role = user.role;
            }
        }

        // Get Challenge ID
        const challenge = await prisma.challenge.findUnique({
            where: { slug },
            select: { id: true }
        });

        if (!challenge) {
            return NextResponse.json({ success: false, message: "Challenge not found" }, { status: 404 });
        }

        // Logic for Visibility:
        // 1. Admin/Mod -> Can see ALL.
        // 2. User -> 
        //    - Can see OWN (always).
        //    - Can see PUBLIC from others IF:
        //      - (Team has Solved Challenge) OR (CTF Ended)

        let canViewPublic = false;
        const isAdmin = role === "ADMIN" || role === "MODERATOR";

        if (isAdmin) {
            canViewPublic = true;
        } else if (userId && teamId) {
            // Check if team solved
            const solve = await prisma.solve.findUnique({
                where: {
                    teamId_challengeId: {
                        teamId: teamId,
                        challengeId: challenge.id
                    }
                }
            });
            if (solve) canViewPublic = true;
        }

        // Check if CTF ended (if not already allowed by solve)
        if (!isAdmin && !canViewPublic) {
            const settings = await prisma.platformSettings.findUnique({ where: { id: "default" } });
            if (settings?.competitionEnd && new Date() > settings.competitionEnd) {
                canViewPublic = true;
            }
        }

        // Construct Query
        const whereClause: any = {
            challengeId: challenge.id
        };

        if (!isAdmin) {
            // For non-admins:
            // Show (isPublic AND canViewPublic) OR (userId == myself)
            // Prisma OR limitation: simpler to fetch intersection or filter in code if complex?
            // Actually:
            // where: { 
            //   challengeId,
            //   OR: [
            //     { userId: userId }, // My writeup (private or public)
            //     ...(canViewPublic ? [{ isPublic: true }] : [])
            //   ]
            // }

            const orConditions: any[] = [];
            if (userId) {
                orConditions.push({ userId: userId });
            }
            if (canViewPublic) {
                orConditions.push({ isPublic: true });
            }

            // If no user and cannot view public (unsolved, ongoing), show nothing?
            // Should at least show public? No, public are hidden until solve/end.

            if (orConditions.length > 0) {
                whereClause.OR = orConditions;
            } else {
                // No access to anything (not logged in, not ended)
                return NextResponse.json({ success: true, writeups: [], meta: { canViewPublic } });
            }
        }

        const writeups = await prisma.writeup.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true,
                        role: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // DEFENSIVE FILTER: Ensure private writeups are ONLY visible to author or admin
        // This is a safety net in case the database query has any edge case issues
        const filteredWriteups = isAdmin
            ? writeups  // Admins see everything
            : writeups.filter(w => {
                // User can see their own writeups (public or private)
                if (userId && w.userId === userId) return true;
                // User can only see PUBLIC writeups from others
                return w.isPublic === true;
            });

        return NextResponse.json({
            success: true,
            writeups: filteredWriteups,
            meta: {
                canViewPublic,
                isAdmin
            }
        });

    } catch (error) {
        console.error("Error fetching writeups:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

// POST /api/challenges/[slug]/writeups
// Submit or Edit user writeup
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, isPublic } = body;

        if (!content) {
            return NextResponse.json({ success: false, message: "Content is required" }, { status: 400 });
        }

        // Get User
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, teamId: true }
        });

        if (!user || !user.teamId) {
            return NextResponse.json({ success: false, message: "User or Team not found" }, { status: 404 });
        }

        // Get Challenge
        const challenge = await prisma.challenge.findUnique({
            where: { slug },
            select: { id: true }
        });

        if (!challenge) {
            return NextResponse.json({ success: false, message: "Challenge not found" }, { status: 404 });
        }

        // Verify SOLVE (Must have solved to writeup)
        const solve = await prisma.solve.findUnique({
            where: {
                teamId_challengeId: {
                    teamId: user.teamId,
                    challengeId: challenge.id
                }
            }
        });

        if (!solve) {
            return NextResponse.json({ success: false, message: "You must solve the challenge first!" }, { status: 403 });
        }

        // Upsert Writeup
        const writeup = await prisma.writeup.upsert({
            where: {
                userId_challengeId: {
                    userId: user.id,
                    challengeId: challenge.id
                }
            },
            update: {
                title,
                content,
                isPublic: !!isPublic
            },
            create: {
                userId: user.id,
                challengeId: challenge.id,
                title,
                content,
                isPublic: !!isPublic
            }
        });

        return NextResponse.json({ success: true, writeup });

    } catch (error) {
        console.error("Error submitting writeup:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
