# 🧠 strapi-cache

**A powerful LRU-Cache plugin for Strapi v5**  
Boost your API performance with automatic in-memory or Redis caching for REST and GraphQL requests.

![npm version](https://img.shields.io/badge/version-1.4.7-blue)
![Strapi Version](https://img.shields.io/badge/strapi-v5-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![npm](https://img.shields.io/npm/dt/strapi-cache)

---

## ✨ Features

- ⚡️ **Cache REST API responses**
- 🔮 **Cache GraphQL queries**
- ♻️ **LRU (Least Recently Used) caching strategy**
- 🔧 Simple integration with Strapi config
- 📦 Lightweight with zero overhead
- 🗄️ **Supports in-memory and Redis caching**

---

## 🚀 Installation

Install via npm or yarn:

```bash
npm install strapi-cache
```

or

```bash
yarn add strapi-cache
```

## ⚙️ Configuration

In your Strapi project, navigate to `config/plugins.js` and add the following configuration:

```javascript
// config/plugins.{js,ts}
'strapi-cache': {
  enabled: true,
  config: {
    debug: false, // Enable debug logs
    max: 1000, // Maximum number of items in the cache (only for memory cache)
    ttl: 1000 * 60 * 60, // Time to live for cache items (1 hour)
    size: 1024 * 1024 * 1024, // Maximum size of the cache (1 GB) (only for memory cache)
    allowStale: false, // Allow stale cache items (only for memory cache)
    cacheableRoutes: ['/api/products', '/api/categories'], // Caches routes which start with these paths (if empty array, all '/api' routes are cached)
    provider: 'memory', // Cache provider ('memory' or 'redis')
    redisConfig: env('REDIS_URL', 'redis://localhost:6379'), // Redis config takes either a string or an object see https://ioredis.readthedocs.io/en/stable/README for references to what object is available, the object or string is passed directly to ioredis client (if using Redis)
  },
},
```

## 🔍 Routes

The plugin creates three new routes

- `POST /strapi-cache/purge-cache` (purges the whole cache)
- `POST /strapi-cache/purge-cache/:key` (purges cache entries with have the key in the cache key)
- `GET /strapi-cache/cacheable-routes` (returns the cacheable routes defined in the config)

All of these routes are protected by the policies `admin::isAuthenticatedAdmin` and `plugin::strapi-cache.purge-cache`. The `plugin::strapi-cache.purge-cache` policy can be managed in the plugin's permissions section under the settings.

## 🗂️ How It Works

- **Storage**: The plugin keeps cached data in memory or Redis, depending on the configuration.
- **Packages**: Uses [lru-cache](https://github.com/isaacs/node-lru-cache) for in-memory cache. Uses [ioredis](https://github.com/redis/ioredis) for Redis caching.
- **Automatic Invalidation**: Cache is cleared automatically when content is updated, deleted, or created. (GraphQL cache clears on any content update.)
- **`no-cache` Header Support**: Respects the `no-cache` header, letting you skip the cache by setting `Cache-Control: no-cache` in your request.
- **Default Cached Requests**: By default, caches all GET requests to `/api` and POST requests to `/graphql`. You can customize which content types to cache in the config (only for GET requests).

## 🔮 Planned Features

- [x] **Cache Invalidation**: Automatically invalidate cache on content updates, deletions, or creations.
- [x] **GraphQL Caching**: Cache GraphQL queries.
- [x] **Purge Cache Button**: Add a UI option in the Strapi admin panel to manually purge the cache for content-types.
- [ ] **Purge Whole Cache Button**: Add a UI option in the Strapi admin settings panel to purge the whole cache.
- [x] **Route/Content-Type Specific Caching**: Allow users to define which routes should be cached based.
- [x] **Switchable Cache Providers**: Explore support for other caching providers like Redis for distributed caching.

## 🛑 Problems

If you encounter any issues, please feel free to open an issue on the [GitHub repo](https://github.com/TupiC/strapi-cache/issues/new).

## 🛠️ Troubleshooting

If you encounter an error like:

```
Access to fetch at 'http://your-backend.com' from origin 'http://your-origin.com' has been blocked by CORS policy:
Request header field cache-control is not allowed by Access-Control-Allow-Headers in preflight response.
```

You might need to adjust your CORS middlware settings in Strapi:

```javascript
// config/middlewares.{js,ts}
'strapi::cors';
```

with:

```javascript
// config/middlewares.{js,ts}
{
  name: "strapi::cors",
  config: {
    headers: ["Content-Type", "Authorization", "Cache-Control"], // Add 'Cache-Control' to the allowed headers
  },
},
```

## 🛠️ Contributing

Contributions are welcome! If you have suggestions or improvements, please open an issue or submit a pull request.
