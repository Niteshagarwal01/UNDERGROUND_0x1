// Script to check Shadow_br0k3rs team data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeamData() {
    try {
        // Find the Shadow_br0k3rs team
        const team = await prisma.team.findFirst({
            where: {
                name: {
                    contains: 'Sh4d0w',
                    mode: 'insensitive'
                }
            },
            include: {
                members: {
                    select: {
                        id: true,
                        username: true,
                        totalPoints: true,
                        solvedCount: true
                    }
                },
                solves: {
                    include: {
                        challenge: {
                            select: {
                                title: true,
                                points: true,
                                category: { select: { name: true, slug: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!team) {
            console.log('Team not found!');
            return;
        }

        console.log('\n=== TEAM DATA ===');
        console.log(`Name: ${team.name}`);
        console.log(`ID: ${team.id}`);
        console.log(`Total Points: ${team.totalPoints}`);
        console.log(`Solved Count: ${team.solvedCount}`);

        console.log('\n=== MEMBERS ===');
        for (const member of team.members) {
            console.log(`- ${member.username}: ${member.totalPoints} pts, ${member.solvedCount} solves`);

            // Check achievements for this member
            const achievements = await prisma.userAchievement.findMany({
                where: { userId: member.id },
                include: {
                    achievement: {
                        select: {
                            name: true,
                            slug: true,
                            points: true,
                            category: true
                        }
                    }
                }
            });

            if (achievements.length > 0) {
                console.log('  Achievements:');
                for (const ua of achievements) {
                    console.log(`    - ${ua.achievement.name} (${ua.achievement.slug}): +${ua.achievement.points} pts [${ua.achievement.category}]`);
                }
            }
        }

        console.log('\n=== SOLVES ===');
        let solvePointsTotal = 0;
        for (const solve of team.solves) {
            console.log(`- ${solve.challenge.title} (${solve.challenge.category.name}): +${solve.points} pts`);
            solvePointsTotal += solve.points;
        }
        console.log(`\nTotal from solves: ${solvePointsTotal} pts`);

        // Check reverse-master achievement
        const reverseMaster = await prisma.achievement.findUnique({
            where: { slug: 'reverse-master' }
        });
        console.log('\n=== REVERSE-MASTER ACHIEVEMENT ===');
        if (reverseMaster) {
            console.log(`Points: ${reverseMaster.points}`);
        } else {
            console.log('Not found in database');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTeamData();
