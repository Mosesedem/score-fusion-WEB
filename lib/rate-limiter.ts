/**
 * Rate Limiter for API requests
 * Implements token bucket algorithm
 */

interface RateLimiterConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
  provider: string; // Provider name for tracking
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private static instances = new Map<string, RateLimiter>();
  private requests = new Map<string, RequestRecord>();
  private config: RateLimiterConfig;

  private constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  static getInstance(
    provider: string,
    maxRequests: number,
    windowMs: number
  ): RateLimiter {
    const key = `${provider}_${maxRequests}_${windowMs}`;
    if (!RateLimiter.instances.has(key)) {
      RateLimiter.instances.set(
        key,
        new RateLimiter({ provider, maxRequests, windowMs })
      );
    }
    return RateLimiter.instances.get(key)!;
  }

  /**
   * Check if request is allowed
   */
  async isAllowed(identifier: string = "default"): Promise<boolean> {
    const now = Date.now();
    const key = `${this.config.provider}:${identifier}`;
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (record.count < this.config.maxRequests) {
      record.count++;
      return true;
    }

    return false;
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(identifier: string = "default"): number {
    const key = `${this.config.provider}:${identifier}`;
    const record = this.requests.get(key);
    if (!record) return 0;

    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  /**
   * Get remaining requests
   */
  getRemainingRequests(identifier: string = "default"): number {
    const key = `${this.config.provider}:${identifier}`;
    const record = this.requests.get(key);
    if (!record) return this.config.maxRequests;

    const now = Date.now();
    if (now > record.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - record.count);
  }

  /**
   * Wait until request is allowed
   */
  async waitForSlot(identifier: string = "default"): Promise<void> {
    const allowed = await this.isAllowed(identifier);
    if (allowed) return;

    const waitTime = this.getResetTime(identifier);
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot(identifier);
    }
  }

  /**
   * Clear rate limit for identifier
   */
  clear(identifier?: string): void {
    if (identifier) {
      const key = `${this.config.provider}:${identifier}`;
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

/**
 * Redis-based rate limiter for production use
 */
export class RedisRateLimiter {
  private redis: any; // Redis client
  private config: RateLimiterConfig;

  constructor(redis: any, config: RateLimiterConfig) {
    this.redis = redis;
    this.config = config;
  }

  async isAllowed(identifier: string = "default"): Promise<boolean> {
    const key = `ratelimit:${this.config.provider}:${identifier}`;
    const now = Date.now();

    try {
      // Remove old entries
      await this.redis.zremrangebyscore(key, 0, now - this.config.windowMs);

      // Count current requests
      const count = await this.redis.zcard(key);

      if (count < this.config.maxRequests) {
        // Add new request
        await this.redis.zadd(key, now, `${now}-${Math.random()}`);
        await this.redis.expire(key, Math.ceil(this.config.windowMs / 1000));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Redis rate limiter error:", error);
      // Fallback to allowing request on error
      return true;
    }
  }

  async getRemainingRequests(identifier: string = "default"): Promise<number> {
    const key = `ratelimit:${this.config.provider}:${identifier}`;
    const now = Date.now();

    try {
      await this.redis.zremrangebyscore(key, 0, now - this.config.windowMs);
      const count = await this.redis.zcard(key);
      return Math.max(0, this.config.maxRequests - count);
    } catch (error) {
      console.error("Redis rate limiter error:", error);
      return this.config.maxRequests;
    }
  }

  async getResetTime(identifier: string = "default"): Promise<number> {
    const key = `ratelimit:${this.config.provider}:${identifier}`;

    try {
      const ttl = await this.redis.ttl(key);
      return ttl > 0 ? ttl * 1000 : 0;
    } catch (error) {
      console.error("Redis rate limiter error:", error);
      return 0;
    }
  }
}
