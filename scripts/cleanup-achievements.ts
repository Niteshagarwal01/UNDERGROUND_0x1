import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDuplicateAchievements() {
    console.log("Cleaning up duplicate achievements...");

    // Delete old solver achievements that were replaced AND duplicates
    const oldSlugs = ['solver-25', 'solver-50', 'solver', 'elite-solver', 'master-solver'];

    for (const slug of oldSlugs) {
        const existing = await prisma.achievement.findUnique({
            where: { slug }
        });

        if (existing) {
            // First remove any user associations
            await prisma.userAchievement.deleteMany({
                where: { achievementId: existing.id }
            });

            // Then delete the achievement
            await prisma.achievement.delete({
                where: { slug }
            });
            console.log(`  ✓ Deleted old achievement: ${slug}`);
        } else {
            console.log(`  - ${slug} not found (already deleted)`);
        }
    }

    // Verify current achievements
    const allAchievements = await prisma.achievement.findMany({
        select: { slug: true, name: true, category: true }
    });

    console.log(`\n✅ Current achievements (${allAchievements.length}):`);
    allAchievements.forEach(a => console.log(`  - ${a.slug}: ${a.name} [${a.category}]`));
}

cleanupDuplicateAchievements()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
