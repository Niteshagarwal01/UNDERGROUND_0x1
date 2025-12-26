import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { username: true, email: true, role: true, clerkId: true }
    });

    console.log("Current Admins:", users);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
