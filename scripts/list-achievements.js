
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const achievements = await prisma.achievement.findMany();
    console.log('--- Achievements ---');
    for (const a of achievements) {
        console.log(`- ${a.name} (${a.slug}): ${a.points} points [${a.category}]`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
