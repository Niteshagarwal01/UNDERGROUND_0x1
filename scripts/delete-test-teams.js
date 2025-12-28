const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteTestTeams() {
    console.log('=== Deleting Test Teams ===\n');

    const testTeamNames = ['TestTeamA', 'TestTeamB'];

    for (const teamName of testTeamNames) {
        console.log(`Processing team: ${teamName}`);

        // Find the team
        const team = await prisma.team.findUnique({
            where: { name: teamName },
            include: {
                members: true,
                solves: true,
                submissions: true,
                joinRequests: true,
                certificates: true
            }
        });

        if (!team) {
            console.log(`  Team "${teamName}" not found, skipping...`);
            continue;
        }

        console.log(`  Found team with ID: ${team.id}`);
        console.log(`  Members: ${team.members.length}`);
        console.log(`  Solves: ${team.solves.length}`);
        console.log(`  Submissions: ${team.submissions.length}`);

        // Delete related records in order (respecting foreign key constraints)

        // 1. Delete solves
        if (team.solves.length > 0) {
            await prisma.solve.deleteMany({ where: { teamId: team.id } });
            console.log(`  Deleted ${team.solves.length} solves`);
        }

        // 2. Delete submissions
        if (team.submissions.length > 0) {
            await prisma.submission.deleteMany({ where: { teamId: team.id } });
            console.log(`  Deleted ${team.submissions.length} submissions`);
        }

        // 3. Delete join requests
        if (team.joinRequests.length > 0) {
            await prisma.joinRequest.deleteMany({ where: { teamId: team.id } });
            console.log(`  Deleted ${team.joinRequests.length} join requests`);
        }

        // 4. Delete certificates
        if (team.certificates.length > 0) {
            await prisma.certificate.deleteMany({ where: { teamId: team.id } });
            console.log(`  Deleted ${team.certificates.length} certificates`);
        }

        // 5. Delete user-related records for each member
        for (const member of team.members) {
            console.log(`  Processing member: ${member.email} (${member.clerkId})`);

            // Delete user's writeups
            await prisma.writeup.deleteMany({ where: { userId: member.id } });

            // Delete user's achievements
            await prisma.userAchievement.deleteMany({ where: { userId: member.id } });

            // Delete user's submissions (those not linked to team)
            await prisma.submission.deleteMany({ where: { userId: member.id } });

            // Delete user's feedback
            await prisma.feedback.deleteMany({ where: { userId: member.id } });

            // Delete user's join requests
            await prisma.joinRequest.deleteMany({ where: { userId: member.id } });

            // Delete the user
            await prisma.user.delete({ where: { id: member.id } });
            console.log(`  Deleted user: ${member.email}`);
        }

        // 6. Delete the team
        await prisma.team.delete({ where: { id: team.id } });
        console.log(`  Deleted team: ${teamName}\n`);
    }

    console.log('=== Deletion Complete ===');
    console.log('\nNote: The Clerk IDs for these test users were placeholders (clerk_userA, clerk_userB).');
    console.log('No actual Clerk users need to be deleted.\n');
}

deleteTestTeams()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
