import murmurhash from 'murmurhash';
import { Context } from 'koa';
import { generateCacheKey } from '../../src/utils/key';

const middleware = async (ctx: Context, next: any) => {
  const cacheStore = strapi.plugin('strapi-cache').services;
  const createCache = cacheStore.service.createCache();

  const key = murmurhash.v3(generateCacheKey(ctx));
  const cacheEntry = await createCache.get(key);

  if (cacheEntry) {
    console.log('cache HIT with key ', key);
    ctx.status = 200;
    ctx.body = cacheEntry;
    return;
  }
  console.log('cache MISS with key ', key);

  await next();

  if (ctx.body && ctx.status >= 200 && ctx.status <= 300) {
    console.log('setting cache with key ', key);
    await createCache.set(key, ctx.body, 3600);
  }
};

export default middleware;
