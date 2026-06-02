import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiter for login attempts (10 per minute per IP/email)
export const loginLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:login',
});

// Rate limiter for attendance marking (5 per minute per student)
export const attendanceLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:attendance',
});

// Rate limiter for course creation (100 per hour per admin)
export const courseLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  analytics: true,
  prefix: 'ratelimit:course',
});

/**
 * Check rate limit with identifier
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; retryAfter: number }> {
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      retryAfter: (result as any).resetAfter || 0,
    };
  } catch (error) {
    console.error('[v0] Rate limit check error:', error);
    // Fail open if Redis is down
    return { success: true, remaining: 0, retryAfter: 0 };
  }
}
