/**
 * UNDERGROUND_0x1 - Admin Security Dashboard API
 * 
 * Provides endpoints for monitoring threats, managing blocked IPs,
 * and viewing competition integrity alerts.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {
    getSecurityDashboardStats,
    getBlockedIPs,
    blockIP,
    unblockIP,
    getIPThreatHistory,
    cleanupExpiredBlocks
} from "@/lib/threat-intelligence";
import { getIntegrityAlerts } from "@/lib/competition-integrity";

export const dynamic = "force-dynamic";

// ============================================
// ADMIN CHECK
// ============================================

async function checkAdmin() {
    const { userId } = await auth();
    if (!userId) {
        return { isAdmin: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
        return { isAdmin: false, error: "Forbidden" };
    }

    return { isAdmin: true, userId };
}

// ============================================
// GET - Security Dashboard Data
// ============================================

export async function GET(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action") || "dashboard";

        switch (action) {
            case "dashboard": {
                // Get overall security dashboard stats
                const [stats, blockedIPs, integrityAlerts] = await Promise.all([
                    getSecurityDashboardStats(),
                    getBlockedIPs(),
                    getIntegrityAlerts()
                ]);

                return NextResponse.json({
                    success: true,
                    data: {
                        stats,
                        blockedIPs,
                        integrityAlerts
                    }
                });
            }

            case "threats": {
                // Get recent threats
                const limit = parseInt(searchParams.get("limit") || "50");
                const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

                const threats = await prisma.threatLog.findMany({
                    where: { createdAt: { gte: last24h } },
                    orderBy: { createdAt: "desc" },
                    take: limit
                });

                return NextResponse.json({
                    success: true,
                    data: { threats }
                });
            }

            case "blocked": {
                // Get blocked IPs
                const blockedIPs = await getBlockedIPs();
                return NextResponse.json({
                    success: true,
                    data: { blockedIPs }
                });
            }

            case "ip-history": {
                // Get threat history for specific IP
                const ip = searchParams.get("ip");
                if (!ip) {
                    return NextResponse.json(
                        { success: false, message: "IP address required" },
                        { status: 400 }
                    );
                }

                const history = await getIPThreatHistory(ip);
                return NextResponse.json({
                    success: true,
                    data: { ip, ...history }
                });
            }

            case "integrity": {
                // Get competition integrity alerts
                const alerts = await getIntegrityAlerts();
                return NextResponse.json({
                    success: true,
                    data: { alerts }
                });
            }

            case "cleanup": {
                // Cleanup expired blocks
                const cleaned = await cleanupExpiredBlocks();
                return NextResponse.json({
                    success: true,
                    message: `Cleaned up ${cleaned} expired blocks`
                });
            }

            default:
                return NextResponse.json(
                    { success: false, message: "Invalid action" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("[ADMIN-SECURITY] GET error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// POST - Block an IP
// ============================================

export async function POST(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const body = await request.json();
        const { ip, reason, severity = 5 } = body;

        if (!ip || !reason) {
            return NextResponse.json(
                { success: false, message: "IP and reason are required" },
                { status: 400 }
            );
        }

        // Validate IP format (basic check)
        const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip) && !ip.includes(":")) {
            return NextResponse.json(
                { success: false, message: "Invalid IP address format" },
                { status: 400 }
            );
        }

        const result = await blockIP(ip, `Manual block by admin: ${reason}`, severity);

        if (result.blocked) {
            // Log admin action
            await prisma.auditLog.create({
                data: {
                    adminId: adminCheck.userId!,
                    adminEmail: "admin",
                    action: "BLOCK_IP",
                    entityType: "BlockedIP",
                    entityId: ip,
                    details: JSON.stringify({ reason, severity, duration: result.duration }),
                    ipAddress: request.headers.get("x-forwarded-for") || "unknown"
                }
            });

            return NextResponse.json({
                success: true,
                message: `IP ${ip} blocked for ${result.duration}`
            });
        } else {
            return NextResponse.json(
                { success: false, message: "Failed to block IP (may be whitelisted)" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("[ADMIN-SECURITY] POST error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// DELETE - Unblock an IP
// ============================================

export async function DELETE(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const ip = searchParams.get("ip");

        if (!ip) {
            return NextResponse.json(
                { success: false, message: "IP address required" },
                { status: 400 }
            );
        }

        const result = await unblockIP(ip);

        if (result) {
            // Log admin action
            await prisma.auditLog.create({
                data: {
                    adminId: adminCheck.userId!,
                    adminEmail: "admin",
                    action: "UNBLOCK_IP",
                    entityType: "BlockedIP",
                    entityId: ip,
                    details: "Manual unblock by admin",
                    ipAddress: request.headers.get("x-forwarded-for") || "unknown"
                }
            });

            return NextResponse.json({
                success: true,
                message: `IP ${ip} unblocked successfully`
            });
        } else {
            return NextResponse.json(
                { success: false, message: "IP not found in block list" },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("[ADMIN-SECURITY] DELETE error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
