import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const clerkUser = await currentUser();

        if (!clerkUser) {
            return NextResponse.json(
                { success: false, message: "Failed to get user info" },
                { status: 500 }
            );
        }

        // Check if user exists in database
        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                team: {
                    include: {
                        members: {
                            select: {
                                role: true,
                            },
                        },
                        _count: { select: { members: true, solves: true } },
                    },
                },
                submissions: {
                    where: { isCorrect: true },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    include: {
                        challenge: {
                            select: { title: true, points: true },
                        },
                    },
                },
            },
        });

        // If user doesn't exist, create them
        if (!user) {
            // Generate unique username if it already exists
            let username = clerkUser.username || clerkUser.firstName || `user_${userId.slice(-8)}`;
            const usernameExists = await prisma.user.findUnique({
                where: { username },
            });

            // If username exists, append random suffix
            if (usernameExists) {
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                username = `${username}_${randomSuffix}`;
            }

            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: clerkUser.emailAddresses[0]?.emailAddress || "",
                    username: username,
                    avatarUrl: clerkUser.imageUrl,
                },
                include: {
                    team: {
                        include: {
                            members: {
                                select: {
                                    role: true,
                                },
                            },
                            _count: { select: { members: true, solves: true } },
                        },
                    },
                    submissions: {
                        where: { isCorrect: true },
                        orderBy: { createdAt: "desc" },
                        take: 10,
                        include: {
                            challenge: {
                                select: { title: true, points: true },
                            },
                        },
                    },
                },
            });
        }

        // At this point user is guaranteed to exist
        const currentUserData = user!;

        // Calculate rank properly (excluding admins, moderators, and users in admin teams from ranking)
        let userRank: number | null = null;

        // Check if user is admin, moderator, or in admin team
        const isAdmin = currentUserData.role === "ADMIN";
        const isModerator = currentUserData.role === "MODERATOR";
        const isInAdminTeam = currentUserData.team?.members?.some((member) => member.role === "ADMIN") || false;

        // Admins, moderators, and users in admin teams don't have ranks
        if (!isAdmin && !isModerator && !isInAdminTeam) {
            // Get all teams with their members to check for admin teams
            const allTeams = await prisma.team.findMany({
                include: {
                    members: {
                        select: {
                            role: true,
                        },
                    },
                },
            });

            // Get admin team IDs
            const adminTeamIds = allTeams
                .filter((team) => team.members.some((m) => m.role === "ADMIN"))
                .map((team) => team.id);

            // Get all users ordered by points, excluding admins, moderators, and users in admin teams
            const allUsers = await prisma.user.findMany({
                where: {
                    role: { notIn: ["ADMIN", "MODERATOR"] },
                    OR: [
                        { teamId: null }, // Users without teams
                        { teamId: { notIn: adminTeamIds } }, // Users in non-admin teams
                    ],
                },
                orderBy: [
                    { totalPoints: "desc" },
                    { solvedCount: "desc" },
                    { createdAt: "asc" }, // Earlier registration breaks ties
                ],
                select: {
                    id: true,
                    totalPoints: true,
                    solvedCount: true,
                },
            });

            // Find user's position in the ranking
            for (let i = 0; i < allUsers.length; i++) {
                if (allUsers[i].id === currentUserData.id) {
                    // Handle ties: if previous users have same points and solves, share rank
                    let rank = i + 1;
                    for (let j = i - 1; j >= 0; j--) {
                        if (allUsers[j].totalPoints === currentUserData.totalPoints &&
                            allUsers[j].solvedCount === currentUserData.solvedCount) {
                            rank = j + 1;
                        } else {
                            break;
                        }
                    }
                    userRank = rank;
                    break;
                }
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: currentUserData.id,
                username: currentUserData.username,
                email: currentUserData.email,
                avatarUrl: currentUserData.avatarUrl,
                totalPoints: currentUserData.totalPoints,
                solvedCount: currentUserData.solvedCount,
                rank: userRank,
                team: currentUserData.team
                    ? {
                        id: currentUserData.team.id,
                        name: currentUserData.team.name,
                        totalPoints: currentUserData.team.totalPoints,
                        memberCount: currentUserData.team._count.members,
                        solveCount: currentUserData.team._count.solves,
                        inviteCode: currentUserData.isTeamLeader ? currentUserData.team.inviteCode : undefined,
                    }
                    : null,
                isTeamLeader: currentUserData.isTeamLeader,
                recentSolves: currentUserData.submissions.map((s) => ({
                    challengeTitle: s.challenge.title,
                    points: s.challenge.points,
                    solvedAt: s.createdAt.toISOString(),
                })),
            },
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? `DB Error: ${error.message}` : "Database connection error"
            },
            { status: 500 }
        );
    }
}
