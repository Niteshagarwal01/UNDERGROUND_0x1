/**
 * UNDERGROUND_0x1 - Competition Integrity System
 * 
 * Detects flag sharing, suspicious solve patterns, multi-account abuse,
 * and other competition integrity violations.
 */

import prisma from "@/lib/prisma";
import { recordThreat, ThreatType } from "@/lib/threat-intelligence";

// ============================================
// CONFIGURATION
// ============================================

// Whitelisted teams - same as threat-intelligence.ts
const WHITELISTED_TEAMS = [
    "sharpx",       // Admin team
    "team 1",       // Test team
    "devunderground" // Test team
];

// Minimum solve times by difficulty (in milliseconds)
// If solved faster than this, it's suspicious
const MIN_SOLVE_TIMES = {
    MEDIUM: 30 * 1000,      // 30 seconds
    HARD: 60 * 1000,        // 1 minute
    GOD_LEVEL: 120 * 1000,  // 2 minutes
};

// Flag sharing detection threshold
// If same IP submits correct flag for X+ different teams, flag it
const FLAG_SHARING_THRESHOLD = 2;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a team is whitelisted
 */
async function isWhitelistedTeam(teamId: string): Promise<boolean> {
    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { name: true }
        });

        if (!team) return false;
        return WHITELISTED_TEAMS.includes(team.name.toLowerCase());
    } catch {
        return false;
    }
}

/**
 * Get partial flag for comparison (first and last 4 chars)
 * We don't store full flags for security reasons
 */
function getPartialFlag(flag: string): string {
    if (flag.length < 12) return flag;
    return `${flag.slice(0, 6)}...${flag.slice(-4)}`;
}

// ============================================
// FLAG SHARING DETECTION
// ============================================

/**
 * Record a flag submission for integrity tracking
 */
export async function recordFlagSubmissionTrace(
    challengeId: string,
    teamId: string,
    ip: string,
    flag: string,
    solveTimeMs?: number
): Promise<void> {
    try {
        // Skip for whitelisted teams
        if (await isWhitelistedTeam(teamId)) {
            return;
        }

        await prisma.flagSubmissionTrace.create({
            data: {
                challengeId,
                teamId,
                ip,
                flagPartial: getPartialFlag(flag),
                solveTimeMs,
            }
        });
    } catch (error) {
        console.error("[INTEGRITY] Failed to record submission trace:", error);
    }
}

/**
 * Check for flag sharing patterns
 * Returns suspicious if same IP submitted for multiple different teams
 */
export async function checkFlagSharing(
    challengeId: string,
    teamId: string,
    ip: string
): Promise<{
    suspicious: boolean;
    reason?: string;
    sharedWith?: string[];
}> {
    try {
        // Skip for whitelisted teams
        if (await isWhitelistedTeam(teamId)) {
            return { suspicious: false };
        }

        // Find other teams that submitted from this IP for this challenge
        const otherTeamSubmissions = await prisma.flagSubmissionTrace.findMany({
            where: {
                challengeId,
                ip,
                teamId: { not: teamId }
            },
            select: {
                teamId: true
            },
            distinct: ['teamId']
        });

        if (otherTeamSubmissions.length >= FLAG_SHARING_THRESHOLD) {
            const sharedWith = otherTeamSubmissions.map(s => s.teamId);

            // Get team names for logging
            const teams = await prisma.team.findMany({
                where: { id: { in: sharedWith } },
                select: { name: true }
            });
            const teamNames = teams.map(t => t.name).join(", ");

            const reason = `Flag submitted from same IP as ${sharedWith.length} other team(s): ${teamNames}`;

            // Record threat
            await recordThreat(ip, "FLAG_SHARING", 4, reason);

            return { suspicious: true, reason, sharedWith };
        }

        return { suspicious: false };
    } catch (error) {
        console.error("[INTEGRITY] Flag sharing check failed:", error);
        return { suspicious: false };
    }
}

// ============================================
// SUSPICIOUS SOLVE DETECTION
// ============================================

/**
 * Check if a solve time is suspiciously fast
 */
export async function checkSuspiciousSolve(
    challengeId: string,
    difficulty: string,
    solveTimeMs: number,
    ip: string,
    teamId: string
): Promise<{
    suspicious: boolean;
    reason?: string;
}> {
    try {
        // Skip for whitelisted teams
        if (await isWhitelistedTeam(teamId)) {
            return { suspicious: false };
        }

        const minTime = MIN_SOLVE_TIMES[difficulty as keyof typeof MIN_SOLVE_TIMES];

        if (!minTime) {
            return { suspicious: false };
        }

        if (solveTimeMs < minTime) {
            const reason = `${difficulty} challenge solved in ${Math.round(solveTimeMs / 1000)}s (expected minimum: ${Math.round(minTime / 1000)}s)`;

            // Record threat with higher severity for harder challenges
            const severity = difficulty === "GOD_LEVEL" ? 4 : difficulty === "HARD" ? 3 : 2;
            await recordThreat(ip, "SUSPICIOUS_SOLVE", severity, reason);

            return { suspicious: true, reason };
        }

        return { suspicious: false };
    } catch (error) {
        console.error("[INTEGRITY] Suspicious solve check failed:", error);
        return { suspicious: false };
    }
}

// ============================================
// MULTI-ACCOUNT DETECTION
// ============================================

/**
 * Check if an IP is associated with multiple teams (potential multi-accounting)
 */
export async function checkMultiAccount(
    userId: string,
    ip: string,
    teamId: string
): Promise<{
    suspicious: boolean;
    reason?: string;
    linkedAccounts?: string[];
}> {
    try {
        // Skip for whitelisted teams
        if (await isWhitelistedTeam(teamId)) {
            return { suspicious: false };
        }

        // Find other teams that have submissions from this IP
        const otherTeams = await prisma.flagSubmissionTrace.findMany({
            where: {
                ip,
                teamId: { not: teamId }
            },
            select: {
                teamId: true
            },
            distinct: ['teamId']
        });

        if (otherTeams.length > 0) {
            const linkedTeamIds = otherTeams.map(t => t.teamId);

            // Get team names
            const teams = await prisma.team.findMany({
                where: { id: { in: linkedTeamIds } },
                select: { id: true, name: true }
            });

            const reason = `User's IP linked to ${teams.length} other team(s): ${teams.map(t => t.name).join(", ")}`;

            // Record threat (higher severity if multiple teams)
            const severity = teams.length >= 2 ? 4 : 2;
            await recordThreat(ip, "MULTI_ACCOUNT", severity, reason, userId);

            return {
                suspicious: true,
                reason,
                linkedAccounts: linkedTeamIds
            };
        }

        return { suspicious: false };
    } catch (error) {
        console.error("[INTEGRITY] Multi-account check failed:", error);
        return { suspicious: false };
    }
}

// ============================================
// INTEGRITY DASHBOARD
// ============================================

/**
 * Get competition integrity alerts for admin dashboard
 */
export async function getIntegrityAlerts(): Promise<{
    flagSharingAlerts: Array<{
        ip: string;
        teams: string[];
        challengeCount: number;
        lastSeen: Date;
    }>;
    suspiciousSolves: Array<{
        teamId: string;
        teamName: string;
        challengeId: string;
        challengeTitle: string;
        solveTimeMs: number;
        difficulty: string;
        createdAt: Date;
    }>;
    multiAccountAlerts: Array<{
        ip: string;
        teams: Array<{ id: string; name: string }>;
        firstSeen: Date;
    }>;
}> {
    try {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get flag sharing alerts from threat logs
        const flagSharingThreats = await prisma.threatLog.findMany({
            where: {
                type: "FLAG_SHARING",
                createdAt: { gte: last24h }
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        // Get suspicious solve alerts
        const suspiciousSolveThreats = await prisma.threatLog.findMany({
            where: {
                type: "SUSPICIOUS_SOLVE",
                createdAt: { gte: last24h }
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        // Get multi-account alerts
        const multiAccountThreats = await prisma.threatLog.findMany({
            where: {
                type: "MULTI_ACCOUNT",
                createdAt: { gte: last24h }
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        // Process flag sharing alerts
        const flagSharingIPs = new Map<string, { teams: Set<string>; count: number; lastSeen: Date }>();
        for (const threat of flagSharingThreats) {
            const existing = flagSharingIPs.get(threat.ip) || { teams: new Set(), count: 0, lastSeen: threat.createdAt };
            existing.count++;
            existing.lastSeen = threat.createdAt;
            flagSharingIPs.set(threat.ip, existing);
        }

        const flagSharingAlerts = Array.from(flagSharingIPs.entries()).map(([ip, data]) => ({
            ip,
            teams: Array.from(data.teams),
            challengeCount: data.count,
            lastSeen: data.lastSeen
        }));

        // Process suspicious solves (simplified)
        const suspiciousSolves = suspiciousSolveThreats.map(t => ({
            teamId: t.userId || "unknown",
            teamName: "Unknown",
            challengeId: "unknown",
            challengeTitle: t.details || "Unknown",
            solveTimeMs: 0,
            difficulty: "UNKNOWN",
            createdAt: t.createdAt
        }));

        // Process multi-account alerts
        const multiAccountIPs = new Map<string, { teams: Map<string, string>; firstSeen: Date }>();
        for (const threat of multiAccountThreats) {
            if (!multiAccountIPs.has(threat.ip)) {
                multiAccountIPs.set(threat.ip, { teams: new Map(), firstSeen: threat.createdAt });
            }
        }

        const multiAccountAlerts = Array.from(multiAccountIPs.entries()).map(([ip, data]) => ({
            ip,
            teams: Array.from(data.teams.entries()).map(([id, name]) => ({ id, name })),
            firstSeen: data.firstSeen
        }));

        return {
            flagSharingAlerts,
            suspiciousSolves,
            multiAccountAlerts
        };
    } catch (error) {
        console.error("[INTEGRITY] Failed to get integrity alerts:", error);
        return {
            flagSharingAlerts: [],
            suspiciousSolves: [],
            multiAccountAlerts: []
        };
    }
}
