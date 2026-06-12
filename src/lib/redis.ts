import { Redis } from "@upstash/redis";

/**
 * Upstash Redis when configured, otherwise an in-memory store so that
 * local development works with zero external accounts. The in-memory
 * fallback resets on cold starts — fine for dev, not for production.
 */

interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis: Redis | null = hasUpstash ? Redis.fromEnv() : null;

const memory = new Map<string, { value: unknown; expiresAt: number | null }>();

function memoryGet<T>(key: string): T | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value as T;
}

export const cache: CacheStore = {
  async get<T>(key: string): Promise<T | null> {
    if (redis) {
      try {
        return (await redis.get<T>(key)) ?? null;
      } catch {
        return null;
      }
    }
    return memoryGet<T>(key);
  },
  async set(key, value, ttlSeconds) {
    if (redis) {
      try {
        if (ttlSeconds) await redis.set(key, value, { ex: ttlSeconds });
        else await redis.set(key, value);
      } catch {
        // cache failures must never break requests
      }
      return;
    }
    memory.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  },
  async del(key) {
    if (redis) {
      try {
        await redis.del(key);
      } catch {
        // ignore
      }
      return;
    }
    memory.delete(key);
  },
};

/** Cache-aside helper */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = await cache.get<T>(key);
  if (hit !== null) return hit;
  const value = await fn();
  await cache.set(key, value, ttlSeconds);
  return value;
}
