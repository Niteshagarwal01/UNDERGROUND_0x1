/**
 * UNDERGROUND_0x1 - Honeypot System
 * 
 * Fake endpoints that auto-block anyone who accesses them.
 * These paths are commonly targeted by attackers and bots.
 */

import { NextRequest, NextResponse } from "next/server";
import { recordThreat, blockIP, isWhitelistedIP } from "@/lib/threat-intelligence";

// Honeypot paths that trigger immediate blocking
// These are fake endpoints that legitimate users would never access
const HONEYPOT_PATHS = [
    "admin/backup",
    "admin/db",
    "admin/config",
    "admin/debug",
    "admin/shell",
    "debug",
    "test",
    "v1/flags",
    "v1/admin",
    "v2/flags",
    "flags",
    "config",
    "backup",
    "shell",
    "phpinfo",
    "info.php",
    ".env",
    ".git",
    "wp-admin",
    "wp-login.php",
    "phpmyadmin",
    "mysql",
    "database",
    "sql",
    "dump",
    "export",
    "keys",
    "secrets",
    "passwords",
    "credentials",
];

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

/**
 * Handle honeypot request - log threat and block IP
 */
async function handleHoneypot(request: NextRequest, path: string): Promise<NextResponse> {
    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    console.log(`[HONEYPOT] Trap triggered by ${ip} on path: /api/honeypot/${path}`);

    // Check if whitelisted first (don't block admins/test teams)
    if (await isWhitelistedIP(ip)) {
        console.log(`[HONEYPOT] Skipping block for whitelisted IP: ${ip}`);
        return NextResponse.json(
            { success: false, message: "Not found" },
            { status: 404 }
        );
    }

    // Record the threat with HIGH severity
    await recordThreat(
        ip,
        "HONEYPOT_TRIGGER",
        5, // Maximum severity
        `Accessed honeypot path: /api/${path} | UA: ${userAgent.substring(0, 100)}`
    );

    // Immediately block the IP (this adds strike count)
    await blockIP(
        ip,
        `Honeypot triggered: /api/${path}`,
        5 // Maximum severity
    );

    // Return a fake response to waste attacker's time
    // We don't want them to know they've been caught
    const fakeResponses = [
        // Fake success response
        {
            success: true,
            message: "Processing request...",
            data: { status: "pending", eta: "2 minutes" }
        },
        // Fake config response
        {
            config: {
                debug: false,
                version: "1.0.0",
                server: "production-01"
            }
        },
        // Fake admin response
        {
            admin: true,
            permissions: ["read", "write"],
            session: "valid"
        },
        // Fake database response
        {
            database: "connected",
            tables: ["users", "flags", "teams"],
            status: "healthy"
        }
    ];

    // Return random fake response with slight delay
    const randomResponse = fakeResponses[Math.floor(Math.random() * fakeResponses.length)];

    return NextResponse.json(randomResponse, {
        status: 200,
        headers: {
            // Add fake headers to seem more legitimate
            "X-Request-Id": Math.random().toString(36).substring(7),
            "X-Processing-Time": `${Math.random() * 100}ms`
        }
    });
}

// ============================================
// ROUTE HANDLERS
// ============================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const fullPath = path.join("/");
    return handleHoneypot(request, fullPath);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const fullPath = path.join("/");
    return handleHoneypot(request, fullPath);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const fullPath = path.join("/");
    return handleHoneypot(request, fullPath);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const fullPath = path.join("/");
    return handleHoneypot(request, fullPath);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const fullPath = path.join("/");
    return handleHoneypot(request, fullPath);
}
