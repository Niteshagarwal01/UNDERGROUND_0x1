
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("=== Achievement System Audit ===\n");

    // 1. List all Achievements
    const achievements = await prisma.achievement.findMany({
        orderBy: { requirement: 'asc' }
    });

    console.log("Defined Achievements:");
    console.table(achievements.map(a => ({
        Slug: a.slug,
        Name: a.name,
        Category: a.category,
        Req: a.requirement,
        Points: a.points,
        Rarity: a.rarity
    })));

    // 2. Audit Team Xera
    console.log("\n=== Team Xera Audit ===");
    const teamName = "Xera"; // Adjust if case-sensitive, assuming 'Xera' based on user prompt
    // In previous context it was 'Team Xera' or 'Xera'. Let's search broadly.
    const team = await prisma.team.findFirst({
        where: {
            name: { contains: "Xera", mode: "insensitive" }
        },
        include: {
            members: {
                include: {
                    achievements: {
                        include: { achievement: true }
                    }
                }
            },
            solves: {
                include: {
                    challenge: true
                }
            }
        }
    });

    if (!team) {
        console.log("Team Xera not found.");
        return;
    }

    console.log(`Team: ${team.name} (Total Points: ${team.totalPoints})`);

    console.log("\nSolves:");
    let calculatedSolvePoints = 0;
    for (const solve of team.solves) {
        console.log(`- ${solve.challenge.title}: ${solve.points} pts (includes bonus) [FirstBlood: ${solve.isFirstBlood}]`);
        calculatedSolvePoints += solve.points;
    }

    console.log(`\nTotal Points from Solves: ${calculatedSolvePoints}`);

    console.log("\nMember Achievements:");
    let totalAchievementPoints = 0;
    for (const member of team.members) {
        console.log(`\nMember: ${member.username}`);
        for (const ua of member.achievements) {
            console.log(`- ${ua.achievement.name} (${ua.achievement.category}): +${ua.achievement.points} pts`);
            // Achievement points are usually added to the user and team total.
            // In `achievements.ts`, we saw they align with:
            // await prisma.team.update({ data: { totalPoints: { increment: achievement.points } } });
            totalAchievementPoints += ua.achievement.points;
        }
    }

    console.log(`\nTotal Points from Achievements: ${totalAchievementPoints}`);

    const expectedTotal = calculatedSolvePoints + totalAchievementPoints;
    console.log(`\nExpected Total (Solves + Achievements): ${expectedTotal}`);
    console.log(`Actual Stored Total: ${team.totalPoints}`);

    if (expectedTotal !== team.totalPoints) {
        console.log(`⚠ DISCREPANCY: ${team.totalPoints - expectedTotal} points unaccounted for.`);
    } else {
        console.log("✅ Points tally matches.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
