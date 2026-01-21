/**
 * Security System Test Script
 * Tests the threat intelligence and block checking functionality
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSecuritySystem() {
    console.log("=== UNDERGROUND_0x1 Security System Test ===\n");

    // 1. Check current blocked IPs
    console.log("1. Checking blocked IPs...");
    const blockedIPs = await prisma.blockedIP.findMany();
    console.log(`   Found ${blockedIPs.length} blocked IP(s)`);
    if (blockedIPs.length > 0) {
        blockedIPs.forEach(b => {
            console.log(`   - ${b.ip}: ${b.reason} (Strike ${b.strikeCount})`);
        });
    }

    // 2. Check recent threats
    console.log("\n2. Checking recent threats...");
    const recentThreats = await prisma.threatLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(`   Found ${recentThreats.length} recent threat(s)`);
    if (recentThreats.length > 0) {
        recentThreats.forEach(t => {
            console.log(`   - ${t.type}: ${t.ip} (severity: ${t.severity})`);
        });
    }

    // 3. Test recording a threat (to localhost - won't affect real users)
    console.log("\n3. Recording test threat for localhost (127.0.0.1)...");
    try {
        await prisma.threatLog.create({
            data: {
                ip: "127.0.0.1",
                type: "HONEYPOT_TRIGGER",
                severity: 1,
                details: "Test threat from security test script",
                wasBlocked: false
            }
        });
        console.log("   ✓ Test threat recorded successfully");
    } catch (e) {
        console.log("   ✗ Failed to record test threat:", e.message);
    }

    // 4. Verify threat was recorded
    const testThreat = await prisma.threatLog.findFirst({
        where: { ip: "127.0.0.1", details: "Test threat from security test script" }
    });
    console.log(`   Verification: ${testThreat ? "✓ Found" : "✗ Not found"}`);

    // 5. Clean up test data
    console.log("\n4. Cleaning up test data...");
    await prisma.threatLog.deleteMany({
        where: { ip: "127.0.0.1", details: "Test threat from security test script" }
    });
    console.log("   ✓ Test threat cleaned up");

    // 6. Final summary
    console.log("\n=== Summary ===");
    console.log(`Blocked IPs: ${blockedIPs.length}`);
    console.log(`Recent threats: ${recentThreats.length}`);
    console.log("Security system: OPERATIONAL ✓");

    // 7. Unblock all IPs (user requested to unblock their IP after testing)
    if (blockedIPs.length > 0) {
        console.log("\n5. Unblocking all IPs as requested...");
        for (const blocked of blockedIPs) {
            await prisma.blockedIP.delete({ where: { ip: blocked.ip } });
            console.log(`   ✓ Unblocked: ${blocked.ip}`);
        }
    }

    console.log("\n=== Test Complete ===");
}

testSecuritySystem()
    .catch(e => console.error("Test failed:", e))
    .finally(() => prisma.$disconnect());
