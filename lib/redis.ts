import { createClient } from "redis";

declare global {
  // Using a broad type to avoid conflicts between multiple RedisClientType versions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __redis: any | undefined;
}

const createRedisClient = () => {
  const client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    },
  });

  client.on("error", (error) => {
    console.error("Redis Client Error:", error);
  });

  client.on("connect", () => {
    console.log("Redis Client Connected");
  });

  client.on("ready", () => {
    console.log("Redis Client Ready");
  });

  return client;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const redis: any = globalThis.__redis || createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__redis = redis;
}

// Cache helpers
export const cacheHelpers = {
  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  // Set cache value with optional TTL (seconds)
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setEx(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  },

  // Delete cache value
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  },

  // Clear all cache with matching pattern
  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error("Cache clear pattern error:", error);
    }
  },
};

// Rate limiting helper
export const rateLimit = {
  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const windowSec = Math.ceil(windowMs / 1000);

    try {
      // Ensure Redis connection is open before operating
      if (!redis.isOpen) {
        await redis.connect();
      }
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;
      const ttl = await redis.ttl(key);
      const resetTime = Date.now() + ttl * 1000;

      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error("Rate limit check error:", error);
      // Allow request if Redis is down
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + windowMs,
      };
    }
  },
};

// Session storage helper
export const sessionStore = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getSession(sessionId: string): Promise<any | null> {
    return cacheHelpers.get(`session:${sessionId}`);
  },

  async setSession(
    sessionId: string,
    // Accept arbitrary serializable session data
    sessionData: Record<string, unknown>,
    ttl: number = 86400
  ): Promise<void> {
    return cacheHelpers.set(`session:${sessionId}`, sessionData, ttl);
  },

  async deleteSession(sessionId: string): Promise<void> {
    return cacheHelpers.del(`session:${sessionId}`);
  },

  async refreshSession(sessionId: string, ttl: number = 86400): Promise<void> {
    await redis.expire(`session:${sessionId}`, ttl);
  },
};

// Real-time counters
export const counters = {
  async increment(key: string, amount: number = 1): Promise<number> {
    return redis.incrBy(key, amount);
  },

  async decrement(key: string, amount: number = 1): Promise<number> {
    return redis.decrBy(key, amount);
  },

  async get(key: string): Promise<number> {
    const value = await redis.get(key);
    return value ? parseInt(value, 10) : 0;
  },

  async set(key: string, value: number): Promise<void> {
    await redis.set(key, value.toString());
  },

  async expire(key: string, ttl: number): Promise<void> {
    await redis.expire(key, ttl);
  },
};

// Initialize Redis connection
export async function initializeRedis(): Promise<void> {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
}

// Graceful shutdown
process.on("beforeExit", async () => {
  if (redis.isOpen) {
    await redis.quit();
  }
});

export { redis };
export default redis;
