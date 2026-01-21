/**
 * Security Threat Simulation Script
 * 
 * Simulates various threat types to test the security system
 * Run with: node scripts/simulate-threats.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Threat types matching the schema
const THREAT_TYPES = [
    'INJECTION_ATTEMPT',
    'BRUTE_FORCE',
    'RATE_LIMIT_VIOLATION',
    'HONEYPOT_TRIGGER',
    'AUTOMATION_DETECTED',
    'SUSPICIOUS_SOLVE',
    'FLAG_SHARING',
    'MULTI_ACCOUNT',
    'ENUMERATION',
    'BLOCKED_PATH',
    'BLOCKED_AGENT'
];

// Sample attacker IPs (fake)
const ATTACKER_IPS = [
    '45.33.32.156',
    '185.220.101.1',
    '104.244.76.13',
    '91.219.237.229',
    '198.98.51.189',
    '23.129.64.210',
    '171.25.193.25',
    '89.234.157.254'
];

// Sample attack details
const ATTACK_DETAILS = {
    'INJECTION_ATTEMPT': [
        "SQL injection attempt: ' OR 1=1 --",
        "XSS attempt: <script>alert(1)</script>",
        "NoSQL injection: {$gt: ''}",
        "Command injection: ; rm -rf /",
        "Template injection: {{constructor.constructor('return this')()}}"
    ],
    'BRUTE_FORCE': [
        "10 failed flag attempts in 60 seconds",
        "15 failed login attempts",
        "Rapid flag enumeration detected",
        "Password spray attack detected"
    ],
    'RATE_LIMIT_VIOLATION': [
        "100+ requests in 60 seconds",
        "API rate limit exceeded",
        "Submission spam detected"
    ],
    'HONEYPOT_TRIGGER': [
        "Accessed /api/honeypot/admin/backup",
        "Accessed /api/honeypot/wp-admin",
        "Accessed /api/honeypot/phpmyadmin",
        "Accessed /api/honeypot/flags"
    ],
    'AUTOMATION_DETECTED': [
        "Bot signature: Missing Accept header",
        "Bot signature: Scripted User-Agent",
        "Headless browser detected",
        "Selenium WebDriver detected"
    ],
    'SUSPICIOUS_SOLVE': [
        "GOD_LEVEL challenge solved in 15 seconds",
        "HARD challenge solved without viewing",
        "Impossible solve time detected"
    ],
    'FLAG_SHARING': [
        "Same IP submitted for 3 different teams",
        "Flag submitted from shared IP pool",
        "Cross-team flag correlation detected"
    ],
    'MULTI_ACCOUNT': [
        "IP linked to 2 different teams",
        "Same device fingerprint on multiple accounts",
        "Session overlap detected"
    ],
    'ENUMERATION': [
        "Sequential challenge ID probing",
        "User ID enumeration attempt",
        "Directory traversal attempt"
    ],
    'BLOCKED_PATH': [
        "Accessed /.env",
        "Accessed /.git/config",
        "Accessed /backup.sql"
    ],
    'BLOCKED_AGENT': [
        "SQLMap User-Agent detected",
        "Nikto scanner detected",
        "Burp Suite detected"
    ]
};

async function simulateThreats() {
    console.log("=== UNDERGROUND_0x1 Threat Simulation ===\n");
    console.log("This will create simulated threats for testing.\n");

    const threatsToCreate = [];

    // Create 30-50 random threats
    const numThreats = Math.floor(Math.random() * 20) + 30;
    console.log(`Creating ${numThreats} simulated threats...\n`);

    for (let i = 0; i < numThreats; i++) {
        const type = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)];
        const ip = ATTACKER_IPS[Math.floor(Math.random() * ATTACKER_IPS.length)];
        const details = ATTACK_DETAILS[type][Math.floor(Math.random() * ATTACK_DETAILS[type].length)];

        // Higher severity for more dangerous threats
        let severity = 1;
        if (type === 'HONEYPOT_TRIGGER' || type === 'INJECTION_ATTEMPT') severity = 5;
        else if (type === 'BRUTE_FORCE' || type === 'FLAG_SHARING') severity = 4;
        else if (type === 'AUTOMATION_DETECTED' || type === 'MULTI_ACCOUNT') severity = 3;
        else severity = Math.floor(Math.random() * 3) + 1;

        // Random time in the last 24 hours
        const createdAt = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);

        threatsToCreate.push({
            ip,
            type,
            severity,
            details,
            wasBlocked: severity >= 4,
            createdAt
        });
    }

    // Batch create threats
    await prisma.threatLog.createMany({
        data: threatsToCreate
    });

    console.log(`✓ Created ${threatsToCreate.length} threat logs\n`);

    // Create some blocked IPs
    console.log("Creating blocked IPs from high-severity threats...\n");

    const ipsToBlock = [...new Set(
        threatsToCreate
            .filter(t => t.severity >= 4)
            .map(t => t.ip)
    )];

    for (const ip of ipsToBlock.slice(0, 5)) {
        try {
            await prisma.blockedIP.upsert({
                where: { ip },
                update: {
                    strikeCount: { increment: 1 },
                    blockedAt: new Date()
                },
                create: {
                    ip,
                    reason: "Auto-blocked: Multiple high-severity threats",
                    severity: 4,
                    strikeCount: Math.floor(Math.random() * 3) + 1,
                    expiresAt: Math.random() > 0.3 ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
                }
            });
            console.log(`   ✓ Blocked IP: ${ip}`);
        } catch (e) {
            // IP might already be blocked
        }
    }

    // Summary
    console.log("\n=== Simulation Complete ===");

    const stats = await prisma.threatLog.groupBy({
        by: ['type'],
        _count: true,
        orderBy: { _count: { type: 'desc' } }
    });

    console.log("\nThreats by Type:");
    stats.forEach(s => {
        console.log(`   ${s.type}: ${s._count}`);
    });

    const blockedCount = await prisma.blockedIP.count();
    console.log(`\nTotal Blocked IPs: ${blockedCount}`);

    console.log("\nGo to /admin/security to see the results!");
}

// Cleanup function
async function cleanup() {
    console.log("Cleaning up simulated threats...");

    await prisma.threatLog.deleteMany({
        where: {
            ip: { in: ATTACKER_IPS }
        }
    });

    await prisma.blockedIP.deleteMany({
        where: {
            ip: { in: ATTACKER_IPS }
        }
    });

    console.log("✓ Cleanup complete");
}

// Run
const args = process.argv.slice(2);
if (args.includes('--cleanup')) {
    cleanup()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
} else {
    simulateThreats()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
