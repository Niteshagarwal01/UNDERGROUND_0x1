
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const challenges = await prisma.challenge.findMany({
        where: {
            category: 'OSINT'
        }
    });
    console.log('OSINT Challenges:', JSON.stringify(challenges, null, 2));

    const allChallenges = await prisma.challenge.findMany();
    console.log('Total Challenges:', allChallenges.length);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
