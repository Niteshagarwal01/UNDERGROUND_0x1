
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const teamName = "Xera";
    const team = await prisma.team.findFirst({
        where: { name: { contains: teamName, mode: 'insensitive' } },
        include: {
            members: true,
            solves: {
                include: {
                    challenge: true
                }
            }
        }
    });

    if (!team) {
        console.log(`Team "${teamName}" not found.`);
        return;
    }

    console.log(`Team: ${team.name} (ID: ${team.id})`);
    console.log(`Total Points (Team Record): ${team.totalPoints}`);
    console.log(`Solved Count: ${team.solvedCount}`);
    console.log('--- Solves ---');

    let calculatedScore = 0;

    for (const solve of team.solves) {
        console.log(`Challenge: ${solve.challenge.title} (Points: ${solve.challenge.points})`);
        console.log(`  - Solve Points Awarded: ${solve.points}`);
        console.log(`  - Is First Blood: ${solve.isFirstBlood}`);
        console.log(`  - Base Challenge Points: ${solve.challenge.points}`);

        // Calculate bonus
        const bonus = solve.points - solve.challenge.points;
        console.log(`  - Calculated Bonus: ${bonus}`);

        calculatedScore += solve.points;
        console.log('---');
    }

    console.log(`Calculated Score from Solves: ${calculatedScore}`);
    console.log(`Discrepancy: ${team.totalPoints - calculatedScore}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
