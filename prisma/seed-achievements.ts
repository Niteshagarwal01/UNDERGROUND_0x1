import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Icons are Lucide icon names (strings) that will be rendered in the UI
// Points: COMMON=25-50, RARE=50-75, EPIC=75-100, LEGENDARY=100-150
const achievements = [
    // ========== FIRST BLOOD ACHIEVEMENTS ==========
    {
        slug: "first-blood",
        name: "First Blood",
        description: "Get your first First Blood on any challenge",
        icon: "Droplet",
        category: "FIRST_BLOOD",
        requirement: 1,
        rarity: "COMMON",
        points: 25
    },
    {
        slug: "blood-hunter",
        name: "Blood Hunter",
        description: "Claim First Blood on 3 different challenges",
        icon: "Sword",
        category: "FIRST_BLOOD",
        requirement: 3,
        rarity: "RARE",
        points: 50
    },
    {
        slug: "blood-lord",
        name: "Blood Lord",
        description: "Claim First Blood on 5 different challenges",
        icon: "Crown",
        category: "FIRST_BLOOD",
        requirement: 5,
        rarity: "EPIC",
        points: 75
    },
    {
        slug: "blood-legend",
        name: "Blood Legend",
        description: "Claim First Blood on 10 different challenges",
        icon: "Flame",
        category: "FIRST_BLOOD",
        requirement: 10,
        rarity: "LEGENDARY",
        points: 150
    },

    // ========== SOLVE COUNT ACHIEVEMENTS ==========
    {
        slug: "first-solve",
        name: "First Steps",
        description: "Solve your first challenge",
        icon: "Target",
        category: "SOLVES",
        requirement: 1,
        rarity: "COMMON",
        points: 25
    },
    {
        slug: "solver-5",
        name: "Problem Solver",
        description: "Solve 5 challenges",
        icon: "Unlock",
        category: "SOLVES",
        requirement: 5,
        rarity: "COMMON",
        points: 40
    },
    {
        slug: "solver-10",
        name: "Elite Solver",
        description: "Solve 10 challenges",
        icon: "Gem",
        category: "SOLVES",
        requirement: 10,
        rarity: "RARE",
        points: 60
    },
    {
        slug: "solver-20",
        name: "Master Solver",
        description: "Solve 20 challenges",
        icon: "Trophy",
        category: "SOLVES",
        requirement: 20,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "solver-27",
        name: "Unstoppable",
        description: "Solve all 27 challenges",
        icon: "Zap",
        category: "SOLVES",
        requirement: 27,
        rarity: "LEGENDARY",
        points: 150
    },

    // ========== DIFFICULTY ACHIEVEMENTS ==========
    {
        slug: "god-slayer",
        name: "God Slayer",
        description: "Complete a GOD_LEVEL challenge",
        icon: "Skull",
        category: "DIFFICULTY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "god-killer",
        name: "God Killer",
        description: "Complete 3 GOD_LEVEL challenges",
        icon: "Swords",
        category: "DIFFICULTY",
        requirement: 3,
        rarity: "LEGENDARY",
        points: 150
    },
    {
        slug: "hard-worker",
        name: "Hard Worker",
        description: "Complete 3 HARD challenges",
        icon: "Dumbbell",
        category: "DIFFICULTY",
        requirement: 3,
        rarity: "RARE",
        points: 60
    },
    {
        slug: "hard-master",
        name: "Hard Master",
        description: "Complete all 9 HARD challenges",
        icon: "Shield",
        category: "DIFFICULTY",
        requirement: 9,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "god-master",
        name: "God Master",
        description: "Complete all 9 GOD_LEVEL challenges",
        icon: "Crown",
        category: "DIFFICULTY",
        requirement: 9,
        rarity: "LEGENDARY",
        points: 150
    },

    // ========== CATEGORY MASTERY ACHIEVEMENTS ==========
    {
        slug: "osint-master",
        name: "OSINT Master",
        description: "Complete all challenges in OSINT category",
        icon: "Search",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "forensics-master",
        name: "Forensics Master",
        description: "Complete all challenges in Forensics category",
        icon: "FileSearch",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "crypto-master",
        name: "Crypto Master",
        description: "Complete all challenges in Cryptography category",
        icon: "Lock",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "stego-master",
        name: "Stego Master",
        description: "Complete all challenges in Steganography category",
        icon: "Image",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "reverse-master",
        name: "Reverse Master",
        description: "Complete all challenges in Reverse Engineering category",
        icon: "Cpu",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "web-master",
        name: "Web Master",
        description: "Complete all challenges in Web Security category",
        icon: "Globe",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "pwn-master",
        name: "Pwn Master",
        description: "Complete all challenges in Binary Exploitation category",
        icon: "Bug",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "misc-master",
        name: "Misc Master",
        description: "Complete all challenges in Miscellaneous category",
        icon: "Puzzle",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "networking-master",
        name: "Networking Master",
        description: "Complete all challenges in Networking category",
        icon: "Wifi",
        category: "CATEGORY",
        requirement: 1,
        rarity: "EPIC",
        points: 100
    },

    // ========== SPECIAL ACHIEVEMENTS ==========
    {
        slug: "elite-operative",
        name: "Elite Operative",
        description: "Complete all challenges across all categories",
        icon: "Medal",
        category: "SPECIAL",
        requirement: 1,
        rarity: "LEGENDARY",
        points: 150
    },
    {
        slug: "speedrunner",
        name: "Speed Demon",
        description: "Solve 3 challenges within 1 hour",
        icon: "Timer",
        category: "STREAK",
        requirement: 3,
        rarity: "RARE",
        points: 50
    },
    {
        slug: "consistent",
        name: "Consistent",
        description: "Solve at least 1 challenge every day for a week",
        icon: "Calendar",
        category: "STREAK",
        requirement: 7,
        rarity: "RARE",
        points: 75
    },
    {
        slug: "perfectionist",
        name: "Perfectionist",
        description: "Solve 5 challenges without any wrong submissions",
        icon: "CheckCircle",
        category: "SPECIAL",
        requirement: 5,
        rarity: "EPIC",
        points: 100
    },
    {
        slug: "night-owl",
        name: "Night Owl",
        description: "Solve a challenge between midnight and 5 AM",
        icon: "Moon",
        category: "SPECIAL",
        requirement: 1,
        rarity: "COMMON",
        points: 25
    },
    {
        slug: "completionist",
        name: "Completionist",
        description: "Earn 20 other achievements",
        icon: "Star",
        category: "SPECIAL",
        requirement: 20,
        rarity: "LEGENDARY",
        points: 150
    },
];

async function seedAchievements() {
    console.log("Seeding achievements...");

    for (const achievement of achievements) {
        const existing = await prisma.achievement.findUnique({
            where: { slug: achievement.slug }
        });

        if (existing) {
            // Update existing achievement
            await prisma.achievement.update({
                where: { slug: achievement.slug },
                data: {
                    icon: achievement.icon,
                    points: achievement.points,
                    name: achievement.name,
                    description: achievement.description,
                    rarity: achievement.rarity as any
                }
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
                points: achievement.points,
                category: achievement.category as any,
                requirement: achievement.requirement,
                rarity: achievement.rarity as any
            }
        });
        console.log(`  ✓ Created ${achievement.name}`);
    }

    console.log(`✅ ${achievements.length} achievements seeded successfully!`);
}

seedAchievements()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
