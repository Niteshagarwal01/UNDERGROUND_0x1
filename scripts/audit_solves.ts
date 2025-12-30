
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Solve Count Audit...\n");

    const challenges = await prisma.challenge.findMany({
        include: {
            category: true,
            solves: {
                include: {
                    team: {
                        include: {
                            members: {
                                select: {
                                    role: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            category: {
                name: "asc",
            },
        },
    });

    console.log(
        "| Challenge Name | Stored Count | Total Solves (DB) | Non-Admin Solves | Admin Solves | Status |"
    );
    console.log(
        "|---|---|---|---|---|---|"
    );

    for (const challenge of challenges) {
        const storedCount = challenge.solveCount;
        const totalSolvesRecords = challenge.solves.length;

        let nonAdminSolves = 0;
        let adminSolves = 0;

        for (const solve of challenge.solves) {
            const hasAdminOrMod = solve.team.members.some(
                (m) => m.role === "ADMIN" || m.role === "MODERATOR"
            );

            if (hasAdminOrMod) {
                adminSolves++;
            } else {
                nonAdminSolves++;
            }
        }

        const isCorrect = storedCount === nonAdminSolves;
        const status = isCorrect ? "✅ OK" : "❌ MISMATCH";

        console.log(
            `| ${challenge.title.padEnd(30)} | ${storedCount.toString().padEnd(12)} | ${totalSolvesRecords.toString().padEnd(17)} | ${nonAdminSolves.toString().padEnd(16)} | ${adminSolves.toString().padEnd(12)} | ${status} |`
        );
    }

    console.log("\nAudit Complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
