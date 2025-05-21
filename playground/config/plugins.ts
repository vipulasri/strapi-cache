export default ({ env }) => ({
  'strapi-cache': {
    enabled: true,
    config: {
      debug: false, // Enable debug logs
      max: 1000, // Maximum number of items in the cache (only for memory cache)
      ttl: 1000 * 60 * 60, // Time to live for cache items (1 hour)
      size: 1024 * 1024 * 1024, // Maximum size of the cache (1 GB) (only for memory cache)
      allowStale: false, // Allow stale cache items (only for memory cache)
      cacheableRoutes: [], // Caches routes which start with these paths (if empty array, all '/api' routes are cached)
      provider: 'redis', // Cache provider ('memory' or 'redis')
      redisConfig: env('REDIS_URL', 'redis://localhost:6379'), // Redis config takes either a string or an object see https://ioredis.readthedocs.io/en/stable/README for references to what object is available, the object or string is passed directly to ioredis client (if using Redis)
    },
  },
});
