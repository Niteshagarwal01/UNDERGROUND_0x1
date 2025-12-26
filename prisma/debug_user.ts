import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "techniteshgamer@gmail.com";
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            team: true,
        }
    });

    if (user) {
        console.log("User found:", user);
        console.log("User Role:", user.role);
    } else {
        console.log("User NOT found.");
    }
}

main()
    .catch((e) => console.error("Error:", e))
    .finally(async () => await prisma.$disconnect());
