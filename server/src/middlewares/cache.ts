import { Context } from 'koa';
import { generateCacheKey } from '../utils/key';
import { CacheService } from '../../src/types/cache.types';
import { loggy } from '../utils/log';
import Stream from 'stream';
import { decodeBufferToText, decompressBuffer, streamToBuffer } from '../../src/utils/body';

const middleware = async (ctx: Context, next: any) => {
  const cacheService = strapi.plugin('strapi-cache').services.service as CacheService;
  const cacheableRoutes = strapi.plugin('strapi-cache').config('cacheableRoutes') as string[];
  const cacheStore = cacheService.getCacheInstance();
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
    ctx.body = cacheEntry.body;
    ctx.set(cacheEntry.headers);
    ctx.set({ 'Access-Control-Allow-Origin': '*', 'Content-Encoding': 'identity' });
    return;
  }

  await next();

  if (ctx.method === 'GET' && ctx.status >= 200 && ctx.status < 300 && routeIsCachable) {
    loggy.info(`MISS with key: ${key}`);

    const headers = ctx.request.headers;
    const authorizationHeader = headers['authorization'];
    if (authorizationHeader) {
      loggy.info(`Authorized request not caching: ${key}`);
      return;
    }

    if (ctx.body instanceof Stream) {
      const buf = await streamToBuffer(ctx.body);
      const contentEncoding = ctx.response.headers['content-encoding'];
      const decompressed = await decompressBuffer(buf, contentEncoding);
      const responseText = decodeBufferToText(decompressed);

      await cacheStore.set(key, { body: responseText, headers: ctx.response.headers });
      ctx.body = buf;
    } else {
      await cacheStore.set(key, { body: ctx.body, headers: ctx.response.headers });
    }
  }
};

export default middleware;
