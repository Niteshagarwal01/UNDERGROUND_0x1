import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function promoteModerators() {
    const mainAdminEmail = process.env.ADMIN_EMAIL || "musicniteshagarwal@gmail.com";

    console.log("🔧 Promoting admin team members to MODERATOR...\n");

    try {
        // Get all teams that have admin members
        const teams = await prisma.team.findMany({
            include: {
                members: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        username: true,
                    },
                },
            },
        });

        // Find teams with admin members
        const adminTeams = teams.filter((team) =>
            team.members.some((member) => member.role === "ADMIN")
        );

        console.log(`Found ${adminTeams.length} admin team(s)\n`);

        let promotedCount = 0;

        for (const team of adminTeams) {
            console.log(`Team: ${team.name}`);

            // Promote all members except the main admin
            for (const member of team.members) {
                if (member.email !== mainAdminEmail && member.role !== "ADMIN") {
                    await prisma.user.update({
                        where: { id: member.id },
                        data: { role: "MODERATOR" },
                    });
                    console.log(`  ✅ Promoted ${member.username} (${member.email}) to MODERATOR`);
                    promotedCount++;
                } else if (member.email === mainAdminEmail) {
                    console.log(`  ⏭️  Skipped ${member.username} (main admin)`);
                } else if (member.role === "ADMIN") {
                    console.log(`  ⏭️  Skipped ${member.username} (already ADMIN)`);
                }
            }
            console.log();
        }

        console.log(`✨ Promoted ${promotedCount} user(s) to MODERATOR!`);
    } catch (error) {
        console.error("❌ Error promoting moderators:", error);
    } finally {
        await prisma.$disconnect();
    }
}

promoteModerators();

