import { NextResponse } from 'next/server';

/**
 * Cache control configurations for different resource types
 */
export const CACHE_CONFIGS = {
  // Static content that rarely changes
  STATIC: {
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
    staleWhileRevalidate: 86400, // 1 day
  },
  // Spec content - moderate caching
  SPEC: {
    maxAge: 300, // 5 minutes
    sMaxAge: 300,
    staleWhileRevalidate: 60, // 1 minute
  },
  // User data - short caching
  USER: {
    maxAge: 60, // 1 minute
    sMaxAge: 60,
    staleWhileRevalidate: 30, // 30 seconds
  },
  // Comments and dynamic content
  DYNAMIC: {
    maxAge: 30, // 30 seconds
    sMaxAge: 30,
    staleWhileRevalidate: 10, // 10 seconds
  },
  // No cache for sensitive operations
  NO_CACHE: {
    maxAge: 0,
    sMaxAge: 0,
    staleWhileRevalidate: 0,
  },
} as const;

type CacheConfig = typeof CACHE_CONFIGS[keyof typeof CACHE_CONFIGS];

/**
 * Generate Cache-Control header value
 */
export function getCacheControlHeader(config: CacheConfig): string {
  const parts = [
    `max-age=${config.maxAge}`,
    `s-maxage=${config.sMaxAge}`,
  ];

  if (config.staleWhileRevalidate > 0) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  if (config.maxAge === 0) {
    parts.push('no-cache', 'no-store', 'must-revalidate');
  } else {
    parts.push('public');
  }

  return parts.join(', ');
}

/**
 * Add cache headers to a NextResponse
 */
export function withCache<T>(
  response: NextResponse<T>,
  config: CacheConfig
): NextResponse<T> {
  response.headers.set('Cache-Control', getCacheControlHeader(config));
  return response;
}

/**
 * Create a cached JSON response
 */
export function cachedJsonResponse<T>(
  data: T,
  config: CacheConfig,
  status: number = 200
): NextResponse<T> {
  const response = NextResponse.json(data, { status });
  return withCache(response, config);
}

/**
 * In-memory cache for API responses (server-side)
 * Use with caution - only for frequently accessed, rarely changing data
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expiresAt: number }>();

  set(key: string, data: any, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => memoryCache.cleanup(), 5 * 60 * 1000);
}

/**
 * Cache key generators for consistent cache keys
 */
export const cacheKeys = {
  spec: (id: string) => `spec:${id}`,
  specList: (filters?: Record<string, any>) => 
    `specs:${JSON.stringify(filters || {})}`,
  revisions: (specId: string) => `revisions:${specId}`,
  comments: (specId: string) => `comments:${specId}`,
  traceabilityGraph: (specId: string) => `traceability:${specId}`,
  user: (userId: string) => `user:${userId}`,
  aiQuota: (userId: string) => `ai-quota:${userId}`,
  templates: () => 'templates',
};

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern: string): void {
  const keys = Array.from(memoryCache['cache'].keys());
  for (const key of keys) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
}
