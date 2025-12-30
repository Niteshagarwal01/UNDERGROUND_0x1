
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Team Audit...\n");

    const teams = await prisma.team.findMany({
        include: {
            members: true,
            solves: true,
        },
        orderBy: {
            totalPoints: "desc",
        },
    });

    console.log(
        "| Team Name | Members (Role) | Stored Solves | Actual Solves (DB) | Points | Is Admin/Mod Team? |"
    );
    console.log(
        "|---|---|---|---|---|---|"
    );

    for (const team of teams) {
        const memberDetails = team.members
            .map((m) => `${m.username} (${m.role})`)
            .join(", ");

        const hasAdminOrMod = team.members.some(
            (m) => m.role === "ADMIN" || m.role === "MODERATOR"
        );

        const actualSolves = team.solves.length;
        const adminTag = hasAdminOrMod ? "YES" : "NO";

        console.log(
            `| ${team.name.padEnd(20)} | ${memberDetails.padEnd(40)} | ${team.solvedCount.toString().padEnd(13)} | ${actualSolves.toString().padEnd(18)} | ${team.totalPoints.toString().padEnd(6)} | ${adminTag} |`
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
