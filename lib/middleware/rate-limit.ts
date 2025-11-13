// Rate limiting middleware
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitStore>();

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limiting middleware
 * Default: 100 requests per minute per user
 */
export async function rateLimit(
  request: NextRequest,
  userId: string,
  options: RateLimitOptions = { maxRequests: 100, windowMs: 60000 }
): Promise<NextResponse | null> {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  
  // Reset if window has passed
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > options.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many requests. Please try again later.',
          details: {
            retryAfter,
            limit: options.maxRequests,
            window: options.windowMs / 1000,
          },
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': options.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetAt.toString(),
        },
      }
    );
  }
  
  // Add rate limit headers to response
  const remaining = options.maxRequests - entry.count;
  
  // Return null to indicate no rate limit error
  // The calling code should add these headers to the response
  return null;
}

/**
 * Get rate limit headers for a successful response
 */
export function getRateLimitHeaders(
  userId: string,
  options: RateLimitOptions = { maxRequests: 100, windowMs: 60000 }
): Record<string, string> {
  const key = `ratelimit:${userId}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    return {
      'X-RateLimit-Limit': options.maxRequests.toString(),
      'X-RateLimit-Remaining': options.maxRequests.toString(),
    };
  }
  
  const remaining = Math.max(0, options.maxRequests - entry.count);
  
  return {
    'X-RateLimit-Limit': options.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': entry.resetAt.toString(),
  };
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
