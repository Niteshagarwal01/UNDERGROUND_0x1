
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const teamName = "Xera";
    const challengeTitle = "Lost Token";

    console.log(`--- Retroactive Fix for Team "${teamName}" / Challenge "${challengeTitle}" ---`);

    // 1. Find Team
    const team = await prisma.team.findFirst({
        where: { name: { contains: teamName, mode: 'insensitive' } },
        include: { members: true }
    });

    if (!team) {
        console.log(`Error: Team "${teamName}" not found.`);
        return;
    }
    console.log(`Found Team: ${team.name} (ID: ${team.id})`);

    // 2. Find Challenge
    const challenge = await prisma.challenge.findFirst({
        where: { title: { contains: challengeTitle, mode: 'insensitive' } },
        include: { category: true }
    });
    if (!challenge) {
        console.log(`Error: Challenge "${challengeTitle}" not found.`);
        return;
    }

    // 3. Find Solve Record
    const solve = await prisma.solve.findUnique({
        where: {
            teamId_challengeId: {
                teamId: team.id,
                challengeId: challenge.id
            }
        }
    });

    if (!solve) {
        console.log("Error: Solve record not found for this team/challenge.");
        return;
    }

    const TARGET_SOLVE_POINTS = 350; // 300 base + 50 bonus (1st place)
    const POINTS_TO_ADD_SOLVE = TARGET_SOLVE_POINTS - solve.points;

    // 3.1 Update Solve Record
    if (POINTS_TO_ADD_SOLVE > 0 || !solve.isFirstBlood) {
        console.log(`Updating Solve record...`);
        await prisma.solve.update({
            where: { id: solve.id },
            data: {
                points: TARGET_SOLVE_POINTS,
                isFirstBlood: true,
                firstBloodId: challenge.id
            }
        });
        console.log(`✅ Solve updated.`);
    } else {
        console.log(`Solve already updated.`);
    }

    // 4. Find Submitting User
    const submission = await prisma.submission.findFirst({
        where: {
            teamId: team.id,
            challengeId: challenge.id,
            isCorrect: true
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!submission) {
        console.log("Error: No correct submission found.");
        return;
    }

    const userId = submission.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    console.log(`Identified Solver: ${user.username} (${userId})`);

    // 5. Award First Blood Achievement
    const fbAchievement = await prisma.achievement.findFirst({
        where: { slug: 'first-blood' }
    });

    let achievementPointsAdded = 0;

    if (fbAchievement) {
        const existing = await prisma.userAchievement.findUnique({
            where: {
                userId_achievementId: {
                    userId: userId,
                    achievementId: fbAchievement.id
                }
            }
        });

        if (!existing) {
            console.log(`Awarding "First Blood" achievement...`);
            await prisma.userAchievement.create({
                data: {
                    userId: userId,
                    achievementId: fbAchievement.id
                }
            });
            achievementPointsAdded = fbAchievement.points;

            // Notification for Achievement
            await prisma.notification.create({
                data: {
                    userId: userId,
                    type: "ACHIEVEMENT_EARNED",
                    title: "🏆 Achievement Unlocked!",
                    message: `You earned the "${fbAchievement.name}" achievement! +${fbAchievement.points} points`,
                }
            });

            // Activity Log for Achievement
            await prisma.activityLog.create({
                data: {
                    type: "ACHIEVEMENT_EARNED",
                    userId: userId,
                    username: user.username,
                    teamId: team.id,
                    teamName: team.name,
                    metadata: JSON.stringify({ achievement: fbAchievement.name, points: fbAchievement.points })
                }
            });

            console.log(`✅ Achievement awarded & Notification sent.`);
        } else {
            console.log(`First Blood achievement already exists.`);
        }
    }

    // 6. Update Totals
    const totalPointsToAdd = POINTS_TO_ADD_SOLVE + achievementPointsAdded;

    if (totalPointsToAdd > 0) {
        console.log(`Updating User ${user.username} (+${totalPointsToAdd})...`);
        await prisma.user.update({
            where: { id: userId },
            data: { totalPoints: { increment: totalPointsToAdd } }
        });

        console.log(`Updating Team ${team.name} (+${totalPointsToAdd})...`);
        await prisma.team.update({
            where: { id: team.id },
            data: { totalPoints: { increment: totalPointsToAdd } }
        });
    }

    // 7. First Blood Notification & Activity Log (If missing)
    // Check if we logged First Blood activity?
    const fbLog = await prisma.activityLog.findFirst({
        where: {
            type: "FIRST_BLOOD",
            teamId: team.id,
            challengeId: challenge.id
        }
    });

    if (!fbLog) {
        console.log("Creating proper 'First Blood' Activity Log and Notification...");

        // Activity Log
        await prisma.activityLog.create({
            data: {
                type: "FIRST_BLOOD",
                teamId: team.id,
                teamName: team.name,
                userId: userId,
                username: user.username,
                challengeId: challenge.id,
                challengeTitle: challenge.title,
                categoryName: challenge.category.name,
                points: TARGET_SOLVE_POINTS,
                isFirstBlood: true,
                createdAt: solve.solvedAt // Backdate to solve time if possible? Or now? 
                // Using 'now' ensures it appears at top of feed, 
                // using 'solvedAt' fixes history. User probably wants to See it now.
                // Let's use 'now' so they see the update effectively.
            }
        });

        // Notification for First Blood (Separate from achievement)
        await prisma.notification.create({
            data: {
                userId: userId,
                type: "FIRST_BLOOD",
                title: "🩸 First Blood!",
                message: `Your team claimed First Blood on ${challenge.title}! +${TARGET_SOLVE_POINTS} points.`,
            }
        });
        console.log("✅ First Blood logs created.");
    }

    console.log("\nFix Complete. Team Xera should now have full points and recognition.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
