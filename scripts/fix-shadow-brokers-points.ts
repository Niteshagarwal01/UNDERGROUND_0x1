// Script to fix Shadow_br0k3rs team points and remove wrongly awarded Reverse Master achievement
// Also creates announcement and personal notifications
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REVERSE_MASTER_POINTS = 100; // Points to deduct

async function fixTeamPoints() {
    try {
        console.log('🔧 Starting point correction for Shadow_br0k3rs team...\n');

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
                        email: true
                    }
                }
            }
        });

        if (!team) {
            console.log('❌ Team not found!');
            return;
        }

        console.log(`📋 Found team: ${team.name}`);
        console.log(`   Current total points: ${team.totalPoints}`);
        console.log(`   Members: ${team.members.map(m => m.username).join(', ')}\n`);

        // Find the reverse-master achievement
        const reverseMaster = await prisma.achievement.findUnique({
            where: { slug: 'reverse-master' }
        });

        if (!reverseMaster) {
            console.log('❌ reverse-master achievement not found in database!');
            return;
        }

        console.log(`🏆 Found Reverse Master achievement:`);
        console.log(`   ID: ${reverseMaster.id}`);
        console.log(`   Points: ${reverseMaster.points}\n`);

        // Find which user(s) have this achievement
        const usersWithAchievement = await prisma.userAchievement.findMany({
            where: {
                achievementId: reverseMaster.id,
                userId: {
                    in: team.members.map(m => m.id)
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        totalPoints: true
                    }
                }
            }
        });

        if (usersWithAchievement.length === 0) {
            console.log('⚠️ No team members have the Reverse Master achievement!');
            console.log('   The achievement may have already been removed.');
        } else {
            console.log(`🎯 Found ${usersWithAchievement.length} user(s) with Reverse Master achievement:`);
            for (const ua of usersWithAchievement) {
                console.log(`   - ${ua.user.username} (ID: ${ua.user.id})`);
                console.log(`     Current points: ${ua.user.totalPoints}`);
                console.log(`     New points after deduction: ${ua.user.totalPoints - REVERSE_MASTER_POINTS}`);
            }
            console.log('');

            // Remove the achievement and deduct points
            console.log('🗑️ Removing Reverse Master achievement...');

            for (const ua of usersWithAchievement) {
                // Delete the user achievement
                await prisma.userAchievement.delete({
                    where: { id: ua.id }
                });

                // Deduct points from user
                await prisma.user.update({
                    where: { id: ua.user.id },
                    data: {
                        totalPoints: {
                            decrement: REVERSE_MASTER_POINTS
                        }
                    }
                });

                console.log(`   ✓ Removed achievement from ${ua.user.username}`);
                console.log(`   ✓ Deducted ${REVERSE_MASTER_POINTS} points from ${ua.user.username}`);
            }

            // Deduct points from team
            await prisma.team.update({
                where: { id: team.id },
                data: {
                    totalPoints: {
                        decrement: REVERSE_MASTER_POINTS
                    }
                }
            });

            console.log(`   ✓ Deducted ${REVERSE_MASTER_POINTS} points from team ${team.name}`);
        }

        // Get updated team data
        const updatedTeam = await prisma.team.findUnique({
            where: { id: team.id }
        });

        console.log(`\n📊 Team ${team.name} updated points: ${updatedTeam?.totalPoints}\n`);

        // Create public announcement
        console.log('📢 Creating public announcement...');
        const announcement = await prisma.announcement.create({
            data: {
                title: '⚠️ Points Correction Notice',
                content: `**Point Adjustment for Token Forge Challenge**

After a review of the scoring system, we identified that the **Reverse Master Achievement** was incorrectly awarded for the Token Forge challenge solve. This achievement is reserved for completing all challenges in the Reverse Engineering category.

**Affected Team:** Shadow_br0k3rs

**Correction Details:**
- 🔻 Removed: Reverse Master Achievement (100 pts)
- ✅ Original Points: 500 pts
- ✅ Corrected Points: 400 pts

**Correct Breakdown:**
| Item | Points |
|------|--------|
| Token Forge Challenge | 300 pts |
| First Blood Bonus | 50 pts |
| First Blood Achievement | 25 pts |
| First Steps Achievement | 25 pts |
| **Total** | **400 pts** |

We apologize for any confusion this may have caused. The scoring system has been reviewed to prevent similar issues in the future.

— UNDERGROUND_0x1 Admin Team`,
                isPinned: false
            }
        });
        console.log(`   ✓ Announcement created (ID: ${announcement.id})\n`);

        // Send personal notifications to team members
        console.log('🔔 Sending personal notifications to team members...');

        for (const member of team.members) {
            await prisma.notification.create({
                data: {
                    userId: member.id,
                    type: 'ANNOUNCEMENT',
                    title: '⚠️ Points Adjustment for Your Team',
                    message: `Hi ${member.username}, your team's points have been adjusted. The Reverse Master achievement was incorrectly awarded and has been removed (-100 pts). Your team's corrected total is now 400 pts. We apologize for any confusion.`,
                    link: null
                }
            });
            console.log(`   ✓ Notification sent to ${member.username}`);
        }

        // Log this action in the audit log
        console.log('\n📝 Creating audit log entry...');
        await prisma.auditLog.create({
            data: {
                adminId: 'system',
                adminEmail: 'system@underground0x1.com',
                action: 'POINTS_CORRECTION',
                entityType: 'Team',
                entityId: team.id,
                details: JSON.stringify({
                    teamName: team.name,
                    reason: 'Removed wrongly awarded Reverse Master achievement',
                    pointsDeducted: REVERSE_MASTER_POINTS,
                    previousPoints: team.totalPoints,
                    newPoints: (updatedTeam?.totalPoints ?? team.totalPoints - REVERSE_MASTER_POINTS)
                })
            }
        });
        console.log('   ✓ Audit log entry created');

        console.log('\n✅ Point correction completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Team: ${team.name}`);
        console.log(`   - Previous points: ${team.totalPoints}`);
        console.log(`   - New points: ${updatedTeam?.totalPoints}`);
        console.log(`   - Points deducted: ${REVERSE_MASTER_POINTS}`);
        console.log(`   - Announcement created: Yes`);
        console.log(`   - Notifications sent: ${team.members.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixTeamPoints();
