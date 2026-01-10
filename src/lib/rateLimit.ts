import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Lazy initialization - only create Redis/rate limiters when first needed (runtime)
// This prevents initialization during build phase when env vars might not be available
let redis: Redis | null = null;
let rateLimiters: Record<string, Ratelimit> | null = null;

function initializeRateLimiters() {
    if (rateLimiters) return rateLimiters;

    // Initialize Redis client
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Create rate limiters
    rateLimiters = {
        // Vote endpoint: 10 requests per minute (prevent rapid vote changes)
        vote: new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(10, "1 m"),
            analytics: true,
            prefix: "@upstash/ratelimit/vote",
        }),

        // Auth endpoints: 5 requests per minute (prevent brute force)
        auth: new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(5, "1 m"),
            analytics: true,
            prefix: "@upstash/ratelimit/auth",
        }),

        // Admin endpoints: 30 requests per minute
        admin: new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(30, "1 m"),
            analytics: true,
            prefix: "@upstash/ratelimit/admin",
        }),

        // General API: 60 requests per minute
        general: new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(60, "1 m"),
            analytics: true,
            prefix: "@upstash/ratelimit/general",
        }),
    };

    return rateLimiters;
}

// Rate limit types
export type RateLimitType = "vote" | "auth" | "admin" | "general";

/**
 * Get client identifier for rate limiting
 * Uses IP address or forwarded-for header
 */
function getClientIdentifier(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    return ip;
}

/**
 * Apply rate limiting to a request
 * @param req - The incoming request
 * @param type - Type of rate limiter to use
 * @returns null if allowed, NextResponse if rate limited
 */
export async function rateLimit(
    req: NextRequest,
    type: RateLimitType = "general"
): Promise<NextResponse | null> {
    try {
        // Initialize rate limiters on first use (lazy initialization)
        const limiters = initializeRateLimiters();
        
        const identifier = getClientIdentifier(req);
        const limiter = limiters[type];
        const { success, limit, remaining, reset } = await limiter.limit(identifier);

        if (!success) {
            const retryAfter = Math.ceil((reset - Date.now()) / 1000);

            return NextResponse.json(
                {
                    error: "Too many requests",
                    message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
                    retryAfter,
                },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                        "Retry-After": retryAfter.toString(),
                    },
                }
            );
        }

        return null; // Request allowed
    } catch (error) {
        // If rate limiting fails, allow the request but log the error
        console.error("Rate limiting error:", error);
        return null;
    }
}

/**
 * Helper to check if rate limit was hit
 * Use at the start of API routes
 * 
 * @example
 * export async function POST(req: NextRequest) {
 *   const rateLimitResponse = await rateLimit(req, 'vote');
 *   if (rateLimitResponse) return rateLimitResponse;
 *   // ... rest of your handler
 * }
 */
export { rateLimit as checkRateLimit };
