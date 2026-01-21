/**
 * UNDERGROUND_0x1 - Threat Intelligence System
 * 
 * Provides real-time threat scoring, auto-blocking with escalating timeouts,
 * and persistent threat tracking for the CTF platform.
 */

import prisma from "@/lib/prisma";

// ThreatType enum (matches Prisma schema)
export type ThreatType =
    | "INJECTION_ATTEMPT"
    | "BRUTE_FORCE"
    | "RATE_LIMIT_VIOLATION"
    | "HONEYPOT_TRIGGER"
    | "AUTOMATION_DETECTED"
    | "SUSPICIOUS_SOLVE"
    | "FLAG_SHARING"
    | "MULTI_ACCOUNT"
    | "ENUMERATION"
    | "BLOCKED_PATH"
    | "BLOCKED_AGENT";

// ============================================
// CONFIGURATION
// ============================================

// Whitelisted teams - excluded from all security checks
// Admin team + test teams for development
const WHITELISTED_TEAMS = [
    "sharpx",       // Admin team
    "team 1",       // Test team
    "devunderground" // Test team
];

// Block duration escalation (in milliseconds)
const BLOCK_DURATIONS = {
    1: 15 * 60 * 1000,        // Strike 1: 15 minutes
    2: 60 * 60 * 1000,        // Strike 2: 1 hour
    3: 24 * 60 * 60 * 1000,   // Strike 3: 24 hours
    4: null,                   // Strike 4+: Permanent (null = no expiry)
};

// Threat severity thresholds
const THREAT_SEVERITY = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
    SEVERE: 5,
};

// Auto-block thresholds (cumulative severity within 1 hour)
const AUTO_BLOCK_THRESHOLD = 10;
const THREAT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ============================================
// WHITELIST SYSTEM
// ============================================

/**
 * Check if a user belongs to an admin/whitelisted team
 */
export async function isWhitelistedUser(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                team: {
                    select: { name: true }
                }
            }
        });

        if (!user) return false;

        // Admin/Moderator roles are whitelisted
        if (user.role === "ADMIN" || user.role === "MODERATOR") {
            return true;
        }

        // Whitelisted team members
        if (user.team?.name && WHITELISTED_TEAMS.includes(user.team.name.toLowerCase())) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

/**
 * Check if an IP belongs to a whitelisted user
 * (Check recent submissions from this IP)
 */
export async function isWhitelistedIP(ip: string): Promise<boolean> {
    try {
        // Check if any admin/mod has submitted from this IP recently
        const recentSubmissions = await prisma.submission.findMany({
            where: {
                ipAddress: ip,
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            include: {
                user: {
                    include: {
                        team: { select: { name: true } }
                    }
                }
            },
            take: 5
        });

        for (const submission of recentSubmissions) {
            if (submission.user.role === "ADMIN" || submission.user.role === "MODERATOR") {
                return true;
            }
            if (submission.user.team?.name && WHITELISTED_TEAMS.includes(submission.user.team.name.toLowerCase())) {
                return true;
            }
        }

        return false;
    } catch {
        return false;
    }
}

// ============================================
// THREAT LOGGING
// ============================================

/**
 * Record a threat in the database
 */
export async function recordThreat(
    ip: string,
    type: ThreatType,
    severity: number,
    details?: string,
    userId?: string
): Promise<void> {
    try {
        // Don't log threats for whitelisted users
        if (userId && await isWhitelistedUser(userId)) {
            console.log(`[THREAT-INTEL] Skipping threat log for whitelisted user ${userId}`);
            return;
        }

        // Don't log threats for whitelisted IPs
        if (await isWhitelistedIP(ip)) {
            console.log(`[THREAT-INTEL] Skipping threat log for whitelisted IP ${ip}`);
            return;
        }

        await prisma.threatLog.create({
            data: {
                ip,
                userId,
                type,
                severity,
                details,
                wasBlocked: false,
            }
        });

        console.log(`[THREAT-INTEL] Logged threat: ${type} (severity: ${severity}) from IP ${ip}`);

        // Check if auto-block is needed
        await autoBlockIfNeeded(ip);
    } catch (error) {
        console.error("[THREAT-INTEL] Failed to record threat:", error);
    }
}

// ============================================
// THREAT SCORING
// ============================================

/**
 * Calculate a threat score for an IP (0-100)
 */
export async function calculateThreatScore(ip: string): Promise<number> {
    try {
        const windowStart = new Date(Date.now() - THREAT_WINDOW_MS);

        // Get recent threats for this IP
        const threats = await prisma.threatLog.findMany({
            where: {
                ip,
                createdAt: { gte: windowStart }
            }
        });

        if (threats.length === 0) return 0;

        // Calculate score based on severity and frequency
        let score = 0;
        for (const threat of threats) {
            score += threat.severity * 10;

            // Bonus points for certain threat types
            if (threat.type === "HONEYPOT_TRIGGER") score += 30;
            if (threat.type === "INJECTION_ATTEMPT") score += 20;
            if (threat.type === "FLAG_SHARING") score += 25;
        }

        // Cap at 100
        return Math.min(score, 100);
    } catch (error) {
        console.error("[THREAT-INTEL] Failed to calculate threat score:", error);
        return 0;
    }
}

// ============================================
// AUTO-BLOCKING
// ============================================

/**
 * Check if an IP should be auto-blocked based on recent threats
 */
export async function autoBlockIfNeeded(ip: string): Promise<{ blocked: boolean; duration?: string }> {
    try {
        // Check whitelist first
        if (await isWhitelistedIP(ip)) {
            return { blocked: false };
        }

        const windowStart = new Date(Date.now() - THREAT_WINDOW_MS);

        // Calculate cumulative severity
        const threats = await prisma.threatLog.findMany({
            where: {
                ip,
                createdAt: { gte: windowStart }
            }
        });

        const cumulativeSeverity = threats.reduce((sum, t) => sum + t.severity, 0);

        if (cumulativeSeverity < AUTO_BLOCK_THRESHOLD) {
            return { blocked: false };
        }

        // Block the IP
        return await blockIP(ip, "Auto-blocked: Threat threshold exceeded", Math.min(cumulativeSeverity / 5, 5));
    } catch (error) {
        console.error("[THREAT-INTEL] Auto-block check failed:", error);
        return { blocked: false };
    }
}

/**
 * Block an IP address with escalating duration
 */
export async function blockIP(
    ip: string,
    reason: string,
    severity: number = 1
): Promise<{ blocked: boolean; duration?: string }> {
    try {
        // Check whitelist
        if (await isWhitelistedIP(ip)) {
            console.log(`[THREAT-INTEL] Cannot block whitelisted IP: ${ip}`);
            return { blocked: false };
        }

        // Check if already blocked
        const existing = await prisma.blockedIP.findUnique({
            where: { ip }
        });

        let strikeCount = 1;
        if (existing) {
            strikeCount = existing.strikeCount + 1;
        }

        // Calculate block duration
        const durationMs = strikeCount >= 4
            ? BLOCK_DURATIONS[4]
            : BLOCK_DURATIONS[strikeCount as 1 | 2 | 3];

        const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

        // Upsert the block
        await prisma.blockedIP.upsert({
            where: { ip },
            update: {
                reason,
                severity,
                strikeCount,
                blockedAt: new Date(),
                expiresAt,
            },
            create: {
                ip,
                reason,
                severity,
                strikeCount,
                expiresAt,
            }
        });

        // Mark related threat logs as blocked
        await prisma.threatLog.updateMany({
            where: { ip, wasBlocked: false },
            data: { wasBlocked: true }
        });

        const durationLabel = durationMs
            ? `${Math.round(durationMs / 60000)} minutes`
            : "permanent";

        console.log(`[THREAT-INTEL] Blocked IP ${ip} for ${durationLabel} (strike ${strikeCount})`);

        return { blocked: true, duration: durationLabel };
    } catch (error) {
        console.error("[THREAT-INTEL] Failed to block IP:", error);
        return { blocked: false };
    }
}

/**
 * Unblock an IP address
 */
export async function unblockIP(ip: string): Promise<boolean> {
    try {
        await prisma.blockedIP.delete({
            where: { ip }
        });
        console.log(`[THREAT-INTEL] Unblocked IP: ${ip}`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if an IP is currently blocked
 */
export async function isIPBlocked(ip: string): Promise<{
    blocked: boolean;
    reason?: string;
    expiresAt?: Date | null;
    strikeCount?: number;
}> {
    try {
        const blocked = await prisma.blockedIP.findUnique({
            where: { ip }
        });

        if (!blocked) {
            return { blocked: false };
        }

        // Check if block has expired
        if (blocked.expiresAt && new Date() > blocked.expiresAt) {
            // Clean up expired block
            await prisma.blockedIP.delete({ where: { ip } });
            return { blocked: false };
        }

        return {
            blocked: true,
            reason: blocked.reason,
            expiresAt: blocked.expiresAt,
            strikeCount: blocked.strikeCount
        };
    } catch (error) {
        console.error("[THREAT-INTEL] Block check failed:", error);
        return { blocked: false };
    }
}

// ============================================
// ANALYTICS & MONITORING
// ============================================

/**
 * Get threat history for an IP
 */
export async function getIPThreatHistory(ip: string, limit: number = 50): Promise<{
    threats: Array<{
        id: string;
        type: ThreatType;
        severity: number;
        details: string | null;
        wasBlocked: boolean;
        createdAt: Date;
    }>;
    totalCount: number;
    threatScore: number;
}> {
    try {
        const [threats, totalCount, threatScore] = await Promise.all([
            prisma.threatLog.findMany({
                where: { ip },
                orderBy: { createdAt: "desc" },
                take: limit,
                select: {
                    id: true,
                    type: true,
                    severity: true,
                    details: true,
                    wasBlocked: true,
                    createdAt: true,
                }
            }),
            prisma.threatLog.count({ where: { ip } }),
            calculateThreatScore(ip)
        ]);

        return { threats, totalCount, threatScore };
    } catch (error) {
        console.error("[THREAT-INTEL] Failed to get threat history:", error);
        return { threats: [], totalCount: 0, threatScore: 0 };
    }
}

/**
 * Get security dashboard stats
 */
export async function getSecurityDashboardStats(): Promise<{
    activeBlocks: number;
    threatsLast24h: number;
    threatsLastHour: number;
    topThreatTypes: Array<{ type: ThreatType; count: number }>;
    recentThreats: Array<{
        ip: string;
        type: ThreatType;
        severity: number;
        createdAt: Date;
    }>;
}> {
    try {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

        const [activeBlocks, threatsLast24h, threatsLastHour, recentThreats] = await Promise.all([
            prisma.blockedIP.count({
                where: {
                    OR: [
                        { expiresAt: null }, // Permanent blocks
                        { expiresAt: { gt: now } } // Active temporary blocks
                    ]
                }
            }),
            prisma.threatLog.count({ where: { createdAt: { gte: last24h } } }),
            prisma.threatLog.count({ where: { createdAt: { gte: lastHour } } }),
            prisma.threatLog.findMany({
                where: { createdAt: { gte: last24h } },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: {
                    ip: true,
                    type: true,
                    severity: true,
                    createdAt: true,
                }
            })
        ]);

        // Group threats by type
        const threatsByType = await prisma.threatLog.groupBy({
            by: ["type"],
            where: { createdAt: { gte: last24h } },
            _count: true,
            orderBy: { _count: { type: "desc" } }
        });

        const topThreatTypes = threatsByType.map(t => ({
            type: t.type,
            count: t._count
        }));

        return {
            activeBlocks,
            threatsLast24h,
            threatsLastHour,
            topThreatTypes,
            recentThreats
        };
    } catch (error) {
        console.error("[THREAT-INTEL] Failed to get dashboard stats:", error);
        return {
            activeBlocks: 0,
            threatsLast24h: 0,
            threatsLastHour: 0,
            topThreatTypes: [],
            recentThreats: []
        };
    }
}

/**
 * Get all blocked IPs
 */
export async function getBlockedIPs(): Promise<Array<{
    ip: string;
    reason: string;
    severity: number;
    strikeCount: number;
    blockedAt: Date;
    expiresAt: Date | null;
}>> {
    try {
        const now = new Date();
        return await prisma.blockedIP.findMany({
            where: {
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } }
                ]
            },
            orderBy: { blockedAt: "desc" }
        });
    } catch (error) {
        console.error("[THREAT-INTEL] Failed to get blocked IPs:", error);
        return [];
    }
}

/**
 * Cleanup expired blocks (run periodically)
 */
export async function cleanupExpiredBlocks(): Promise<number> {
    try {
        const result = await prisma.blockedIP.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });
        if (result.count > 0) {
            console.log(`[THREAT-INTEL] Cleaned up ${result.count} expired blocks`);
        }
        return result.count;
    } catch (error) {
        console.error("[THREAT-INTEL] Failed to cleanup expired blocks:", error);
        return 0;
    }
}

// Export constants for use elsewhere
export { THREAT_SEVERITY };
