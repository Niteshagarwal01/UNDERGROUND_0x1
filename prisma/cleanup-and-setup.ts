/**
 * Database Cleanup and Setup Script
 * - Deletes test teams (test1, test2)
 * - Adds Steganography category
 * 
 * Run with: npx ts-node prisma/cleanup-and-setup.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔧 Starting database cleanup and setup...\n");

    // ============================================
    // 1. Delete test teams
    // ============================================
    console.log("📋 Step 1: Deleting test teams...");

    const teamsToDelete = ["test1", "test2"];

    for (const teamName of teamsToDelete) {
        const team = await prisma.team.findFirst({
            where: {
                name: {
                    equals: teamName,
                    mode: "insensitive"
                }
            },
            include: {
                members: true,
                solves: true,
                submissions: true,
                joinRequests: true,
                certificates: true,
            },
        });

        if (team) {
            console.log(`  Found team: ${team.name} (${team.id})`);
            console.log(`    - Members: ${team.members.length}`);
            console.log(`    - Solves: ${team.solves.length}`);
            console.log(`    - Submissions: ${team.submissions.length}`);

            // Update users to remove team association
            await prisma.user.updateMany({
                where: { teamId: team.id },
                data: { teamId: null, isTeamLeader: false },
            });
            console.log(`    - Unlinked ${team.members.length} members`);

            // Delete related records
            await prisma.solve.deleteMany({ where: { teamId: team.id } });
            await prisma.submission.deleteMany({ where: { teamId: team.id } });
            await prisma.joinRequest.deleteMany({ where: { teamId: team.id } });
            await prisma.certificate.deleteMany({ where: { teamId: team.id } });

            // Delete the team
            await prisma.team.delete({ where: { id: team.id } });
            console.log(`    ✅ Deleted team: ${teamName}`);
        } else {
            console.log(`  ⏭️  Team not found: ${teamName}`);
        }
    }

    // ============================================
    // 2. Add Steganography category
    // ============================================
    console.log("\n📋 Step 2: Adding Steganography category...");

    const existingSteg = await prisma.category.findFirst({
        where: {
            OR: [
                { slug: "stego" },
                { slug: "steganography" },
                { name: { contains: "Stego", mode: "insensitive" } },
            ],
        },
    });

    if (existingSteg) {
        console.log(`  ⏭️  Steganography category already exists: ${existingSteg.name}`);
    } else {
        // Get the current max order
        const maxCategory = await prisma.category.findFirst({
            orderBy: { order: "desc" },
            select: { order: true },
        });
        const newOrder = (maxCategory?.order || 0) + 1;

        const stegoCategory = await prisma.category.create({
            data: {
                name: "Steganography",
                slug: "stego",
                description: "Uncover hidden data concealed within images, audio, video, and text files.",
                icon: "Image",
                color: "#a855f7",
                order: newOrder,
            },
        });
        console.log(`  ✅ Created Steganography category (order: ${newOrder})`);
        console.log(`     ID: ${stegoCategory.id}`);
    }

    // ============================================
    // 3. List all current categories
    // ============================================
    console.log("\n📋 Current Categories:");
    const categories = await prisma.category.findMany({
        orderBy: { order: "asc" },
        include: { _count: { select: { challenges: true } } },
    });

    for (const cat of categories) {
        console.log(`  ${cat.order}. ${cat.name} (${cat.slug}) - ${cat._count.challenges} challenges`);
    }

    console.log("\n✨ Database cleanup and setup complete!");
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
