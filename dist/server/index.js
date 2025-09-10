"use strict";
const crypto = require("crypto");
const Stream = require("stream");
const zlib = require("zlib");
const rawBody = require("raw-body");
const lruCache = require("lru-cache");
const ioredis = require("ioredis");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const Stream__default = /* @__PURE__ */ _interopDefault(Stream);
const rawBody__default = /* @__PURE__ */ _interopDefault(rawBody);
const loggy = {
  info: (msg) => {
    const shouldDebug = strapi.plugin("strapi-cache").config("debug") ?? false;
    if (!shouldDebug) {
      return;
    }
    strapi.log.info(`[STRAPI CACHE] ${msg}`);
  },
  error: (msg) => {
    const shouldDebug = strapi.plugin("strapi-cache").config("debug") ?? false;
    if (!shouldDebug) {
      return;
    }
    strapi.log.error(`[STRAPI CACHE] ${msg}`);
  },
  warn: (msg) => {
    const shouldDebug = strapi.plugin("strapi-cache").config("debug") ?? false;
    if (!shouldDebug) {
      return;
    }
    strapi.log.warn(`[STRAPI CACHE] ${msg}`);
  }
};
async function invalidateCache(event, cacheStore, strapi2) {
  const { model } = event;
  const uid = model.uid;
  try {
    const contentType = strapi2.contentType(uid);
    if (!contentType || !contentType.kind) {
      loggy.info(`Content type ${uid} not found`);
      return;
    }
    const pluralName = contentType.kind === "singleType" ? contentType.info.singularName : contentType.info.pluralName;
    const apiPath = `/api/${pluralName}`;
    const regex = new RegExp(`^.*:${apiPath}(/.*)?(\\?.*)?$`);
    await cacheStore.clearByRegexp([regex]);
    loggy.info(`Invalidated cache for ${apiPath}`);
  } catch (error) {
    loggy.error("Cache invalidation error:");
    loggy.error(error);
  }
}
async function invalidateGraphqlCache(event, cacheStore, strapi2) {
  try {
    const graphqlRegex = new RegExp(`^POST:/graphql(:.*)?$`);
    await cacheStore.clearByRegexp([graphqlRegex]);
    loggy.info(`Invalidated cache for ${graphqlRegex}`);
  } catch (error) {
    loggy.error("Cache invalidation error:");
    loggy.error(error);
  }
}
const actions = [
  {
    section: "plugins",
    displayName: "Purge Cache",
    uid: "purge-cache",
    pluginName: "strapi-cache"
  }
];
const bootstrap = ({ strapi: strapi2 }) => {
  loggy.info("Initializing");
  try {
    const cacheService = strapi2.plugin("strapi-cache").services.service;
    const autoPurgeCache = strapi2.plugin("strapi-cache").config("autoPurgeCache");
    const autoPurgeCacheOnStart = strapi2.plugin("strapi-cache").config("autoPurgeCacheOnStart");
    const cacheStore = cacheService.getCacheInstance();
    if (!cacheStore) {
      loggy.error("Plugin could not be initialized");
      return;
    }
    cacheStore.init();
    if (autoPurgeCache) {
      strapi2.db.lifecycles.subscribe({
        async afterCreate(event) {
          await invalidateCache(event, cacheStore, strapi2);
          await invalidateGraphqlCache(event, cacheStore, strapi2);
        },
        async afterUpdate(event) {
          await invalidateCache(event, cacheStore, strapi2);
          await invalidateGraphqlCache(event, cacheStore, strapi2);
        },
        async afterDelete(event) {
          await invalidateCache(event, cacheStore, strapi2);
          await invalidateGraphqlCache(event, cacheStore, strapi2);
        }
      });
    }
    if (autoPurgeCacheOnStart) {
      cacheStore.reset().then(() => {
        loggy.info("Cache purged successfully");
      }).catch((error) => {
        loggy.error(`Error purging cache on start: ${error.message}`);
      });
    }
  } catch (error) {
    loggy.error("Plugin could not be initialized");
    return;
  }
  loggy.info("Plugin initialized");
  strapi2.admin.services.permission.actionProvider.registerMany(actions);
};
const generateCacheKey = (context) => {
  const { url } = context.request;
  const { method } = context.request;
  return `${method}:${url}`;
};
const generateGraphqlCacheKey = (payload) => {
  const hash = crypto.createHash("sha256").update(payload).digest("base64url");
  return `POST:/graphql:${hash}`;
};
const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
const decompressBuffer = async (buffer, encoding) => {
  return new Promise((resolve, reject) => {
    let decompressStream;
    switch (encoding) {
      case "gzip":
        decompressStream = zlib.createGunzip();
        break;
      case "br":
        decompressStream = zlib.createBrotliDecompress();
        break;
      case "deflate":
        decompressStream = zlib.createInflate();
        break;
      default:
        return resolve(buffer);
    }
    const chunks = [];
    decompressStream.on("data", (chunk) => chunks.push(chunk));
    decompressStream.on("end", () => resolve(Buffer.concat(chunks)));
    decompressStream.on("error", reject);
    decompressStream.end(buffer);
  });
};
const decodeBufferToText = (buffer) => {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(buffer);
};
function getHeadersToStore(ctx, cacheHeaders, cacheHeadersAllowList = [], cacheHeadersDenyList = []) {
  let headersToStore = null;
  if (cacheHeaders) {
    let headers = ctx.response.headers;
    if (cacheHeadersAllowList.length) {
      headers = Object.fromEntries(
        Object.entries(headers).filter(([key]) => cacheHeadersAllowList.includes(key.toLowerCase()))
      );
    }
    if (cacheHeadersDenyList.length) {
      headers = Object.fromEntries(
        Object.entries(headers).filter(([key]) => !cacheHeadersDenyList.includes(key.toLowerCase()))
      );
    }
    headersToStore = headers;
  }
  return headersToStore;
}
function getCacheHeaderConfig() {
  const cacheHeaders = strapi.plugin("strapi-cache").config("cacheHeaders");
  const cacheHeadersDenyList = strapi.plugin("strapi-cache").config("cacheHeadersDenyList");
  const cacheHeadersAllowList = strapi.plugin("strapi-cache").config("cacheHeadersAllowList");
  const cacheAuthorizedRequests = strapi.plugin("strapi-cache").config("cacheAuthorizedRequests");
  return {
    cacheHeaders,
    cacheHeadersDenyList,
    cacheHeadersAllowList,
    cacheAuthorizedRequests
  };
}
const middleware$1 = async (ctx, next) => {
  const cacheService = strapi.plugin("strapi-cache").services.service;
  const cacheableRoutes = strapi.plugin("strapi-cache").config("cacheableRoutes");
  const excludeRoutes = strapi.plugin("strapi-cache").config("excludeRoutes");
  const { cacheHeaders, cacheHeadersDenyList, cacheHeadersAllowList, cacheAuthorizedRequests } = getCacheHeaderConfig();
  const cacheStore = cacheService.getCacheInstance();
  const { url } = ctx.request;
  const key = generateCacheKey(ctx);
  const cacheEntry = await cacheStore.get(key);
  const cacheControlHeader = ctx.request.headers["cache-control"];
  const noCache = cacheControlHeader && cacheControlHeader.includes("no-cache");
  const routeIsExcluded = excludeRoutes.some((route) => url.startsWith(route));
  if (routeIsExcluded) {
    loggy.info(`Route excluded from cache: ${url}`);
    await next();
    return;
  }
  const routeIsCachable = cacheableRoutes.some((route) => url.startsWith(route)) || cacheableRoutes.length === 0 && url.startsWith("/api");
  const authorizationHeader = ctx.request.headers["authorization"];
  if (authorizationHeader && !cacheAuthorizedRequests) {
    loggy.info(`Authorized request bypassing cache: ${key}`);
    await next();
    return;
  }
  if (cacheEntry && !noCache) {
    loggy.info(`HIT with key: ${key}`);
    ctx.status = 200;
    ctx.body = cacheEntry.body;
    if (cacheHeaders) {
      ctx.set(cacheEntry.headers);
    }
    const middlewaresConfig = strapi.config.get("middlewares");
    const corsMiddleware = middlewaresConfig.find((mw) => mw.name === "strapi::cors");
    if (corsMiddleware) {
      loggy.info("CORS middleware is set, checking allowed origins");
      const corsConfig = corsMiddleware?.config;
      const origin = ctx?.request?.headers?.origin;
      let allowedOrigins = corsConfig?.origin ?? "*";
      if (typeof allowedOrigins === "string") {
        allowedOrigins = [allowedOrigins];
      }
      if (allowedOrigins.includes(origin)) {
        loggy.info(`Setting Access-Control-Allow-Origin to ${origin}`);
        ctx.set("Access-Control-Allow-Origin", origin);
      } else if (typeof origin === "undefined" || allowedOrigins.includes("*")) {
        loggy.info("No origin header or * in allowed origins, setting to *");
        ctx.set("Access-Control-Allow-Origin", "*");
      }
    } else {
      loggy.info("No CORS middleware set, setting to request origin or *");
      ctx.set("Access-Control-Allow-Origin", ctx.request.headers.origin || "*");
    }
    return;
  }
  await next();
  if (ctx.method === "GET" && ctx.status >= 200 && ctx.status < 300 && routeIsCachable) {
    loggy.info(`MISS with key: ${key}`);
    const headersToStore = getHeadersToStore(
      ctx,
      cacheHeaders,
      cacheHeadersAllowList,
      cacheHeadersDenyList
    );
    if (ctx.body instanceof Stream__default.default) {
      const buf = await streamToBuffer(ctx.body);
      const contentEncoding = ctx.response.headers["content-encoding"];
      const decompressed = await decompressBuffer(buf, contentEncoding);
      const responseText = decodeBufferToText(decompressed);
      await cacheStore.set(key, { body: responseText, headers: headersToStore });
      ctx.body = buf;
    } else {
      await cacheStore.set(key, { body: ctx.body, headers: headersToStore });
    }
  }
};
const middleware = async (ctx, next) => {
  const cacheService = strapi.plugin("strapi-cache").services.service;
  const { cacheHeaders, cacheHeadersDenyList, cacheHeadersAllowList, cacheAuthorizedRequests } = getCacheHeaderConfig();
  const cacheStore = cacheService.getCacheInstance();
  const { url } = ctx.request;
  const originalReq = ctx.req;
  const bodyBuffer = await rawBody__default.default(originalReq);
  const body = bodyBuffer.toString();
  const clonedReq = new Stream.Readable();
  clonedReq.push(bodyBuffer);
  clonedReq.push(null);
  clonedReq.headers = { ...originalReq.headers };
  clonedReq.method = originalReq.method;
  clonedReq.url = originalReq.url;
  clonedReq.httpVersion = originalReq.httpVersion;
  clonedReq.socket = originalReq.socket;
  clonedReq.connection = originalReq.connection;
  ctx.req = clonedReq;
  ctx.request.req = clonedReq;
  const isIntrospectionQuery = body.includes("IntrospectionQuery");
  if (isIntrospectionQuery) {
    loggy.info("Skipping cache for introspection query");
    await next();
    return;
  }
  const key = generateGraphqlCacheKey(body);
  const cacheEntry = await cacheStore.get(key);
  const cacheControlHeader = ctx.request.headers["cache-control"];
  const noCache = cacheControlHeader && cacheControlHeader.includes("no-cache");
  const authorizationHeader = ctx.request.headers["authorization"];
  if (authorizationHeader && !cacheAuthorizedRequests) {
    loggy.info(`Authorized request bypassing cache: ${key}`);
    await next();
    return;
  }
  if (cacheEntry && !noCache) {
    loggy.info(`HIT with key: ${key}`);
    ctx.status = 200;
    ctx.body = cacheEntry.body;
    if (cacheHeaders) {
      ctx.set(cacheEntry.headers);
    }
    const middlewaresConfig = strapi.config.get("middlewares");
    const corsMiddleware = middlewaresConfig.find((mw) => mw.name === "strapi::cors");
    if (corsMiddleware) {
      loggy.info("CORS middleware is set, checking allowed origins");
      const corsConfig = corsMiddleware?.config;
      const origin = ctx?.request?.headers?.origin;
      let allowedOrigins = corsConfig?.origin ?? "*";
      if (typeof allowedOrigins === "string") {
        allowedOrigins = [allowedOrigins];
      }
      if (allowedOrigins.includes(origin)) {
        loggy.info(`Setting Access-Control-Allow-Origin to ${origin}`);
        ctx.set("Access-Control-Allow-Origin", origin);
      } else if (typeof origin === "undefined" || allowedOrigins.includes("*")) {
        loggy.info("No origin header or * in allowed origins, setting to *");
        ctx.set("Access-Control-Allow-Origin", "*");
      }
    } else {
      loggy.info("No CORS middleware set, setting to request origin or *");
      ctx.set("Access-Control-Allow-Origin", ctx.request.headers.origin || "*");
    }
    return;
  }
  await next();
  if (ctx.method === "POST" && ctx.status >= 200 && ctx.status < 300 && url.startsWith("/graphql")) {
    loggy.info(`MISS with key: ${key}`);
    const headers = ctx.request.headers;
    const authorizationHeader2 = headers["authorization"];
    if (authorizationHeader2 && !cacheAuthorizedRequests) {
      loggy.info(`Authorized request not caching: ${key}`);
      return;
    }
    const headersToStore = getHeadersToStore(
      ctx,
      cacheHeaders,
      cacheHeadersAllowList,
      cacheHeadersDenyList
    );
    if (ctx.body instanceof Stream__default.default) {
      const buf = await streamToBuffer(ctx.body);
      const contentEncoding = ctx.response.headers["content-encoding"];
      const decompressed = await decompressBuffer(buf, contentEncoding);
      const responseText = decodeBufferToText(decompressed);
      await cacheStore.set(key, { body: responseText, headers: headersToStore });
      ctx.body = buf;
    } else {
      await cacheStore.set(key, { body: ctx.body, headers: headersToStore });
    }
  }
};
const middlewares = {
  graphql: middleware,
  cache: middleware$1
};
const register = ({ strapi: strapi2 }) => {
  strapi2.server.use(middlewares.cache);
  strapi2.server.use(middlewares.graphql);
};
const config = {
  default: ({ env }) => ({
    debug: false,
    max: 1e3,
    ttl: 1e3 * 60 * 60,
    size: 1024 * 1024 * 10,
    allowStale: false,
    cacheableRoutes: [],
    provider: "memory",
    excludeRoutes: [],
    redisConfig: env("REDIS_URL"),
    redisClusterNodes: [],
    redisClusterOptions: {},
    cacheHeaders: true,
    cacheHeadersDenyList: [],
    cacheHeadersAllowList: [],
    cacheAuthorizedRequests: false,
    cacheGetTimeoutInMs: 1e3,
    autoPurgeCache: true,
    autoPurgeCacheOnStart: true
  }),
  validator: (config2) => {
    if (typeof config2.debug !== "boolean") {
      throw new Error(`Invalid config: debug must be a boolean`);
    }
    if (typeof config2.max !== "number") {
      throw new Error(`Invalid config: max must be a number`);
    }
    if (typeof config2.ttl !== "number") {
      throw new Error(`Invalid config: ttl must be a number`);
    }
    if (typeof config2.size !== "number") {
      throw new Error(`Invalid config: size must be a number`);
    }
    if (typeof config2.allowStale !== "boolean") {
      throw new Error(`Invalid config: allowStale must be a boolean`);
    }
    if (!Array.isArray(config2.cacheableRoutes) || config2.cacheableRoutes.some((item) => typeof item !== "string")) {
      throw new Error(`Invalid config: cacheableRoutes must be an string array`);
    }
    if (!Array.isArray(config2.excludeRoutes) || config2.excludeRoutes.some((item) => typeof item !== "string")) {
      throw new Error(`Invalid config: excludeRoutes must be a string array`);
    }
    if (typeof config2.provider !== "string") {
      throw new Error(`Invalid config: provider must be a string`);
    }
    if (config2.provider !== "memory" && config2.provider !== "redis") {
      throw new Error(`Invalid config: provider must be 'memory' or 'redis'`);
    }
    if (config2.provider === "redis") {
      if (!config2.redisConfig) {
        throw new Error(`Invalid config: redisConfig must be set when using redis provider`);
      }
      if (typeof config2.redisConfig !== "string" && typeof config2.redisConfig !== "object") {
        throw new Error(`Invalid config: redisConfig must be a string or object when using redis provider`);
      }
      if (!Array.isArray(config2.redisClusterNodes) || config2.redisClusterNodes.some((item) => !("host" in item && "port" in item))) {
        throw new Error(
          `Invalid config: redisClusterNodes must be as a list of objects with keys 'host' and 'port'`
        );
      }
      if (typeof config2.redisClusterOptions !== "object") {
        throw new Error(`Invalid config: redisClusterOptions must be an object`);
      }
    }
    if (typeof config2.cacheHeaders !== "boolean") {
      throw new Error(`Invalid config: cacheHeaders must be a boolean`);
    }
    if (!Array.isArray(config2.cacheHeadersDenyList) || config2.cacheHeadersDenyList.some((item) => typeof item !== "string")) {
      throw new Error(`Invalid config: cacheHeadersDenyList must be an string array`);
    }
    if (!Array.isArray(config2.cacheHeadersAllowList) || config2.cacheHeadersAllowList.some((item) => typeof item !== "string")) {
      throw new Error(`Invalid config: cacheHeadersAllowList must be an string array`);
    }
    if (typeof config2.cacheAuthorizedRequests !== "boolean") {
      throw new Error(`Invalid config: cacheAuthorizedRequests must be a boolean`);
    }
    if (typeof config2.cacheGetTimeoutInMs !== "number") {
      throw new Error(`Invalid config: cacheGetTimeoutInMs must be a number`);
    }
    if (typeof config2.autoPurgeCache !== "boolean") {
      throw new Error(`Invalid config: autoPurgeCache must be a boolean`);
    }
    if (typeof config2.autoPurgeCacheOnStart !== "boolean") {
      throw new Error(`Invalid config: autoPurgeCacheOnStart must be a boolean`);
    }
  }
};
const contentTypes = {};
const controller = ({ strapi: strapi2 }) => ({
  async purgeCache(ctx) {
    const service2 = strapi2.plugin("strapi-cache").service("service");
    await service2.getCacheInstance().reset();
    ctx.body = {
      message: "Cache purged successfully"
    };
  },
  async purgeCacheByKey(ctx) {
    const { key } = ctx.params;
    const service2 = strapi2.plugin("strapi-cache").service("service");
    const regex = new RegExp(`(^|/)?${key}(/|\\?|$)`);
    await service2.getCacheInstance().clearByRegexp([regex]);
    ctx.body = {
      message: `Cache purged successfully for key: ${key}`
    };
  },
  async cacheableRoutes(ctx) {
    const cacheableRoutes = strapi2.plugin("strapi-cache").config("cacheableRoutes");
    ctx.body = cacheableRoutes;
  }
});
const controllers = {
  controller
};
const policies = {};
const purgeRoute = [
  {
    method: "POST",
    path: "/purge-cache",
    handler: "controller.purgeCache",
    config: {
      policies: [
        "admin::isAuthenticatedAdmin",
        {
          name: "plugin::content-manager.hasPermissions",
          config: {
            actions: ["plugin::strapi-cache.purge-cache"]
          }
        }
      ]
    }
  },
  {
    method: "POST",
    path: "/purge-cache/:key",
    handler: "controller.purgeCacheByKey",
    config: {
      policies: [
        "admin::isAuthenticatedAdmin",
        {
          name: "plugin::content-manager.hasPermissions",
          config: {
            actions: ["plugin::strapi-cache.purge-cache"]
          }
        }
      ]
    }
  },
  {
    method: "GET",
    path: "/cacheable-routes",
    handler: "controller.cacheableRoutes",
    config: {
      policies: [
        "admin::isAuthenticatedAdmin",
        {
          name: "plugin::content-manager.hasPermissions",
          config: {
            actions: ["plugin::strapi-cache.purge-cache"]
          }
        }
      ]
    }
  }
];
const routes = {
  "purge-route": {
    type: "admin",
    routes: purgeRoute
  }
};
const withTimeout = (callback, ms) => {
  let timeout = null;
  return Promise.race([
    callback().then((result) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      return result;
    }),
    new Promise((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error("timeout"));
      }, ms);
    })
  ]);
};
class InMemoryCacheProvider {
  constructor(strapi2) {
    this.strapi = strapi2;
    this.initialized = false;
  }
  init() {
    if (this.initialized) {
      loggy.error("Provider already initialized");
      return;
    }
    this.initialized = true;
    const max = Number(this.strapi.plugin("strapi-cache").config("max"));
    const ttl = Number(this.strapi.plugin("strapi-cache").config("ttl"));
    const size = Number(this.strapi.plugin("strapi-cache").config("size"));
    const allowStale = Boolean(this.strapi.plugin("strapi-cache").config("allowStale"));
    this.provider = new lruCache.LRUCache({
      max,
      ttl,
      size,
      allowStale
    });
    this.cacheGetTimeoutInMs = Number(
      this.strapi.plugin("strapi-cache").config("cacheGetTimeoutInMs")
    );
    loggy.info("Provider initialized");
  }
  get ready() {
    if (!this.initialized) {
      loggy.info("Provider not initialized");
      return false;
    }
    return true;
  }
  async get(key) {
    if (!this.ready) return null;
    return withTimeout(
      () => new Promise((resolve) => {
        resolve(this.provider.get(key));
      }),
      this.cacheGetTimeoutInMs
    ).catch((error) => {
      loggy.error(`Error during get: ${error?.message || error}`);
      return null;
    });
  }
  async set(key, val) {
    if (!this.ready) return null;
    try {
      return this.provider.set(key, val);
    } catch (error) {
      loggy.error(`Error during set: ${error}`);
      return null;
    }
  }
  async del(key) {
    if (!this.ready) return null;
    try {
      loggy.info(`PURGING KEY: ${key}`);
      return this.provider.delete(key);
    } catch (error) {
      loggy.error(`Error during delete: ${error}`);
      return null;
    }
  }
  async keys() {
    if (!this.ready) return null;
    try {
      return Array.from(this.provider.keys());
    } catch (error) {
      loggy.error(`Error fetching keys: ${error}`);
      return null;
    }
  }
  async reset() {
    if (!this.ready) return null;
    try {
      const allKeys = await this.keys();
      if (!allKeys) return null;
      loggy.info(`PURGING ALL KEYS: ${allKeys.length}`);
      await Promise.all(allKeys.map((key) => this.del(key)));
      return true;
    } catch (error) {
      loggy.error(`Error during reset: ${error}`);
      return null;
    }
  }
  async clearByRegexp(regExps) {
    const keys = await this.keys() || [];
    const matches = keys.filter((key) => regExps.some((re) => re.test(key)));
    await Promise.all(matches.map((key) => this.del(key)));
  }
}
class RedisCacheProvider {
  constructor(strapi2) {
    this.strapi = strapi2;
    this.initialized = false;
  }
  init() {
    if (this.initialized) {
      loggy.error("Redis provider already initialized");
      return;
    }
    try {
      const redisConfig = this.strapi.plugin("strapi-cache").config("redisConfig") || "redis://localhost:6379";
      const redisClusterNodes = this.strapi.plugin("strapi-cache").config("redisClusterNodes");
      this.cacheGetTimeoutInMs = Number(
        this.strapi.plugin("strapi-cache").config("cacheGetTimeoutInMs")
      );
      this.keyPrefix = this.strapi.plugin("strapi-cache").config("redisConfig")?.["keyPrefix"] ?? "";
      if (redisClusterNodes.length) {
        const redisClusterOptions = this.strapi.plugin("strapi-cache").config("redisClusterOptions");
        if (!redisClusterOptions["redisOptions"]) {
          redisClusterOptions.redisOptions = redisConfig;
        }
        this.client = new ioredis.Redis.Cluster(redisClusterNodes, redisClusterOptions);
      } else {
        this.client = new ioredis.Redis(redisConfig);
      }
      this.initialized = true;
      loggy.info("Redis provider initialized");
    } catch (error) {
      loggy.error(error);
    }
  }
  get ready() {
    if (!this.initialized) {
      loggy.info("Redis provider not initialized");
      return false;
    }
    return true;
  }
  async get(key) {
    if (!this.ready) return null;
    return withTimeout(() => this.client.get(key), this.cacheGetTimeoutInMs).then((data) => data ? JSON.parse(data) : null).catch((error) => {
      loggy.error(`Redis get error: ${error?.message || error}`);
      return null;
    });
  }
  async set(key, val) {
    if (!this.ready) return null;
    try {
      const ttlInMs = Number(this.strapi.plugin("strapi-cache").config("ttl"));
      const ttlInS = Number((ttlInMs / 1e3).toFixed());
      const serialized = JSON.stringify(val);
      if (ttlInS > 0) {
        await this.client.set(key, serialized, "EX", ttlInS);
      } else {
        await this.client.set(key, serialized);
      }
      return val;
    } catch (error) {
      loggy.error(`Redis set error: ${error}`);
      return null;
    }
  }
  async del(key) {
    if (!this.ready) return null;
    try {
      const relativeKey = key.slice(this.keyPrefix.length);
      loggy.info(`Redis PURGING KEY: ${relativeKey}`);
      await this.client.del(relativeKey);
      return true;
    } catch (error) {
      loggy.error(`Redis del error: ${error}`);
      return null;
    }
  }
  async keys() {
    if (!this.ready) return null;
    try {
      const keys = await this.client.keys(`${this.keyPrefix}*`);
      return keys;
    } catch (error) {
      loggy.error(`Redis keys error: ${error}`);
      return null;
    }
  }
  async reset() {
    if (!this.ready) return null;
    try {
      if (this.keyPrefix) {
        loggy.info(`Redis FLUSHING NAMESPACE: ${this.keyPrefix}`);
        const keys = await this.keys();
        if (!keys) return null;
        const toDelete = keys.filter((key) => key.startsWith(this.keyPrefix));
        await Promise.all(toDelete.map((key) => this.del(key)));
        return true;
      }
      loggy.info(`Redis FLUSHING ALL KEYS`);
      await this.client.flushdb();
      return true;
    } catch (error) {
      loggy.error(`Redis reset error: ${error}`);
      return null;
    }
  }
  async clearByRegexp(regExps) {
    const keys = await this.keys();
    if (!keys) return;
    const toDelete = keys.filter((key) => regExps.some((re) => re.test(key)));
    await Promise.all(toDelete.map((key) => this.del(key)));
  }
}
const resolveCacheProvider = (strapi2) => {
  const providerType = strapi2.plugin("strapi-cache").config("provider") || "memory";
  loggy.info(`Selected cache provider: ${providerType}`);
  let instance;
  switch (providerType) {
    case "redis":
      instance = new RedisCacheProvider(strapi2);
      break;
    default:
      instance = new InMemoryCacheProvider(strapi2);
      break;
  }
  return instance;
};
const service = ({ strapi: strapi2 }) => {
  let instance = null;
  return {
    getCacheInstance() {
      if (!instance) {
        loggy.info("Initializing cache service from provider config...");
        instance = resolveCacheProvider(strapi2);
      }
      return instance;
    }
  };
};
const services = {
  service
};
const index = {
  register,
  bootstrap,
  destroy() {
  },
  config,
  controllers,
  routes,
  services,
  contentTypes,
  policies,
  middlewares
};
module.exports = index;
