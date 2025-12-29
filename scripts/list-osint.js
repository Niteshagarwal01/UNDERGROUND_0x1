
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categorySlug = "osint";

    const category = await prisma.category.findFirst({
        where: {
            OR: [
                { slug: categorySlug },
                { name: { contains: "OSINT", mode: "insensitive" } }
            ]
        },
        include: {
            challenges: {
                orderBy: { points: 'asc' }
            }
        }
    });

    if (!category) {
        console.log("OSINT Category not found.");
        return;
    }

    console.log(`--- challenges in ${category.name} ---`);
    category.challenges.forEach((c, i) => {
        console.log(`${i + 1}. [${c.title}] (Points: ${c.points}, Slug: ${c.slug})`);
        console.log(`   Flag Hash: ${c.flagHash.substring(0, 10)}...`); // Just to check if we can reset it or need to know the flag
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
