# 🧠 strapi-cache

**A powerful LRU-Cache plugin for Strapi v5**  
Boost your API performance with automatic caching for REST and GraphQL requests.

![npm version](https://img.shields.io/badge/version-1.0.0-blue)
![Strapi Version](https://img.shields.io/badge/strapi-v5-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

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
    },
  },
```
