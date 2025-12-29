// Script to automatically fix all missing first bloods
// Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/fix-first-bloods.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFirstBloods() {
    console.log("🔍 Checking for missing first bloods...\n");

    // Get all challenges with their solves ordered by time
    const challenges = await prisma.challenge.findMany({
        where: { isActive: true },
        include: {
            solves: {
                orderBy: { solvedAt: "asc" },
                include: {
                    team: { select: { name: true } }
                }
            }
        }
    });

    let fixedCount = 0;

    for (const challenge of challenges) {
        if (challenge.solves.length === 0) continue;

        const firstSolve = challenge.solves[0];

        // Check if first solve is marked as first blood
        if (!firstSolve.isFirstBlood) {
            console.log(`❌ Missing first blood for "${challenge.title}"`);
            console.log(`   First solver: ${firstSolve.team.name} at ${firstSolve.solvedAt}`);

            // Fix it
            await prisma.solve.update({
                where: { id: firstSolve.id },
                data: {
                    isFirstBlood: true,
                    firstBloodId: challenge.id
                }
            });

            console.log(`   ✅ Fixed!\n`);
            fixedCount++;
        } else {
            console.log(`✅ "${challenge.title}" - First blood: ${firstSolve.team.name}`);
        }
    }

    console.log(`\n🎯 Fixed ${fixedCount} missing first bloods`);
}

fixFirstBloods()
    .then(() => {
        console.log("\n✨ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
