import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function fixInviteCodes() {
    console.log("🔧 Fixing invite codes for all teams...\n");

    try {
        const teams = await prisma.team.findMany({
            select: { id: true, name: true, inviteCode: true },
        });

        console.log(`Found ${teams.length} teams\n`);

        for (const team of teams) {
            // Generate a unique invite code
            let newInviteCode = "";
            let isUnique = false;
            let attempts = 0;

            while (!isUnique && attempts < 10) {
                // Generate a random 8-character code
                newInviteCode = randomBytes(4).toString("hex").toUpperCase();

                // Check if it's unique
                const existing = await prisma.team.findUnique({
                    where: { inviteCode: newInviteCode },
                });

                if (!existing) {
                    isUnique = true;
                } else {
                    attempts++;
                }
            }

            if (!isUnique) {
                console.error(`❌ Failed to generate unique code for team: ${team.name}`);
                continue;
            }

            // Update the team with new invite code
            await prisma.team.update({
                where: { id: team.id },
                data: { inviteCode: newInviteCode },
            });

            console.log(`✅ ${team.name}: ${team.inviteCode} → ${newInviteCode}`);
        }

        console.log("\n✨ All invite codes have been fixed!");
    } catch (error) {
        console.error("❌ Error fixing invite codes:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixInviteCodes();

