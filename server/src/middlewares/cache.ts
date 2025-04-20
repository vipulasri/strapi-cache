import { Context } from 'koa';
import { generateCacheKey } from '../utils/key';
import { CacheService } from 'src/types/cache.types';
import { loggy } from '../utils/log';

const middleware = async (ctx: Context, next: any) => {
  const cacheService = strapi.plugin('strapi-cache').services.service as CacheService;
  const cacheableRoutes = strapi.plugin('strapi-cache').config('cacheableRoutes') as string[];
  const cacheStore = cacheService.createCache();
  const { url } = ctx.request;
  const key = generateCacheKey(ctx);
  const cacheEntry = await cacheStore.get(key);
  const cacheControlHeader = ctx.request.headers['cache-control'];
  const noCache = cacheControlHeader && cacheControlHeader.includes('no-cache');
  const routeIsCachable =
    cacheableRoutes.some((route) => url.startsWith(route)) ||
    (cacheableRoutes.length === 0 && url.startsWith('/api'));

  if (cacheEntry && !noCache) {
    loggy.info(`HIT with key: ${key}`);
    ctx.status = 200;
    ctx.body = cacheEntry;
    ctx.set({ 'Access-Control-Allow-Origin': '*' });
    return;
  }

  await next();

  if (
    ctx.body &&
    ctx.method === 'GET' &&
    ctx.status >= 200 &&
    ctx.status < 300 &&
    routeIsCachable
  ) {
    loggy.info(`MISS with key: ${key}`);
    await cacheStore.set(key, ctx.body);
  }
};

export default middleware;
