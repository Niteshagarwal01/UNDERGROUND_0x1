import { NextRequest, NextResponse } from "next/server";

// ============================================
// UNDERGROUND_0x1 SECURITY FRAMEWORK
// Custom security firewalls for CTF platform
// ============================================

// ============================================
// FIREWALL 1: Request Validation & Sanitization
// ============================================

/**
 * Validates and sanitizes incoming request data
 * Protects against XSS, SQL injection, NoSQL injection, and template injection
 */
export function validateRequest(body: Record<string, unknown>): { valid: boolean; reason?: string } {
    // XSS attack patterns
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi,
        /<\s*img[^>]*onerror/gi,
        /<\s*svg[^>]*onload/gi,
        /document\.(cookie|location|write)/gi,
        /window\.(location|open)/gi,
        /eval\s*\(/gi,
        /setTimeout\s*\(/gi,
        /setInterval\s*\(/gi,
        /Function\s*\(/gi,
    ];

    // SQL injection patterns
    const sqlPatterns = [
        /\bUNION\b.*\bSELECT\b/gi,
        /\bDROP\b.*\bTABLE\b/gi,
        /\bDELETE\b.*\bFROM\b/gi,
        /\bINSERT\b.*\bINTO\b/gi,
        /\bUPDATE\b.*\bSET\b/gi,
        /\bSELECT\b.*\bFROM\b/gi,
        /\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+/gi, // OR 1=1
        /\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+/gi, // AND 1=1
        /;\s*(DROP|DELETE|TRUNCATE|ALTER)/gi,
        /--/g, // SQL comments
        /\/\*[\s\S]*?\*\//g, // SQL block comments
        /\bWAITFOR\b.*\bDELAY\b/gi, // SQL time-based injection
        /\bSLEEP\s*\(/gi,
        /\bBENCHMARK\s*\(/gi,
    ];

    // NoSQL injection patterns
    const noSqlPatterns = [
        /\$where/gi,
        /\$gt/gi,
        /\$lt/gi,
        /\$ne/gi,
        /\$regex/gi,
        /\$or/gi,
        /\$and/gi,
        /\{\s*['"]\$\w+['"]/gi,
    ];

    // Template injection patterns
    const templatePatterns = [
        /\$\{.*\}/g,
        /\{\{.*\}\}/g,
        /<%.*%>/g,
        /@\{.*\}/g,
        /#\{.*\}/g,
    ];

    // Path traversal patterns
    const pathTraversalPatterns = [
        /\.\.\//g,
        /\.\.\\/g,
        /%2e%2e/gi,
        /%252e%252e/gi,
    ];

    const stringifyBody = JSON.stringify(body);
    const allPatterns = [
        { patterns: xssPatterns, category: "XSS attack" },
        { patterns: sqlPatterns, category: "SQL injection" },
        { patterns: noSqlPatterns, category: "NoSQL injection" },
        { patterns: templatePatterns, category: "Template injection" },
        { patterns: pathTraversalPatterns, category: "Path traversal" },
    ];

    for (const { patterns, category } of allPatterns) {
        for (const pattern of patterns) {
            if (pattern.test(stringifyBody)) {
                return { valid: false, reason: `${category} pattern detected` };
            }
        }
    }

    // Check payload size (max 50KB for regular requests)
    if (stringifyBody.length > 51200) {
        return { valid: false, reason: "Request payload too large" };
    }

    // Check for deeply nested objects (potential DoS via hash collision)
    const maxDepth = 10;
    function checkDepth(obj: unknown, depth: number): boolean {
        if (depth > maxDepth) return false;
        if (typeof obj !== "object" || obj === null) return true;
        for (const value of Object.values(obj)) {
            if (!checkDepth(value, depth + 1)) return false;
        }
        return true;
    }
    if (!checkDepth(body, 0)) {
        return { valid: false, reason: "Request structure too complex" };
    }

    return { valid: true };
}

// ============================================
// FIREWALL 2: Input Sanitization
// ============================================

/**
 * Sanitizes string input by removing dangerous characters
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, "") // Remove angle brackets
        .replace(/javascript:/gi, "") // Remove javascript protocol
        .replace(/on\w+=/gi, "") // Remove event handlers
        .trim();
}

/**
 * Sanitizes flag input for submission
 */
export function sanitizeFlag(flag: string): string {
    // Only allow valid flag characters
    return flag.replace(/[^a-zA-Z0-9_{}\-]/g, "").trim();
}

// ============================================
// FIREWALL 3: Anti-Automation Detection
// ============================================

interface RequestFingerprint {
    count: number;
    lastSeen: number;
    patterns: string[];
}

const automationDetection = new Map<string, RequestFingerprint>();
const AUTOMATION_WINDOW = 60 * 1000; // 1 minute
const AUTOMATION_THRESHOLD = 30; // requests with same pattern

/**
 * Detects automated tools/bots
 */
export function detectAutomation(request: NextRequest): { suspicious: boolean; reason?: string } {
    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";
    const now = Date.now();

    // Check for missing/suspicious headers that browsers always send
    if (!userAgent || userAgent.length < 10) {
        return { suspicious: true, reason: "Missing or invalid user agent" };
    }

    const acceptLanguage = request.headers.get("accept-language");
    const accept = request.headers.get("accept");

    // Browsers always send these headers
    if (!acceptLanguage && !accept) {
        return { suspicious: true, reason: "Missing browser headers" };
    }

    // Build request fingerprint
    const fingerprint = `${ip}:${userAgent.substring(0, 50)}`;
    const entry = automationDetection.get(fingerprint);

    if (!entry || now - entry.lastSeen > AUTOMATION_WINDOW) {
        automationDetection.set(fingerprint, {
            count: 1,
            lastSeen: now,
            patterns: [request.nextUrl.pathname],
        });
        return { suspicious: false };
    }

    entry.count++;
    entry.lastSeen = now;
    entry.patterns.push(request.nextUrl.pathname);

    if (entry.count > AUTOMATION_THRESHOLD) {
        return { suspicious: true, reason: "Request rate indicates automation" };
    }

    // Check for repetitive patterns
    const recentPatterns = entry.patterns.slice(-20);
    const uniquePatterns = new Set(recentPatterns);
    if (recentPatterns.length >= 10 && uniquePatterns.size <= 2) {
        return { suspicious: true, reason: "Repetitive request pattern detected" };
    }

    return { suspicious: false };
}

// Cleanup old entries
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of automationDetection.entries()) {
        if (now - entry.lastSeen > AUTOMATION_WINDOW * 2) {
            automationDetection.delete(key);
        }
    }
}, 2 * 60 * 1000);

// ============================================
// FIREWALL 4: Flag Brute-Force Protection
// ============================================

interface BruteForceEntry {
    attempts: number;
    lastAttempt: number;
    blocked: boolean;
    blockedUntil: number;
}

const bruteForceProtection = new Map<string, BruteForceEntry>();
const BRUTE_FORCE_WINDOW = 5 * 60 * 1000; // 5 minutes
const BRUTE_FORCE_MAX_ATTEMPTS = 10; // per challenge
const BRUTE_FORCE_BLOCK_DURATION = 15 * 60 * 1000; // 15 minute block

/**
 * Checks if user is blocked for brute-forcing a specific challenge
 */
export function checkBruteForce(userId: string, challengeId: string): { allowed: boolean; retryAfter?: number } {
    const key = `${userId}:${challengeId}`;
    const now = Date.now();
    const entry = bruteForceProtection.get(key);

    if (!entry) {
        bruteForceProtection.set(key, {
            attempts: 0,
            lastAttempt: now,
            blocked: false,
            blockedUntil: 0,
        });
        return { allowed: true };
    }

    // Check if currently blocked
    if (entry.blocked && now < entry.blockedUntil) {
        return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
    }

    // Reset if window expired
    if (now - entry.lastAttempt > BRUTE_FORCE_WINDOW) {
        entry.attempts = 0;
        entry.blocked = false;
    }

    return { allowed: true };
}

/**
 * Records a failed flag attempt
 */
export function recordFailedAttempt(userId: string, challengeId: string): void {
    const key = `${userId}:${challengeId}`;
    const now = Date.now();
    let entry = bruteForceProtection.get(key);

    if (!entry) {
        entry = { attempts: 0, lastAttempt: now, blocked: false, blockedUntil: 0 };
        bruteForceProtection.set(key, entry);
    }

    entry.attempts++;
    entry.lastAttempt = now;

    if (entry.attempts >= BRUTE_FORCE_MAX_ATTEMPTS) {
        entry.blocked = true;
        entry.blockedUntil = now + BRUTE_FORCE_BLOCK_DURATION;
    }
}

/**
 * Clears brute force record on successful solve
 */
export function clearBruteForce(userId: string, challengeId: string): void {
    const key = `${userId}:${challengeId}`;
    bruteForceProtection.delete(key);
}

// Cleanup old entries
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of bruteForceProtection.entries()) {
        if (now - entry.lastAttempt > BRUTE_FORCE_WINDOW * 2 && !entry.blocked) {
            bruteForceProtection.delete(key);
        }
    }
}, 5 * 60 * 1000);

// ============================================
// SUSPICIOUS ACTIVITY LOGGING
// ============================================

interface SuspiciousActivityLog {
    userId?: string;
    ip: string;
    reason: string;
    path: string;
    timestamp: Date;
}

const suspiciousActivityLog: SuspiciousActivityLog[] = [];

/**
 * Logs suspicious activity for monitoring
 */
export function logSuspiciousActivity(
    request: NextRequest,
    reason: string,
    userId?: string
): void {
    const ip = getClientIP(request);

    suspiciousActivityLog.push({
        userId,
        ip,
        reason,
        path: request.nextUrl.pathname,
        timestamp: new Date(),
    });

    // Keep only last 1000 entries
    if (suspiciousActivityLog.length > 1000) {
        suspiciousActivityLog.shift();
    }
}

/**
 * Gets recent suspicious activity (for admin monitoring)
 */
export function getSuspiciousActivityLog(): SuspiciousActivityLog[] {
    return [...suspiciousActivityLog].reverse().slice(0, 100);
}

// ============================================
// SECURITY HEADERS
// ============================================

/**
 * Adds security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    return response;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets client IP from request
 */
export function getClientIP(request: NextRequest): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

/**
 * Applies all security firewalls to a request
 * Returns an error response if any check fails, null if all pass
 */
export function applySecurityFirewalls(
    request: NextRequest,
    body?: Record<string, unknown>,
    userId?: string
): NextResponse | null {
    // Firewall 1: Validate request body if provided
    if (body) {
        const bodyCheck = validateRequest(body);
        if (!bodyCheck.valid) {
            logSuspiciousActivity(request, bodyCheck.reason || "Body validation failed", userId);
            return NextResponse.json(
                { success: false, message: "Request blocked by security policy" },
                { status: 400 }
            );
        }
    }

    // Firewall 2: Detect automation
    const automationCheck = detectAutomation(request);
    if (automationCheck.suspicious) {
        logSuspiciousActivity(request, automationCheck.reason || "Automation detected", userId);
        return NextResponse.json(
            { success: false, message: "Request blocked" },
            { status: 429 }
        );
    }

    // Firewall 3: Origin validation for API routes
    const originCheck = validateOrigin(request);
    if (!originCheck.valid) {
        logSuspiciousActivity(request, originCheck.reason || "Invalid origin", userId);
        return NextResponse.json(
            { success: false, message: "Request blocked" },
            { status: 403 }
        );
    }

    // Firewall 4: IP blocklist check
    if (isIPBlocked(getClientIP(request))) {
        return NextResponse.json(
            { success: false, message: "Access denied" },
            { status: 403 }
        );
    }

    return null; // All checks passed
}

// ============================================
// FIREWALL 5: Origin & Referer Validation
// ============================================

const ALLOWED_ORIGINS = [
    "localhost",
    "127.0.0.1",
    "underground-0x1.vercel.app",
    // Add your production domain here
];

/**
 * Validates request origin to prevent CSRF attacks
 */
export function validateOrigin(request: NextRequest): { valid: boolean; reason?: string } {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // Allow requests without origin (same-origin, non-CORS)
    if (!origin) {
        return { valid: true };
    }

    try {
        const originUrl = new URL(origin);
        const hostname = originUrl.hostname;

        // Check if origin matches allowed origins or current host
        const isAllowed = ALLOWED_ORIGINS.some(allowed =>
            hostname === allowed || hostname.endsWith(`.${allowed}`)
        ) || hostname === host?.split(":")[0];

        if (!isAllowed) {
            return { valid: false, reason: `Unauthorized origin: ${hostname}` };
        }

        return { valid: true };
    } catch {
        return { valid: false, reason: "Malformed origin header" };
    }
}

// ============================================
// FIREWALL 6: IP Blocklist
// ============================================

const blockedIPs = new Set<string>();
const IP_BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const ipBlockExpiry = new Map<string, number>();

/**
 * Blocks an IP address
 */
export function blockIP(ip: string, duration: number = IP_BLOCK_DURATION): void {
    blockedIPs.add(ip);
    ipBlockExpiry.set(ip, Date.now() + duration);
}

/**
 * Unblocks an IP address
 */
export function unblockIP(ip: string): void {
    blockedIPs.delete(ip);
    ipBlockExpiry.delete(ip);
}

/**
 * Checks if an IP is blocked
 */
export function isIPBlocked(ip: string): boolean {
    if (!blockedIPs.has(ip)) return false;

    const expiry = ipBlockExpiry.get(ip);
    if (expiry && Date.now() > expiry) {
        unblockIP(ip);
        return false;
    }
    return true;
}

/**
 * Gets all blocked IPs (for admin monitoring)
 */
export function getBlockedIPs(): string[] {
    return Array.from(blockedIPs);
}

// ============================================
// FIREWALL 7: Admin Action Audit Logging
// ============================================

interface AdminAuditLog {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    details: string;
    ip: string;
    timestamp: Date;
}

const adminAuditLogs: AdminAuditLog[] = [];
const MAX_AUDIT_LOGS = 5000;

/**
 * Logs an admin action for audit trail
 */
export function logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details: string,
    request: NextRequest
): void {
    const log: AdminAuditLog = {
        adminId,
        action,
        targetType,
        targetId,
        details,
        ip: getClientIP(request),
        timestamp: new Date(),
    };

    adminAuditLogs.push(log);

    // Keep only recent logs
    if (adminAuditLogs.length > MAX_AUDIT_LOGS) {
        adminAuditLogs.shift();
    }

    // Log to console for server-side monitoring
    console.log(`[ADMIN AUDIT] ${action} on ${targetType}:${targetId} by ${adminId} - ${details}`);
}

/**
 * Gets recent admin audit logs (for admin monitoring)
 */
export function getAdminAuditLogs(limit: number = 100): AdminAuditLog[] {
    return [...adminAuditLogs].reverse().slice(0, limit);
}

// ============================================
// FIREWALL 8: Request Fingerprinting
// ============================================

interface ClientFingerprint {
    ip: string;
    userAgent: string;
    acceptLanguage: string;
    acceptEncoding: string;
    hash: string;
}

/**
 * Creates a fingerprint from request headers for tracking
 */
export function createRequestFingerprint(request: NextRequest): ClientFingerprint {
    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";
    const acceptLanguage = request.headers.get("accept-language") || "";
    const acceptEncoding = request.headers.get("accept-encoding") || "";

    // Simple hash for fingerprinting
    const combined = `${ip}|${userAgent}|${acceptLanguage}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return {
        ip,
        userAgent: userAgent.substring(0, 200),
        acceptLanguage: acceptLanguage.substring(0, 50),
        acceptEncoding: acceptEncoding.substring(0, 50),
        hash: Math.abs(hash).toString(36),
    };
}

// ============================================
// ENHANCED SECURITY HEADERS
// ============================================

/**
 * Adds comprehensive security headers to response
 */
export function addEnhancedSecurityHeaders(response: NextResponse): NextResponse {
    // Basic security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Advanced security headers
    response.headers.set("X-DNS-Prefetch-Control", "off");
    response.headers.set("X-Download-Options", "noopen");
    response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

    // Permissions policy (disable dangerous APIs)
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
    );

    // HSTS for production
    if (process.env.NODE_ENV === "production") {
        response.headers.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload"
        );
    }

    return response;
}

// ============================================
// FIREWALL 9: Sensitive Data Protection
// ============================================

const SENSITIVE_FIELDS = [
    "password",
    "token",
    "secret",
    "apiKey",
    "flagHash",
    "inviteCode",
    "creditCard",
    "ssn",
];

/**
 * Sanitizes response data to remove/mask sensitive fields
 */
export function sanitizeResponseData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
            sanitized[key] = "[REDACTED]";
        } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
            sanitized[key] = sanitizeResponseData(sanitized[key] as Record<string, unknown>);
        }
    }

    return sanitized;
}

// ============================================
// AUTO-BLOCK SUSPICIOUS IPS
// ============================================

const suspiciousIPCounts = new Map<string, { count: number; firstSeen: number }>();
const SUSPICIOUS_THRESHOLD = 10; // suspicious activities before auto-block
const SUSPICIOUS_WINDOW = 10 * 60 * 1000; // 10 minutes

/**
 * Tracks suspicious activity and auto-blocks repeat offenders
 */
export function trackSuspiciousIP(request: NextRequest): void {
    const ip = getClientIP(request);
    const now = Date.now();

    const entry = suspiciousIPCounts.get(ip);
    if (!entry || now - entry.firstSeen > SUSPICIOUS_WINDOW) {
        suspiciousIPCounts.set(ip, { count: 1, firstSeen: now });
        return;
    }

    entry.count++;

    if (entry.count >= SUSPICIOUS_THRESHOLD) {
        blockIP(ip);
        console.warn(`[SECURITY] Auto-blocked IP ${ip} after ${entry.count} suspicious activities`);
        suspiciousIPCounts.delete(ip);
    }
}

// Cleanup interval for expired data
setInterval(() => {
    const now = Date.now();

    // Cleanup expired IP blocks
    for (const [ip, expiry] of ipBlockExpiry.entries()) {
        if (now > expiry) {
            unblockIP(ip);
        }
    }

    // Cleanup old suspicious IP tracking
    for (const [ip, entry] of suspiciousIPCounts.entries()) {
        if (now - entry.firstSeen > SUSPICIOUS_WINDOW) {
            suspiciousIPCounts.delete(ip);
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes

