import { Context } from 'koa';
import { generateCacheKey } from '../utils/key';
import { CacheService } from 'src/types/cache.types';
import { loggy } from '../utils/log';

const middleware = async (ctx: Context, next: any) => {
  const cacheService = strapi.plugin('strapi-cache').services.service as CacheService;
  const cacheStore = cacheService.createCache();
  const { url } = ctx.request;
  const key = generateCacheKey(ctx);
  const cacheEntry = await cacheStore.get(key);
  const cacheControlHeader = ctx.request.headers['cache-control'];
  const noCache = cacheControlHeader && cacheControlHeader.includes('no-cache');

  if (cacheEntry && !noCache) {
    loggy.info(`HIT with key: ${key}`);
    ctx.status = 200;
    ctx.body = cacheEntry.body;
    ctx.set(cacheEntry.headers);
    return;
  }

  await next();

  if (
    ctx.body &&
    ctx.method === 'GET' &&
    ctx.status >= 200 &&
    ctx.status <= 300 &&
    url.startsWith('/api')
  ) {
    loggy.info(`MISS with key: ${key}`);
    await cacheStore.set(key, {
      body: ctx.body,
      headers: ctx.response.headers,
    });
  }
};

export default middleware;
