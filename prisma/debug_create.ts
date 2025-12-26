import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "techniteshgamer@gmail.com";
    // Fake Clerk ID for testing
    const clerkId = "user_TEST_12345678";
    const username = "TechniteshGamer";

    console.log(`Attempting to create user: ${email}`);

    try {
        const user = await prisma.user.create({
            data: {
                clerkId,
                email,
                username,
                role: "USER" // Explicitly setting it, though it has default
            }
        });
        console.log("User Created Successfully:", user);
    } catch (e) {
        console.error("Creation Failed:", e);
    }
}

main()
    .catch((e) => console.error("Error:", e))
    .finally(async () => await prisma.$disconnect());
