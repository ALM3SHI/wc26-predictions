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

// Redis can wedge if Upstash is under load. A 1s cap keeps the caller
// moving — a cache miss is fine, a hung render isn't.
const REDIS_TIMEOUT_MS = 1000;

function withTimeout<T>(p: Promise<T>, ms: number, tag: string): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.error(`[cache] ${tag} timed out after ${ms}ms`);
      resolve(null);
    }, ms);
    p.then((v) => {
      clearTimeout(timer);
      resolve(v);
    }).catch((err) => {
      clearTimeout(timer);
      console.error(`[cache] ${tag} threw`, err);
      resolve(null);
    });
  });
}

/**
 * Retrieve a value from cache.
 * Returns `null` on cache miss, timeout, or deserialization failure.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  const data = await withTimeout(
    getRedis().get<T>(key),
    REDIS_TIMEOUT_MS,
    `GET ${key}`,
  );
  return data ?? null;
}

/**
 * Store a value in cache with an explicit TTL.
 * Fire-and-forget: never blocks the caller.
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  // Don't await — if the cache write is slow, the response should still ship.
  void withTimeout(
    getRedis().set(key, value, { ex: ttlSeconds }),
    REDIS_TIMEOUT_MS,
    `SET ${key}`,
  );
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
