import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REQUIRED_CATEGORIES = [
    { name: "OSINT", slug: "osint", description: "Open Source Intelligence", icon: "Search" },
    { name: "Forensics", slug: "forensics", description: "Digital Forensics", icon: "FileSearch" },
    { name: "Cryptography", slug: "crypto", description: "Cryptography & Encryption", icon: "Lock" },
    { name: "Steganography", slug: "steganography", description: "Hidden Data Analysis", icon: "Image" },
    { name: "Reverse Engineering", slug: "reverse-engineering", description: "Binary Analysis", icon: "Cpu" },
    { name: "Web Security", slug: "web", description: "Web Exploitation", icon: "Globe" },
    { name: "Binary Exploitation", slug: "pwn", description: "Pwn Challenges", icon: "Bug" },
    { name: "Miscellaneous", slug: "misc", description: "Miscellaneous Challenges", icon: "Puzzle" },
    { name: "Networking", slug: "networking", description: "Network Analysis", icon: "Wifi" }
];

async function checkAndAddCategories() {
    console.log("Checking categories...\n");

    const existing = await prisma.category.findMany({
        select: { id: true, name: true, slug: true }
    });

    console.log("Current categories in DB:");
    existing.forEach(c => console.log(`  - ${c.slug}: ${c.name}`));

    const existingSlugs = new Set(existing.map(c => c.slug));
    const missing = REQUIRED_CATEGORIES.filter(c => !existingSlugs.has(c.slug));

    if (missing.length === 0) {
        console.log("\n✅ All 9 categories exist!");
    } else {
        console.log(`\n⚠️  Missing ${missing.length} categories:`);
        for (const cat of missing) {
            console.log(`  Creating/Updating: ${cat.slug} (${cat.name})`);
            try {
                await prisma.category.upsert({
                    where: { slug: cat.slug },
                    update: { icon: cat.icon, description: cat.description },
                    create: {
                        name: cat.name,
                        slug: cat.slug,
                        description: cat.description,
                        icon: cat.icon
                    }
                });
                console.log(`  ✓ Ensured ${cat.name}`);
            } catch (e: any) {
                console.log(`  ! Skipped ${cat.name}: ${e.message?.slice(0, 50)}`);
            }
        }
    }

    // Verify final list
    const final = await prisma.category.findMany({
        select: { name: true, slug: true },
        orderBy: { name: 'asc' }
    });
    console.log(`\n✅ Final categories (${final.length}):`);
    final.forEach((c, i) => console.log(`  ${i + 1}. ${c.slug}: ${c.name}`));
}

checkAndAddCategories()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
