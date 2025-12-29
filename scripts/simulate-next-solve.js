
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const challengeTitle = "Lost Token";
    console.log(`--- SIMULATION: Next Solve for "${challengeTitle}" ---`);

    // 1. Get Challenge
    const challenge = await prisma.challenge.findFirst({
        where: { title: { contains: challengeTitle, mode: 'insensitive' } }
    });

    if (!challenge) {
        console.log("Challenge not found.");
        return;
    }
    console.log(`Challenge ID: ${challenge.id}`);

    // 2. Count Non-Admin Solves (The core logic for First Blood)
    console.log("Counting existing non-admin solves...");

    const nonAdminSolveCount = await prisma.solve.count({
        where: {
            challengeId: challenge.id,
            team: {
                members: {
                    none: {
                        role: { in: ['ADMIN', 'MODERATOR'] }
                    }
                }
            }
        }
    });

    console.log(`Current Non-Admin Solve Count: ${nonAdminSolveCount}`);

    // 3. Evaluate First Blood Logic
    // Logic from route.ts: const isFirstBlood = nonAdminSolveCount === 0 && !isAdminOrMod;
    const isFirstBloodAvailable = nonAdminSolveCount === 0;

    console.log(`\n--- RESULT ---`);
    if (isFirstBloodAvailable) {
        console.log(`⚠️ FIRST BLOOD IS STILL AVAILABLE!`);
        console.log(`If a new team solves this now, they WILL get First Blood and +50 bonus.`);
    } else {
        console.log(`🔒 First Blood is GONE.`);
        console.log(`If a new team solves this now, they will get normal points (or 2nd/3rd place bonus if applicable).`);
        console.log(`They will NOT get the First Blood achievement.`);
    }

    // 4. List who has counted as a solver
    const solvers = await prisma.solve.findMany({
        where: {
            challengeId: challenge.id,
            team: {
                members: {
                    none: {
                        role: { in: ['ADMIN', 'MODERATOR'] }
                    }
                }
            }
        },
        include: { team: true }
    });

    console.log(`\nTeams counting towards this limit:`);
    solvers.forEach(s => console.log(`- ${s.team.name}`));

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
