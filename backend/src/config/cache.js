const NodeCache = require('node-cache');
const Redis = require('ioredis');

const memoryCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
let redisClient = null;
let useRedis = false;

if (process.env.REDIS_URL && process.env.NODE_ENV !== 'test') {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    redisClient.connect()
      .then(() => {
        useRedis = true;
        console.log('[Cache] Connected to Redis');
      })
      .catch((err) => {
        console.warn(`[Cache] Redis connection failed (${err.message}). Using in-memory cache.`);
        useRedis = false;
      });
  } catch (err) {
    useRedis = false;
  }
}

const cache = {
  async get(key) {
    try {
      if (useRedis && redisClient) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      }
      return memoryCache.get(key) || null;
    } catch (err) {
      console.warn(`[Cache] Get error: ${err.message}`);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      if (useRedis && redisClient) {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } else {
        memoryCache.set(key, value, ttlSeconds);
      }
    } catch (err) {
      console.warn(`[Cache] Set error: ${err.message}`);
    }
  },

  async del(key) {
    try {
      if (useRedis && redisClient) {
        await redisClient.del(key);
      } else {
        memoryCache.del(key);
      }
    } catch (err) {
      console.warn(`[Cache] Del error: ${err.message}`);
    }
  },

  async flush() {
    try {
      if (useRedis && redisClient) {
        await redisClient.flushall();
      } else {
        memoryCache.flushAll();
      }
    } catch (err) {
      console.warn(`[Cache] Flush error: ${err.message}`);
    }
  }
};

module.exports = cache;
