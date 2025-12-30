
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Solve Count Fix...\n");

    const challenges = await prisma.challenge.findMany({
        include: {
            solves: {
                include: {
                    team: {
                        include: {
                            members: {
                                select: {
                                    role: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    for (const challenge of challenges) {
        let nonAdminSolves = 0;

        for (const solve of challenge.solves) {
            const hasAdminOrMod = solve.team.members.some(
                (m) => m.role === "ADMIN" || m.role === "MODERATOR"
            );

            if (!hasAdminOrMod) {
                nonAdminSolves++;
            }
        }

        if (challenge.solveCount !== nonAdminSolves) {
            console.log(
                `Fixing ${challenge.title}: ${challenge.solveCount} -> ${nonAdminSolves}`
            );
            await prisma.challenge.update({
                where: { id: challenge.id },
                data: { solveCount: nonAdminSolves },
            });
        } else {
            console.log(`Skipping ${challenge.title} (Already Correct: ${nonAdminSolves})`);
        }
    }

    console.log("\nFix Complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
