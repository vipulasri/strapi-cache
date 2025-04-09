import { Context } from 'koa';
import { generateCacheKey } from '../../src/utils/key';
import { CacheService } from 'src/types/cache.types';

const middleware = async (ctx: Context, next: any) => {
  const cacheService = strapi.plugin('strapi-cache').services.service as CacheService;
  const cacheStore = cacheService.createCache();
  const { url } = ctx.request;

  const key = generateCacheKey(ctx);
  const cacheEntry = await cacheStore.get(key);

  if (cacheEntry) {
    console.log('cache HIT with key ', key);
    ctx.status = 200;
    ctx.body = cacheEntry;
    return;
  }
  console.log('cache MISS with key ', key);

  await next();

  if (ctx.body && url.startsWith('/api') && ctx.status >= 200 && ctx.status <= 300) {
    console.log('setting cache with key ', key);
    await cacheStore.set(key, ctx.body);
  }
};

export default middleware;
