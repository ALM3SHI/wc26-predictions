import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Redis client (server-side only — never import this in client components)
// Lazily initialized to avoid build-time errors when env vars aren't set.
// ---------------------------------------------------------------------------

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

// ---------------------------------------------------------------------------
// Cache TTL constants (seconds)
// ---------------------------------------------------------------------------

/** 6 hours — scheduled fixture data */
export const FIXTURES_TTL = 21_600;

/** 2 minutes — live score polling */
export const LIVE_SCORE_TTL = 120;

/** 24 hours — finished / final match data */
export const FINISHED_MATCH_TTL = 86_400;

/** 7 days — mostly-static team metadata */
export const TEAMS_TTL = 604_800;

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve a value from cache.
 * Returns `null` on cache miss or if deserialization fails.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get<T>(key);
    return data ?? null;
  } catch (error) {
    console.error(`[cache] GET failed for key "${key}":`, error);
    return null;
  }
}

/**
 * Store a value in cache with an explicit TTL.
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  try {
    await getRedis().set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error(`[cache] SET failed for key "${key}":`, error);
  }
}

/**
 * Delete a key from cache.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch (error) {
    console.error(`[cache] DEL failed for key "${key}":`, error);
  }
}

/**
 * Build a namespaced cache key.
 *
 * @example getCacheKey('fixtures', 'knockout') → 'wc26:fixtures:knockout'
 */
export function getCacheKey(...parts: string[]): string {
  return ['wc26', ...parts].join(':');
}
