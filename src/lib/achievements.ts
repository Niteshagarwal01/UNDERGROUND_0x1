import prisma from "@/lib/prisma";

/**
 * Achievement Checker - Checks and awards achievements based on user/team stats
 */

interface AchievementCheck {
    userId: string;
    teamId: string;
    isFirstBlood?: boolean;
    challengeDifficulty?: string;
    categorySlug?: string;
}

export async function checkAndAwardAchievements(check: AchievementCheck): Promise<string[]> {
    const awardedAchievements: string[] = [];

    try {
        // Get user stats
        const user = await prisma.user.findUnique({
            where: { id: check.userId },
            select: { id: true, solvedCount: true }
        });

        if (!user) return [];

        // Get team stats
        const team = await prisma.team.findUnique({
            where: { id: check.teamId },
            include: {
                solves: {
                    where: { isFirstBlood: true }
                }
            }
        });

        if (!team) return [];

        const firstBloodCount = team.solves.length;
        const solveCount = user.solvedCount;

        // Get all achievements
        const achievements = await prisma.achievement.findMany();

        // Get user's existing achievements
        const existingAchievements = await prisma.userAchievement.findMany({
            where: { userId: check.userId },
            select: { achievementId: true }
        });
        const existingIds = new Set(existingAchievements.map(a => a.achievementId));

        // Check each achievement
        for (const achievement of achievements) {
            // Skip if already earned
            if (existingIds.has(achievement.id)) continue;

            let earned = false;

            switch (achievement.category) {
                case 'FIRST_BLOOD':
                    if (check.isFirstBlood && firstBloodCount >= achievement.requirement) {
                        earned = true;
                    }
                    break;

                case 'SOLVES':
                    if (solveCount >= achievement.requirement) {
                        earned = true;
                    }
                    break;

                case 'DIFFICULTY':
                    if (achievement.slug === 'god-slayer' && check.challengeDifficulty === 'GOD_LEVEL') {
                        // Check if team has solved any god level
                        const godSolves = await prisma.solve.count({
                            where: {
                                teamId: check.teamId,
                                challenge: { difficulty: 'GOD_LEVEL' }
                            }
                        });
                        if (godSolves >= achievement.requirement) earned = true;
                    } else if (achievement.slug === 'god-killer') {
                        const godSolves = await prisma.solve.count({
                            where: {
                                teamId: check.teamId,
                                challenge: { difficulty: 'GOD_LEVEL' }
                            }
                        });
                        if (godSolves >= achievement.requirement) earned = true;
                    } else if (achievement.slug === 'hard-worker') {
                        const hardSolves = await prisma.solve.count({
                            where: {
                                teamId: check.teamId,
                                challenge: { difficulty: 'HARD' }
                            }
                        });
                        if (hardSolves >= achievement.requirement) earned = true;
                    }
                    break;

                case 'CATEGORY':
                    // Check if user completed an entire category
                    if (check.categorySlug) {
                        const categorySlugToAchievement: Record<string, string> = {
                            'osint': 'osint-master',
                            'forensics': 'forensics-master',
                            'crypto': 'crypto-master',
                            'reversing': 'reverse-master',
                            'web': 'web-master'
                        };

                        if (categorySlugToAchievement[check.categorySlug] === achievement.slug) {
                            // Check if all challenges in this category are solved
                            const category = await prisma.category.findUnique({
                                where: { slug: check.categorySlug },
                                include: {
                                    challenges: {
                                        where: { isActive: true, isHidden: false },
                                        select: { id: true }
                                    }
                                }
                            });

                            if (category && category.challenges.length > 0) {
                                const teamSolves = await prisma.solve.count({
                                    where: {
                                        teamId: check.teamId,
                                        challengeId: { in: category.challenges.map(c => c.id) }
                                    }
                                });

                                if (teamSolves === category.challenges.length) {
                                    earned = true;
                                }
                            }
                        }
                    }
                    break;
            }

            // Award achievement if earned
            if (earned) {
                try {
                    await prisma.userAchievement.create({
                        data: {
                            userId: check.userId,
                            achievementId: achievement.id
                        }
                    });
                    awardedAchievements.push(achievement.name);
                    console.log(`🏆 Achievement unlocked: ${achievement.name} for user ${check.userId}`);
                } catch (e) {
                    // Might already exist due to race condition, ignore
                }
            }
        }

    } catch (error) {
        console.error("Error checking achievements:", error);
    }

    return awardedAchievements;
}
