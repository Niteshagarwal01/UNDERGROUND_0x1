
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const challengeName = "Lost Token";
    const teamName = "Xera";

    console.log(`--- Deep Scan Report: "${challengeName}" & Team "${teamName}" ---`);

    // 1. Get Challenge Details
    const challenge = await prisma.challenge.findFirst({
        where: { title: { contains: challengeName, mode: 'insensitive' } }
    });

    if (!challenge) {
        console.log("Challenge not found!");
        return;
    }
    console.log(`Challenge: ${challenge.title} (ID: ${challenge.id})`);
    console.log(`Base Points: ${challenge.points}`);
    console.log(`Official Solve Count: ${challenge.solveCount}`);

    // 2. List ALL Solves for this challenge in order
    console.log(`\n--- All Solves for "${challenge.title}" ---`);
    const solves = await prisma.solve.findMany({
        where: { challengeId: challenge.id },
        orderBy: { createdAt: 'asc' },
        include: {
            team: {
                include: {
                    members: {
                        select: { email: true, role: true }
                    }
                }
            }
        }
    });

    let xeraSolveIndex = -1;

    solves.forEach((s, index) => {
        const isXera = s.team.name.toLowerCase().includes(teamName.toLowerCase());
        if (isXera) xeraSolveIndex = index;

        // Check if team has admin/mod
        const hasAdmin = s.team.members.some(m => m.role === 'ADMIN' || m.role === 'MODERATOR');

        console.log(`${index + 1}. Team: ${s.team.name} ${hasAdmin ? '[ADMIN/MOD]' : ''}`);
        console.log(`   - Points Awarded: ${s.points}`);
        console.log(`   - Bonus Amount: ${s.points - challenge.points}`);
        console.log(`   - Is First Blood: ${s.isFirstBlood}`);
        console.log(`   - Created At: ${s.createdAt}`);
    });

    // 3. Analyze Team Xera Achievements
    console.log(`\n--- Achievements for Team "${teamName}" ---`);
    const xeraTeam = await prisma.team.findFirst({
        where: { name: { contains: teamName, mode: 'insensitive' } },
        include: { members: true }
    });

    if (xeraTeam) {
        for (const member of xeraTeam.members) {
            const userAchievements = await prisma.userAchievement.findMany({
                where: { userId: member.id },
                include: { achievement: true }
            });

            if (userAchievements.length > 0) {
                console.log(`User: ${member.email}`);
                userAchievements.forEach(ua => {
                    console.log(`   - ${ua.achievement.name} (+${ua.achievement.points} pts)`);
                });
            }
        }
    }

    // 4. Summary of Discrepancy
    console.log(`\n--- Summary Analysis ---`);
    if (xeraSolveIndex !== -1) {
        const xeraSolve = solves[xeraSolveIndex];
        console.log(`Xera was solve #${xeraSolveIndex + 1}.`);
        console.log(`Received: ${xeraSolve.points} pts.`);

        // Calculate what they wanted
        // If they were #1 non-admin:
        // Base: 300
        // Bonus (1st place): 50
        // First Blood Achievement: 25
        // First Step Achievement: 25
        // Total Expected: 400

        const currentTotal = xeraSolve.points; // 330
        // PlusAchievements
        // (We'll verify achievements from step 3)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
