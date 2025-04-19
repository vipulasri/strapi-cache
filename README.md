# 🧠 strapi-cache

**A powerful LRU-Cache plugin for Strapi v5**  
Boost your API performance with automatic in-memory caching for REST and GraphQL requests.

![npm version](https://img.shields.io/badge/version-1.0.0-blue)
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
      max: 1000, // Maximum number of items in the cache
      ttl: 1000 * 60 * 60, // Time to live for cache items (1 hour)
      size: 1024 * 1024 * 1024, // Maximum size of the cache (1 GB)
      allowStale: false, // Allow stale cache items
      cacheableRoutes: ['/api/products', '/api/categories'], // Caches routes which start with these paths (if empty array, all '/api' routes are cached)
    },
  },
```

## 🗂️ How It Works

- **In-Memory Storage**: The plugin keeps cached data in memory using an LRU strategy. It checks the cache before querying the database.
- **Powered by `lru-cache`**: Uses the popular `lru-cache` library for managing the cache efficiently.
- **Automatic Invalidation**: Cache is cleared automatically when content is updated, deleted, or created. (GraphQL cache clears on any content update.)
- **`no-cache` Header Support**: Respects the `no-cache` header, letting you skip the cache by setting `Cache-Control: no-cache` in your request.
- **Default Cached Requests**: By default, caches all GET requests to `/api` and POST requests to `/graphql`. You can customize which content types to cache in the settings (only for GET requests).

## 🔮 Planned Features

- [x] **Cache Invalidation**: Automatically invalidate cache on content updates, deletions, or creations.
- [x] **GraphQL Caching**: Cache GraphQL queries.
- [ ] **Purge Cache in Settings**: Add a UI option in the Strapi admin panel to manually purge the cache.
- [x] **Route/Content-Type Specific Caching**: Allow users to define which routes should be cached based.
- [ ] **Switchable Cache Providers**: Explore support for other caching providers like Redis for distributed caching.

## 🛠️ Contributing

Contributions are welcome! If you have suggestions or improvements, please open an issue or submit a pull request.
