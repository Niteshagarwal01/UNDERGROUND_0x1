import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Find the team and its members
        const team = await prisma.team.findUnique({
            where: { id },
            select: {
                id: true,
                members: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        role: true,
                    }
                }
            }
        });

        if (!team) {
            return NextResponse.json(
                { success: false, message: "Team not found" },
                { status: 404 }
            );
        }

        // Check if this is an admin team
        const isAdminTeam = team.members.some(
            member => member.role === "ADMIN" || member.role === "MODERATOR"
        );

        // Admin teams don't have achievements shown
        if (isAdminTeam) {
            return NextResponse.json({
                success: true,
                achievements: [],
                message: "Admin teams do not have achievements displayed"
            });
        }

        // Fetch all achievements earned by team members
        const memberIds = team.members.map(m => m.id);

        // Get all user achievements with the achievement details
        const userAchievements = await prisma.userAchievement.findMany({
            where: {
                userId: { in: memberIds }
            },
            select: {
                id: true,
                earnedAt: true,
                achievement: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        icon: true,
                        rarity: true,
                    }
                },
                user: {
                    select: {
                        username: true,
                        avatarUrl: true,
                    }
                }
            },
            orderBy: { earnedAt: "desc" }
        });

        // Group achievements by achievement id
        const achievementMap = new Map<string, {
            id: string;
            name: string;
            description: string;
            icon: string;
            rarity: string;
            earnedBy: {
                username: string;
                avatarUrl: string | null;
                earnedAt: Date;
            }[];
        }>();

        for (const ua of userAchievements) {
            const existing = achievementMap.get(ua.achievement.id);
            if (existing) {
                existing.earnedBy.push({
                    username: ua.user.username,
                    avatarUrl: ua.user.avatarUrl,
                    earnedAt: ua.earnedAt
                });
            } else {
                achievementMap.set(ua.achievement.id, {
                    id: ua.achievement.id,
                    name: ua.achievement.name,
                    description: ua.achievement.description,
                    icon: ua.achievement.icon,
                    rarity: ua.achievement.rarity,
                    earnedBy: [{
                        username: ua.user.username,
                        avatarUrl: ua.user.avatarUrl,
                        earnedAt: ua.earnedAt
                    }]
                });
            }
        }

        // Convert to array and sort by rarity (legendary first)
        const rarityOrder = { LEGENDARY: 0, EPIC: 1, RARE: 2, COMMON: 3 };
        const achievements = Array.from(achievementMap.values()).sort((a, b) => {
            return (rarityOrder[a.rarity as keyof typeof rarityOrder] || 4) -
                (rarityOrder[b.rarity as keyof typeof rarityOrder] || 4);
        });

        return NextResponse.json({
            success: true,
            achievements
        });

    } catch (error) {
        console.error("Error fetching team achievements:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch team achievements" },
            { status: 500 }
        );
    }
}
