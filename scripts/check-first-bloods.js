
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- FIRST BLOODS REGISTRY ---');

    const firstBloods = await prisma.solve.findMany({
        where: { isFirstBlood: true },
        include: {
            team: true,
            challenge: true
        },
        orderBy: { solvedAt: 'asc' }
    });

    console.log(`Total First Bloods: ${firstBloods.length}`);

    if (firstBloods.length === 0) {
        console.log("No first bloods recorded yet.");
    } else {
        firstBloods.forEach((fb, i) => {
            console.log(`${i + 1}. [${fb.challenge.title}] solved by [${fb.team.name}] (+${fb.points} pts)`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
