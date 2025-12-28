import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Icons are Lucide icon names (strings) that will be rendered in the UI
const achievements = [
    // First Blood achievements
    {
        slug: "first-blood",
        name: "First Blood",
        description: "Get your first first blood on any challenge",
        icon: "Droplet",
        category: "FIRST_BLOOD",
        requirement: 1,
        rarity: "COMMON"
    },
    {
        slug: "blood-hunter",
        name: "Blood Hunter",
        description: "Claim first blood on 3 different challenges",
        icon: "Sword",
        category: "FIRST_BLOOD",
        requirement: 3,
        rarity: "RARE"
    },
    {
        slug: "blood-lord",
        name: "Blood Lord",
        description: "Claim first blood on 5 different challenges",
        icon: "Crown",
        category: "FIRST_BLOOD",
        requirement: 5,
        rarity: "EPIC"
    },

    // Solve achievements
    {
        slug: "first-solve",
        name: "First Steps",
        description: "Solve your first challenge",
        icon: "Target",
        category: "SOLVES",
        requirement: 1,
        rarity: "COMMON"
    },
    {
        slug: "solver",
        name: "Problem Solver",
        description: "Solve 5 challenges",
        icon: "Unlock",
        category: "SOLVES",
        requirement: 5,
        rarity: "COMMON"
    },
    {
        slug: "elite-solver",
        name: "Elite Solver",
        description: "Solve 10 challenges",
        icon: "Gem",
        category: "SOLVES",
        requirement: 10,
        rarity: "RARE"
    },
    {
        slug: "master-solver",
        name: "Master Solver",
        description: "Solve 25 challenges",
        icon: "Trophy",
        category: "SOLVES",
        requirement: 25,
        rarity: "EPIC"
    },

    // Difficulty achievements
    {
        slug: "god-slayer",
        name: "God Slayer",
        description: "Complete a GOD_LEVEL challenge",
        icon: "Skull",
        category: "DIFFICULTY",
        requirement: 1,
        rarity: "EPIC"
    },
    {
        slug: "god-killer",
        name: "God Killer",
        description: "Complete 3 GOD_LEVEL challenges",
        icon: "Swords",
        category: "DIFFICULTY",
        requirement: 3,
        rarity: "LEGENDARY"
    },
    {
        slug: "hard-worker",
        name: "Hard Worker",
        description: "Complete 5 HARD challenges",
        icon: "Dumbbell",
        category: "DIFFICULTY",
        requirement: 5,
        rarity: "RARE"
    },

    // Category achievements
    {
        slug: "osint-master",
        name: "OSINT Master",
        description: "Complete all challenges in OSINT category",
        icon: "Search",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC"
    },
    {
        slug: "forensics-master",
        name: "Forensics Master",
        description: "Complete all challenges in Forensics category",
        icon: "FileSearch",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC"
    },
    {
        slug: "crypto-master",
        name: "Crypto Master",
        description: "Complete all challenges in Cryptography category",
        icon: "Lock",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC"
    },
    {
        slug: "reverse-master",
        name: "Reverse Master",
        description: "Complete all challenges in Reverse Engineering category",
        icon: "Cpu",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC"
    },
    {
        slug: "web-master",
        name: "Web Master",
        description: "Complete all challenges in Web Security category",
        icon: "Globe",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC"
    },

    // Special achievements
    {
        slug: "elite-operative",
        name: "Elite Operative",
        description: "Complete all challenges across all categories",
        icon: "Medal",
        category: "SPECIAL",
        requirement: 1,
        rarity: "LEGENDARY"
    },
    {
        slug: "speedrunner",
        name: "Speed Demon",
        description: "Solve 3 challenges within 1 hour",
        icon: "Zap",
        category: "STREAK",
        requirement: 3,
        rarity: "RARE"
    },
];

async function seedAchievements() {
    console.log("Seeding achievements...");

    for (const achievement of achievements) {
        const existing = await prisma.achievement.findUnique({
            where: { slug: achievement.slug }
        });

        if (existing) {
            // Update icon if changed
            await prisma.achievement.update({
                where: { slug: achievement.slug },
                data: { icon: achievement.icon }
            });
            console.log(`  ✓ ${achievement.name} updated`);
            continue;
        }

        await prisma.achievement.create({
            data: {
                slug: achievement.slug,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                category: achievement.category as any,
                requirement: achievement.requirement,
                rarity: achievement.rarity as any
            }
        });
        console.log(`  ✓ Created ${achievement.name}`);
    }

    console.log("✅ Achievements seeded successfully!");
}

seedAchievements()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
