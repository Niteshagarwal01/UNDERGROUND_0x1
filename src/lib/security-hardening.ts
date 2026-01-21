/**
 * UNDERGROUND_0x1 - Production Security Hardening
 * 
 * Prevents sensitive data from being exposed in:
 * - Console logs
 * - Network responses
 * - Error messages
 * - Stack traces
 */

// ============================================
// FLAG PROTECTION
// ============================================

// Patterns that might contain flags
const FLAG_PATTERNS = [
    /UG0x1\{[^}]+\}/gi,           // Main flag format
    /flag\{[^}]+\}/gi,            // Generic flag format
    /CTF\{[^}]+\}/gi,             // CTF format
    /[A-Za-z0-9+/=]{20,}/g,        // Base64-like strings
];

// Words that should never appear in logs
const SENSITIVE_WORDS = [
    'password',
    'secret',
    'token',
    'apikey',
    'api_key',
    'flaghash',
    'flag_hash',
    'privatekey',
    'private_key',
    'accesstoken',
    'access_token',
    'refreshtoken',
    'refresh_token',
    'authorization',
    'bearer',
    'session',
    'cookie',
];

/**
 * Redact sensitive data from a string
 */
export function redactSensitiveData(input: string): string {
    if (!input || typeof input !== 'string') return input;

    let result = input;

    // Redact flag patterns
    for (const pattern of FLAG_PATTERNS) {
        result = result.replace(pattern, '[REDACTED_FLAG]');
    }

    // Redact sensitive words (case-insensitive)
    for (const word of SENSITIVE_WORDS) {
        const regex = new RegExp(`(${word})[=:]["']?[^\\s,}"']+`, 'gi');
        result = result.replace(regex, `$1=[REDACTED]`);
    }

    return result;
}

/**
 * Deep redact an object (for JSON responses)
 */
export function redactObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return redactSensitiveData(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => redactObject(item));
    }

    if (typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            const lowerKey = key.toLowerCase();

            // Always redact these fields
            if (
                lowerKey.includes('flag') ||
                lowerKey.includes('password') ||
                lowerKey.includes('secret') ||
                lowerKey.includes('token') ||
                lowerKey.includes('hash') ||
                lowerKey.includes('key') && !lowerKey.includes('keyboard')
            ) {
                result[key] = '[REDACTED]';
            } else {
                result[key] = redactObject(value);
            }
        }
        return result;
    }

    return obj;
}

// ============================================
// SECURE CONSOLE LOGGING
// ============================================

const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
};

/**
 * Install secure console that redacts sensitive data
 * Call this in your app's entry point
 */
export function installSecureConsole(): void {
    const isProduction = process.env.NODE_ENV === 'production';

    const secureLog = (originalFn: typeof console.log) => {
        return (...args: unknown[]) => {
            if (isProduction) {
                // In production, redact all console output
                const redactedArgs = args.map((arg) => {
                    if (typeof arg === 'string') {
                        return redactSensitiveData(arg);
                    }
                    if (typeof arg === 'object') {
                        try {
                            return JSON.parse(JSON.stringify(redactObject(arg)));
                        } catch {
                            return '[OBJECT_REDACTED]';
                        }
                    }
                    return arg;
                });
                originalFn.apply(console, redactedArgs);
            } else {
                // In development, log normally but add security prefix
                originalFn.apply(console, args);
            }
        };
    };

    console.log = secureLog(originalConsole.log);
    console.warn = secureLog(originalConsole.warn);
    console.error = secureLog(originalConsole.error);
    console.info = secureLog(originalConsole.info);
    console.debug = secureLog(originalConsole.debug);
}

/**
 * Restore original console (for testing)
 */
export function restoreConsole(): void {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
}

// ============================================
// SECURE ERROR HANDLING
// ============================================

/**
 * Create a safe error message for client responses
 * Strips stack traces and sensitive info in production
 */
export function safeErrorMessage(error: unknown): string {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        // In production, never expose internal errors
        return 'An error occurred. Please try again.';
    }

    // In development, show more details but still redact flags
    if (error instanceof Error) {
        return redactSensitiveData(error.message);
    }

    if (typeof error === 'string') {
        return redactSensitiveData(error);
    }

    return 'An unexpected error occurred.';
}

/**
 * Log an error securely (for server-side logging)
 */
export function secureErrorLog(context: string, error: unknown): void {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        // In production, log minimal info without stack traces
        console.error(`[ERROR] ${context}:`, error instanceof Error ? error.message : 'Unknown error');
    } else {
        // In development, log full error but redact sensitive data
        if (error instanceof Error) {
            console.error(`[ERROR] ${context}:`, redactSensitiveData(error.message));
            if (error.stack) {
                console.error(redactSensitiveData(error.stack));
            }
        } else {
            console.error(`[ERROR] ${context}:`, error);
        }
    }
}

// ============================================
// NETWORK RESPONSE SANITIZATION
// ============================================

/**
 * Sensitive fields that should NEVER be in API responses
 */
const FORBIDDEN_RESPONSE_FIELDS = [
    'flagHash',
    'flag_hash',
    'password',
    'passwordHash',
    'secret',
    'privateKey',
    'private_key',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
    'sessionToken',
    'clerkId',        // Don't expose internal IDs
    'internalId',
];

/**
 * Sanitize API response data before sending to client
 */
export function sanitizeApiResponse<T>(data: T): T {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
        return redactSensitiveData(data) as T;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeApiResponse(item)) as T;
    }

    if (typeof data === 'object') {
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
            // Skip forbidden fields entirely
            if (FORBIDDEN_RESPONSE_FIELDS.some(f =>
                key.toLowerCase() === f.toLowerCase()
            )) {
                continue; // Don't include in response
            }

            // Recursively sanitize nested objects
            result[key] = sanitizeApiResponse(value);
        }

        return result as T;
    }

    return data;
}

// ============================================
// REQUEST/RESPONSE HEADERS PROTECTION
// ============================================

/**
 * Security headers to add to all responses
 */
export const SECURITY_HEADERS = {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Enable XSS filter
    'X-XSS-Protection': '1; mode=block',

    // Don't send referrer for cross-origin requests
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Restrict what browser features can be used
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

    // Force HTTPS in production
    ...(process.env.NODE_ENV === 'production' ? {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    } : {}),

    // Content Security Policy - restrictive
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev wss://*.clerk.com",
        "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
        "frame-ancestors 'none'",
    ].join('; '),
};

/**
 * Headers that should be stripped from responses (info leak prevention)
 */
export const HEADERS_TO_STRIP = [
    'x-powered-by',      // Don't reveal tech stack
    'server',            // Don't reveal server software
    'x-aspnet-version',
    'x-aspnetmvc-version',
];

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize all security hardening (call once at app startup)
 */
export function initializeSecurityHardening(): void {
    const isProduction = process.env.NODE_ENV === 'production';

    // Install secure console in production
    if (isProduction) {
        installSecureConsole();
        console.log('[SECURITY] Production hardening enabled');
    } else {
        console.log('[SECURITY] Development mode - full logging enabled');
    }
}

// Auto-initialize if in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    initializeSecurityHardening();
}
