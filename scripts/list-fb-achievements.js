
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DEFINED FIRST BLOOD ACHIEVEMENTS ---');

    const achievements = await prisma.achievement.findMany({
        where: { category: 'FIRST_BLOOD' },
        orderBy: { requirement: 'asc' }
    });

    if (achievements.length === 0) {
        console.log("No 'FIRST_BLOOD' achievements found in database.");
    } else {
        achievements.forEach(a => {
            console.log(`[${a.name}]`);
            console.log(`  - Slug: ${a.slug}`);
            console.log(`  - Points: ${a.points}`);
            console.log(`  - Requirement: ${a.requirement} First Blood(s)`);
            console.log(`  - Description: ${a.description}`);
            console.log('---');
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
