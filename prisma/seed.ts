import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Category data for seeding (challenges will be added via admin)
const categoriesData = [
    {
        name: "OSINT",
        slug: "osint",
        description: "Open-source intelligence from public records, archives, and geospatial data",
        icon: "Search",
        color: "#facc15",
        order: 1,
    },
    {
        name: "Forensics",
        slug: "forensics",
        description: "Digital forensics on operational artifacts and industrial control data",
        icon: "FileSearch",
        color: "#facc15",
        order: 2,
    },
    {
        name: "Cryptography",
        slug: "crypto",
        description: "Cryptographic analysis with metro-derived key systems",
        icon: "Lock",
        color: "#facc15",
        order: 3,
    },
    {
        name: "Reverse Engineering",
        slug: "reversing",
        description: "Binary analysis of validation systems and embedded firmware",
        icon: "Cpu",
        color: "#facc15",
        order: 4,
    },
    {
        name: "Web Security",
        slug: "web",
        description: "Business logic vulnerabilities in simulated internal systems",
        icon: "Globe",
        color: "#facc15",
        order: 5,
    },
];

async function seed() {
    console.log("🌱 Seeding database...\n");
    console.log("⚠️  This will ONLY delete challenges and categories.");
    console.log("✅ Your teams and users will be PRESERVED.\n");

    // First, delete challenge-related data only
    console.log("Clearing challenge-related data...");

    // Delete submissions (references challenges)
    const submissionCount = await prisma.submission.count();
    if (submissionCount > 0) {
        await prisma.submission.deleteMany();
        console.log(`  Deleted ${submissionCount} submissions`);
    }

    // Delete solves (references challenges)
    const solveCount = await prisma.solve.count();
    if (solveCount > 0) {
        await prisma.solve.deleteMany();
        console.log(`  Deleted ${solveCount} solves`);
    }

    // Delete challenge files
    await prisma.challengeFile.deleteMany();

    // Delete hints
    await prisma.hint.deleteMany();

    // Delete challenges
    const challengeCount = await prisma.challenge.count();
    if (challengeCount > 0) {
        await prisma.challenge.deleteMany();
        console.log(`  Deleted ${challengeCount} challenges`);
    }

    // Delete categories (but we'll recreate them)
    await prisma.category.deleteMany();

    // Reset team points and solve counts (since challenges are gone)
    console.log("\nResetting team stats (challenges deleted)...");
    await prisma.team.updateMany({
        data: {
            totalPoints: 0,
            solvedCount: 0,
        }
    });

    // Reset user points and solve counts
    await prisma.user.updateMany({
        data: {
            totalPoints: 0,
            solvedCount: 0,
        }
    });

    // Create categories only (challenges added via admin panel)
    console.log("\nCreating categories...");
    for (const catData of categoriesData) {
        console.log(`  Creating: ${catData.name}`);

        await prisma.category.create({
            data: {
                name: catData.name,
                slug: catData.slug,
                description: catData.description,
                icon: catData.icon,
                color: catData.color,
                order: catData.order,
            },
        });
    }

    // Summary
    const teamCount = await prisma.team.count();
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();

    console.log("\n✅ Seeding complete!");
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Challenges: 0 (add via admin panel)`);
    console.log(`   Teams preserved: ${teamCount}`);
    console.log(`   Users preserved: ${userCount}`);
    console.log("\n💡 Tip: Go to /admin/challenges to add new challenges.");
}

seed()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
