// Database investigation script - check points, solves, achievements
// Run with: npx tsx prisma/investigate-db.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function investigate() {
    console.log("🔍 DATABASE INVESTIGATION\n");
    console.log("=".repeat(70));

    // 1. Get all teams with their data
    console.log("\n📊 TEAMS OVERVIEW:");
    console.log("-".repeat(70));

    const teams = await prisma.team.findMany({
        include: {
            members: {
                select: { id: true, username: true, role: true, totalPoints: true }
            },
            solves: {
                include: {
                    challenge: { select: { title: true, points: true } }
                }
            }
        }
    });

    for (const team of teams) {
        console.log(`\nTeam: ${team.name}`);
        console.log(`  Total Points: ${team.totalPoints}`);
        console.log(`  Solved Count: ${team.solvedCount}`);
        console.log(`  Members:`);
        for (const m of team.members) {
            console.log(`    - ${m.username} (${m.role}) - ${m.totalPoints} pts`);
        }

        // Calculate expected points from solves
        let expectedSolvePoints = 0;
        console.log(`  Solves:`);
        for (const s of team.solves) {
            console.log(`    - ${s.challenge.title}: ${s.points} pts ${s.isFirstBlood ? '🩸 FIRST BLOOD' : ''}`);
            expectedSolvePoints += s.points;
        }
        console.log(`  Expected from solves: ${expectedSolvePoints}`);
    }

    // 2. Check achievements
    console.log("\n\n🏆 ACHIEVEMENTS OVERVIEW:");
    console.log("-".repeat(70));

    const userAchievements = await prisma.userAchievement.findMany({
        include: {
            user: { select: { username: true } },
            achievement: { select: { name: true, points: true } }
        }
    });

    const achievementsByUser: Record<string, { name: string; total: number; achievements: string[] }> = {};

    for (const ua of userAchievements) {
        if (!achievementsByUser[ua.user.username]) {
            achievementsByUser[ua.user.username] = { name: ua.user.username, total: 0, achievements: [] };
        }
        achievementsByUser[ua.user.username].achievements.push(`${ua.achievement.name} (+${ua.achievement.points})`);
        achievementsByUser[ua.user.username].total += ua.achievement.points;
    }

    for (const [username, data] of Object.entries(achievementsByUser)) {
        console.log(`\n${username}:`);
        console.log(`  Achievement Points Total: ${data.total}`);
        for (const a of data.achievements) {
            console.log(`    - ${a}`);
        }
    }

    // 3. Check challenge solveCount vs actual solves
    console.log("\n\n📈 CHALLENGE SOLVE COUNTS:");
    console.log("-".repeat(70));

    const challenges = await prisma.challenge.findMany({
        include: {
            solves: {
                include: { team: { select: { name: true } } },
                orderBy: { solvedAt: 'asc' }
            }
        }
    });

    for (const c of challenges) {
        const actualSolves = c.solves.length;
        const storedCount = c.solveCount;
        const mismatch = actualSolves !== storedCount ? '⚠️ MISMATCH!' : '✅';

        console.log(`\n${c.title} (${c.points} pts):`);
        console.log(`  Stored solveCount: ${storedCount}`);
        console.log(`  Actual solves: ${actualSolves} ${mismatch}`);

        if (c.solves.length > 0) {
            console.log(`  First solver: ${c.solves[0].team.name} - isFirstBlood: ${c.solves[0].isFirstBlood}`);
            if (!c.solves[0].isFirstBlood) {
                console.log(`  ⚠️ First solver doesn't have first blood flag!`);
            }
        }

        for (const s of c.solves) {
            console.log(`    - ${s.team.name}: ${s.points} pts, FB: ${s.isFirstBlood}, at ${s.solvedAt}`);
        }
    }

    // 4. Verify team point totals
    console.log("\n\n✅ POINT VERIFICATION:");
    console.log("-".repeat(70));

    for (const team of teams) {
        const solvePoints = team.solves.reduce((sum, s) => sum + s.points, 0);

        // Get achievement points for team members
        const memberIds = team.members.map(m => m.id);
        const teamAchievements = await prisma.userAchievement.findMany({
            where: { userId: { in: memberIds } },
            include: { achievement: { select: { points: true } } }
        });
        const achievementPoints = teamAchievements.reduce((sum, a) => sum + a.achievement.points, 0);

        const expectedTotal = solvePoints + achievementPoints;
        const storedTotal = team.totalPoints;
        const diff = storedTotal - expectedTotal;

        console.log(`\nTeam: ${team.name}`);
        console.log(`  Solve points: ${solvePoints}`);
        console.log(`  Achievement points: ${achievementPoints}`);
        console.log(`  Expected total: ${expectedTotal}`);
        console.log(`  Stored total: ${storedTotal}`);

        if (diff !== 0) {
            console.log(`  ⚠️ DISCREPANCY: ${diff > 0 ? '+' : ''}${diff} points!`);
        } else {
            console.log(`  ✅ Points match!`);
        }
    }

    console.log("\n\n" + "=".repeat(70));
    console.log("Investigation complete!");
}

investigate()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
