import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    "/",
    "/enter",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/challenges",
    "/leaderboard",
    "/api/challenges",
    "/api/leaderboard",
]);

// Define admin routes
const isAdminRoute = createRouteMatcher([
    "/admin(.*)",
    "/api/admin(.*)",
]);

// ============================================
// SECURITY: In-memory rate limiting for middleware
// ============================================
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per window for general routes
const RATE_LIMIT_MAX_API = 60; // stricter for API routes

function getClientIP(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const real = req.headers.get("x-real-ip");
    return forwarded?.split(",")[0]?.trim() || real || "unknown";
}

function checkRateLimit(ip: string, isApi: boolean): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const key = `${ip}:${isApi ? "api" : "general"}`;
    const maxRequests = isApi ? RATE_LIMIT_MAX_API : RATE_LIMIT_MAX_REQUESTS;

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: maxRequests - 1 };
    }

    if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count };
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// ============================================
// SECURITY: Blocked patterns detection
// ============================================
const BLOCKED_USER_AGENTS = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /nessus/i,
    /whatweb/i,
    /dirbuster/i,
    /gobuster/i,
    /wpscan/i,
    /acunetix/i,
    /burpsuite/i,
];

const BLOCKED_PATH_PATTERNS = [
    /\.\.\//, // Path traversal
    /\.\.\\/,
    /%2e%2e/i, // URL encoded path traversal
    /\.env/i, // Environment files
    /\.git/i, // Git folder
    /\.htaccess/i,
    /wp-admin/i, // WordPress exploits
    /wp-login/i,
    /phpmyadmin/i,
    /admin\.php/i,
    /shell/i,
    /\.sql$/i, // SQL files
    /\.bak$/i, // Backup files
    /\.zip$/i,
    /\.tar/i,
    /\.rar$/i,
];

function isBlockedRequest(req: Request): { blocked: boolean; reason?: string } {
    const userAgent = req.headers.get("user-agent") || "";
    const pathname = new URL(req.url).pathname;

    // Check user agent
    for (const pattern of BLOCKED_USER_AGENTS) {
        if (pattern.test(userAgent)) {
            return { blocked: true, reason: "Blocked user agent" };
        }
    }

    // Check path patterns
    for (const pattern of BLOCKED_PATH_PATTERNS) {
        if (pattern.test(pathname)) {
            return { blocked: true, reason: "Blocked path pattern" };
        }
    }

    return { blocked: false };
}

// ============================================
// SECURITY: Add security headers
// ============================================
function addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent clickjacking
    response.headers.set("X-Frame-Options", "DENY");

    // Prevent MIME sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");

    // XSS protection
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Referrer policy
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Content Security Policy
    response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.clerk.accounts.dev https://clerk.com wss://*.clerk.accounts.dev; frame-src https://*.clerk.accounts.dev;"
    );

    // Permissions policy (disable unnecessary features)
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()"
    );

    // HSTS (Strict Transport Security) - only in production
    if (process.env.NODE_ENV === "production") {
        response.headers.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload"
        );
    }

    return response;
}

// ============================================
// MAIN MIDDLEWARE
// ============================================
export default clerkMiddleware(async (auth, req) => {
    const ip = getClientIP(req);
    const isApi = req.url.includes("/api/");

    // FIREWALL 1: Block malicious requests
    const blockCheck = isBlockedRequest(req);
    if (blockCheck.blocked) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "Forbidden" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
        );
    }

    // FIREWALL 2: Rate limiting
    const rateLimit = checkRateLimit(ip, isApi);
    if (!rateLimit.allowed) {
        const response = new NextResponse(
            JSON.stringify({ success: false, message: "Too many requests. Please try again later." }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": "60",
                    "X-RateLimit-Remaining": "0"
                }
            }
        );
        return response;
    }

    // FIREWALL 3: Block suspicious HTTP methods on non-API routes
    const method = req.method;
    if (!isApi && !["GET", "HEAD", "OPTIONS"].includes(method)) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "Method not allowed" }),
            { status: 405, headers: { "Content-Type": "application/json" } }
        );
    }

    // FIREWALL 4: Authentication for protected routes
    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    // Create response and add security headers
    const response = NextResponse.next();
    addSecurityHeaders(response);

    // Add rate limit headers
    response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());

    return response;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
