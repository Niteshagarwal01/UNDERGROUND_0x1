import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        if (!username) {
            return NextResponse.json(
                { success: false, message: "Username is required" },
                { status: 400 }
            );
        }

        // Fetch user with related data including role
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                totalPoints: true,
                solvedCount: true,
                createdAt: true,
                lastActive: true,
                role: true, // Include role to check admin status
                team: {
                    select: {
                        id: true,
                        name: true,
                        totalPoints: true,
                        solvedCount: true,
                        members: {
                            select: {
                                role: true
                            }
                        },
                        _count: {
                            select: { members: true }
                        }
                    }
                },
                isTeamLeader: true,
            }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is admin/moderator or in an admin team
        const isAdmin = user.role === "ADMIN" || user.role === "MODERATOR";
        const isInAdminTeam = user.team?.members?.some(
            (member) => member.role === "ADMIN" || member.role === "MODERATOR"
        ) || false;
        const shouldHideRankAndAchievements = isAdmin || isInAdminTeam;

        // Get user achievements ONLY if not admin
        let userAchievements: {
            id: string;
            name: string;
            description: string;
            icon: string;
            points: number;
            rarity: string;
            category: string;
            earnedAt: Date;
        }[] = [];

        if (!shouldHideRankAndAchievements) {
            const achievements = await prisma.userAchievement.findMany({
                where: { userId: user.id },
                include: {
                    achievement: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            icon: true,
                            points: true,
                            rarity: true,
                            category: true
                        }
                    }
                },
                orderBy: { earnedAt: "desc" }
            });

            userAchievements = achievements.map(ua => ({
                id: ua.achievement.id,
                name: ua.achievement.name,
                description: ua.achievement.description,
                icon: ua.achievement.icon,
                points: ua.achievement.points,
                rarity: ua.achievement.rarity,
                category: ua.achievement.category,
                earnedAt: ua.earnedAt
            }));
        }

        // Get user's team solve history (if in a team)
        let solveHistory: {
            challengeTitle: string;
            categoryName: string;
            points: number;
            isFirstBlood: boolean;
            solvedAt: Date;
        }[] = [];

        if (user.team) {
            const solves = await prisma.solve.findMany({
                where: { teamId: user.team.id },
                include: {
                    challenge: {
                        select: {
                            title: true,
                            points: true,
                            category: {
                                select: { name: true }
                            }
                        }
                    }
                },
                orderBy: { solvedAt: "desc" },
                take: 20
            });

            solveHistory = solves.map(solve => ({
                challengeTitle: solve.challenge.title,
                categoryName: solve.challenge.category.name,
                points: solve.points,
                isFirstBlood: solve.isFirstBlood,
                solvedAt: solve.solvedAt
            }));
        }

        // Calculate user rank ONLY if not admin/in admin team
        let userRank: number | null = null;
        if (!shouldHideRankAndAchievements) {
            const usersWithHigherPoints = await prisma.user.count({
                where: {
                    totalPoints: { gt: user.totalPoints },
                    // Exclude admins from ranking
                    role: { notIn: ["ADMIN", "MODERATOR"] }
                }
            });
            userRank = usersWithHigherPoints + 1;
        }

        // Calculate team rank if user has a team and not admin
        let teamRank: number | null = null;
        if (user.team && !shouldHideRankAndAchievements) {
            const teamsWithHigherPoints = await prisma.team.count({
                where: {
                    totalPoints: { gt: user.team.totalPoints }
                }
            });
            teamRank = teamsWithHigherPoints + 1;
        }

        // Count first bloods for user's team
        let firstBloodCount = 0;
        if (user.team) {
            firstBloodCount = await prisma.solve.count({
                where: {
                    teamId: user.team.id,
                    isFirstBlood: true
                }
            });
        }

        return NextResponse.json({
            success: true,
            profile: {
                id: user.id,
                username: user.username,
                avatarUrl: user.avatarUrl,
                totalPoints: user.totalPoints,
                solvedCount: user.solvedCount,
                rank: userRank, // null for admins
                isAdmin: shouldHideRankAndAchievements, // flag for frontend
                createdAt: user.createdAt,
                lastActive: user.lastActive,
                isTeamLeader: user.isTeamLeader,
                team: user.team ? {
                    id: user.team.id,
                    name: user.team.name,
                    totalPoints: user.team.totalPoints,
                    solvedCount: user.team.solvedCount,
                    rank: teamRank,
                    memberCount: user.team._count.members,
                    firstBloodCount
                } : null,
                achievements: userAchievements,
                solveHistory
            }
        });

    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

