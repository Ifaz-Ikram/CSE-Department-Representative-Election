/**
 * Redis Cache Utilities
 * Provides caching for expensive database queries to improve performance
 */

import { Redis } from "@upstash/redis";

// Lazy initialization - only create Redis client when first needed
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
    if (redis) return redis;

    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        if (process.env.NODE_ENV === "production") {
            console.warn("⚠️  Redis cache disabled: Redis not configured");
        }
        return null;
    }

    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    return redis;
}

/**
 * Cache key prefixes for different data types
 */
export const CacheKeys = {
    ELECTION: (id: string) => `election:${id}`,
    ELECTIONS_LIST: "elections:list",
    CANDIDATES: (electionId: string) => `candidates:election:${electionId}`,
    ELECTION_STATS: (electionId: string) => `stats:election:${electionId}`,
    USER: (id: string) => `user:${id}`,
    VOTER_REGISTRY: (email: string) => `registry:${email}`,
    RESULTS: (electionId: string) => `results:election:${electionId}`,
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
    SHORT: 60, // 1 minute - for frequently changing data
    MEDIUM: 300, // 5 minutes - for moderately changing data
    LONG: 3600, // 1 hour - for rarely changing data
    VERY_LONG: 86400, // 24 hours - for static data
} as const;

/**
 * Get cached data
 * @param key - Cache key
 * @returns Cached data or null if not found/expired
 */
export async function getCached<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;

    try {
        const data = await client.get<T>(key);
        return data;
    } catch (error) {
        console.error(`Cache GET error for key ${key}:`, error);
        return null;
    }
}

/**
 * Set cached data
 * @param key - Cache key
 * @param value - Data to cache
 * @param ttl - Time to live in seconds (default: 5 minutes)
 */
export async function setCached<T>(
    key: string,
    value: T,
    ttl: number = CacheTTL.MEDIUM
): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
        await client.set(key, value, { ex: ttl });
    } catch (error) {
        console.error(`Cache SET error for key ${key}:`, error);
    }
}

/**
 * Delete cached data
 * @param key - Cache key or array of keys
 */
export async function deleteCached(key: string | string[]): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
        if (Array.isArray(key)) {
            await client.del(...key);
        } else {
            await client.del(key);
        }
    } catch (error) {
        console.error(`Cache DELETE error for key ${key}:`, error);
    }
}

/**
 * Delete all cached data matching a pattern
 * @param pattern - Pattern to match (e.g., "election:*")
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    } catch (error) {
        console.error(`Cache DELETE PATTERN error for pattern ${pattern}:`, error);
    }
}

/**
 * Get or set cached data (cache-aside pattern)
 * If data exists in cache, return it. Otherwise, fetch from source and cache it.
 * 
 * @param key - Cache key
 * @param fetchFn - Function to fetch data if not cached
 * @param ttl - Time to live in seconds
 * @returns Cached or freshly fetched data
 * 
 * @example
 * const election = await getOrSetCached(
 *   CacheKeys.ELECTION(id),
 *   () => prisma.election.findUnique({ where: { id } }),
 *   CacheTTL.MEDIUM
 * );
 */
export async function getOrSetCached<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
): Promise<T> {
    // Try to get from cache
    const cached = await getCached<T>(key);
    if (cached !== null) {
        return cached;
    }

    // Fetch from source
    const data = await fetchFn();

    // Cache the result
    await setCached(key, data, ttl);

    return data;
}

/**
 * Invalidate cache for an election and related data
 * Call this when election data changes
 */
export async function invalidateElectionCache(electionId: string): Promise<void> {
    await deleteCached([
        CacheKeys.ELECTION(electionId),
        CacheKeys.ELECTIONS_LIST,
        CacheKeys.CANDIDATES(electionId),
        CacheKeys.ELECTION_STATS(electionId),
        CacheKeys.RESULTS(electionId),
    ]);
}

/**
 * Invalidate cache for candidates
 * Call this when candidate data changes
 */
export async function invalidateCandidateCache(electionId: string): Promise<void> {
    await deleteCached([
        CacheKeys.CANDIDATES(electionId),
        CacheKeys.ELECTION_STATS(electionId),
        CacheKeys.RESULTS(electionId),
    ]);
}

/**
 * Invalidate cache for user data
 * Call this when user data changes
 */
export async function invalidateUserCache(userId: string): Promise<void> {
    await deleteCached(CacheKeys.USER(userId));
}

/**
 * Invalidate all election-related caches
 * Use with caution - clears all election data
 */
export async function invalidateAllElectionCaches(): Promise<void> {
    await deleteCachedPattern("election:*");
    await deleteCachedPattern("candidates:*");
    await deleteCachedPattern("stats:*");
    await deleteCachedPattern("results:*");
}
