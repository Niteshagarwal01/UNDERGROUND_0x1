import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const targetEmail = process.env.ADMIN_EMAIL || "musicniteshagarwal@gmail.com";
    const targetTeamName = "SharpX";

    console.log(`🚀 Starting Admin Promotion Protocol...`);

    // 1. Promote the specific user
    const user = await prisma.user.findFirst({
        where: { email: targetEmail },
    });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
        });
        console.log(`✅ Promoted User: ${user.username} (${user.email}) to ADMIN`);
    } else {
        console.log(`⚠️ User with email ${targetEmail} not found.`);
    }

    // 2. Promote the entire team
    const team = await prisma.team.findUnique({
        where: { name: targetTeamName },
        include: { members: true },
    });

    if (team) {
        console.log(`\n� Found Team: ${team.name} with ${team.members.length} members.`);

        // Update all members
        const updateResult = await prisma.user.updateMany({
            where: { teamId: team.id },
            data: { role: "ADMIN" },
        });

        console.log(`✅ Promoted ${updateResult.count} team members to ADMIN.`);
    } else {
        console.log(`⚠️ Team '${targetTeamName}' not found.`);
    }
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
