import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
    applySecurityFirewalls,
    checkBruteForce,
    recordFailedAttempt,
    clearBruteForce,
    sanitizeFlag
} from "@/lib/security";

// Database-based rate limiting
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const RATE_LIMIT = 5;
    const RATE_WINDOW_MS = 60 * 1000; // 1 minute
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);

    // Count recent submissions for this user
    const recentCount = await prisma.submission.count({
        where: {
            userId,
            createdAt: { gte: windowStart }
        }
    });

    if (recentCount >= RATE_LIMIT) {
        // Find oldest submission in window to calculate retry time
        const oldestInWindow = await prisma.submission.findFirst({
            where: {
                userId,
                createdAt: { gte: windowStart }
            },
            orderBy: { createdAt: "asc" }
        });

        const retryAfter = oldestInWindow
            ? Math.ceil((oldestInWindow.createdAt.getTime() + RATE_WINDOW_MS - now.getTime()) / 1000)
            : 60;

        return { allowed: false, retryAfter };
    }

    return { allowed: true };
}

export async function POST(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Authentication required" },
                { status: 401 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId },
            include: { team: true },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found. Please refresh the page." },
                { status: 404 }
            );
        }

        if (!user.team) {
            return NextResponse.json(
                { success: false, message: "You must be in a team to submit flags." },
                { status: 400 }
            );
        }

        // Rate limiting (database-based)
        const rateCheck = await checkRateLimit(user.id);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { success: false, message: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { challengeId, flag } = body;

        if (!challengeId || !flag) {
            return NextResponse.json(
                { success: false, message: "Challenge ID and flag are required" },
                { status: 400 }
            );
        }

        // SECURITY: Apply request validation firewalls
        const securityCheck = applySecurityFirewalls(request, body, user.id);
        if (securityCheck) {
            return securityCheck;
        }

        // Sanitize flag input
        const normalizedFlag = sanitizeFlag(flag.trim().toLowerCase());

        // Validate flag format
        const flagRegex = /^ug0x1\{[a-zA-Z0-9_]{10,50}\}$/i;
        if (!flagRegex.test(normalizedFlag)) {
            return NextResponse.json(
                { success: false, message: "Invalid flag format. Expected: UG0x1{...}" },
                { status: 400 }
            );
        }

        // Find challenge in database
        const challenge = await prisma.challenge.findFirst({
            where: {
                OR: [
                    { slug: challengeId },
                    { id: challengeId }
                ],
                isActive: true,
                isHidden: false
            }
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, message: "Challenge not found or not available" },
                { status: 404 }
            );
        }

        // Check if team already solved BEFORE anything else
        const existingSolve = await prisma.solve.findUnique({
            where: {
                teamId_challengeId: {
                    teamId: user.team.id,
                    challengeId: challenge.id,
                }
            }
        });

        if (existingSolve) {
            // Challenge already solved by team - don't even count this submission
            return NextResponse.json({
                success: true,
                message: "🔒 This challenge has already been solved by your team!",
                points: 0,
                isFirstBlood: false,
                alreadySolved: true,
            });
        }

        // SECURITY: Check brute-force protection
        const bruteForceCheck = checkBruteForce(user.id, challenge.id);
        if (!bruteForceCheck.allowed) {
            return NextResponse.json(
                { success: false, message: `Too many failed attempts. Try again in ${bruteForceCheck.retryAfter} seconds.` },
                { status: 429 }
            );
        }

        // Verify flag using bcrypt hash from database
        const isCorrect = await bcrypt.compare(normalizedFlag, challenge.flagHash);

        // Record the submission (for audit trail)
        await prisma.submission.create({
            data: {
                userId: user.id,
                teamId: user.team.id,
                challengeId: challenge.id,
                flag: "[REDACTED]", // Don't store actual flags
                isCorrect,
            }
        });

        // Update attempt count
        await prisma.challenge.update({
            where: { id: challenge.id },
            data: { attemptCount: { increment: 1 } }
        });

        if (!isCorrect) {
            // Record failed attempt for brute-force protection
            recordFailedAttempt(user.id, challenge.id);

            return NextResponse.json({
                success: false,
                message: "❌ Incorrect flag. Try again.",
            });
        }

        // Flag is correct! Use transaction with unique constraint to prevent race condition
        // The database has @@unique([teamId, challengeId]) on Solve model
        try {
            // Get fresh solveCount inside transaction to prevent race on bonus calculation
            const result = await prisma.$transaction(async (tx) => {
                // Double-check solve doesn't exist (race condition protection)
                const checkSolve = await tx.solve.findUnique({
                    where: {
                        teamId_challengeId: {
                            teamId: user.team!.id,
                            challengeId: challenge.id,
                        }
                    }
                });

                if (checkSolve) {
                    // Another team member just solved it
                    return { alreadySolved: true };
                }

                // Get current challenge state
                const currentChallenge = await tx.challenge.findUnique({
                    where: { id: challenge.id },
                    select: { solveCount: true, points: true }
                });

                if (!currentChallenge) {
                    throw new Error("Challenge not found");
                }

                const solveCount = currentChallenge.solveCount;
                let bonus = 0;

                // First 3 solves get bonuses
                // Points: 300 (Medium), 500 (Hard), 800 (God-Level)
                if (solveCount < 3) {
                    const bonusMultipliers = [1.0, 0.6, 0.3]; // 100%, 60%, 30% of base bonus
                    const baseBonus = currentChallenge.points >= 800 ? 200
                        : currentChallenge.points >= 500 ? 100
                            : 50;
                    bonus = Math.floor(baseBonus * bonusMultipliers[solveCount]);
                }

                const isFirstBlood = solveCount === 0;
                const totalPoints = currentChallenge.points + bonus;

                // Create solve record
                await tx.solve.create({
                    data: {
                        teamId: user.team!.id,
                        challengeId: challenge.id,
                        points: totalPoints,
                        isFirstBlood,
                        firstBloodId: isFirstBlood ? challenge.id : undefined,
                    },
                });

                // Update challenge solve count
                await tx.challenge.update({
                    where: { id: challenge.id },
                    data: { solveCount: { increment: 1 } },
                });

                // Update team stats
                await tx.team.update({
                    where: { id: user.team!.id },
                    data: {
                        totalPoints: { increment: totalPoints },
                        solvedCount: { increment: 1 },
                    },
                });

                // Update user stats
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        totalPoints: { increment: totalPoints },
                        solvedCount: { increment: 1 },
                    },
                });

                return {
                    alreadySolved: false,
                    points: totalPoints,
                    bonus,
                    isFirstBlood
                };
            });

            if (result.alreadySolved) {
                return NextResponse.json({
                    success: true,
                    message: "🔒 This challenge was just solved by another team member! Points awarded to your team.",
                    points: 0,
                    isFirstBlood: false,
                    alreadySolved: true,
                });
            }

            // Build response message
            let message = "";
            if (result.isFirstBlood) {
                message = `🩸 FIRST BLOOD! +${result.points} points (includes +${result.bonus || 0} bonus). Challenge solved for your entire team!`;
            } else if ((result.bonus || 0) > 0) {
                message = `✅ Challenge Solved! +${result.points} points (includes +${result.bonus} early solve bonus). This challenge is now complete for your entire team!`;
            } else {
                message = `✅ Challenge Solved! +${result.points} points. This challenge is now complete for your entire team!`;
            }

            return NextResponse.json({
                success: true,
                message,
                points: result.points,
                isFirstBlood: result.isFirstBlood,
                solved: true,
            });

        } catch (txError: any) {
            // Unique constraint violation = another team member solved it simultaneously
            if (txError.code === 'P2002') {
                return NextResponse.json({
                    success: true,
                    message: "🔒 Another team member just solved this challenge! Points awarded to your team.",
                    points: 0,
                    isFirstBlood: false,
                    alreadySolved: true,
                });
            }
            throw txError;
        }

    } catch (error) {
        console.error("Flag submission error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
