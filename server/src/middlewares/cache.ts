import { Context } from 'koa';
import { generateCacheKey } from '../utils/key';
import { CacheService } from '../../src/types/cache.types';
import { loggy } from '../utils/log';
import Stream from 'stream';
import { decodeBufferToText, decompressBuffer, streamToBuffer } from '../utils/body';
import { getCacheHeaderConfig, getHeadersToStore } from '../utils/header';

const middleware = async (ctx: Context, next: any) => {
  const cacheService = strapi.plugin('strapi-cache').services.service as CacheService;
  const cacheableRoutes = strapi.plugin('strapi-cache').config('cacheableRoutes') as string[];
  const { cacheHeaders, cacheHeadersDenyList, cacheHeadersAllowList, cacheAuthorizedRequests } =
    getCacheHeaderConfig();
  const cacheStore = cacheService.getCacheInstance();
  const { url } = ctx.request;
  const key = generateCacheKey(ctx);
  const cacheEntry = await cacheStore.get(key);
  const cacheControlHeader = ctx.request.headers['cache-control'];
  const noCache = cacheControlHeader && cacheControlHeader.includes('no-cache');
  const routeIsCachable =
    cacheableRoutes.some((route) => url.startsWith(route)) ||
    (cacheableRoutes.length === 0 && url.startsWith('/api'));
  const authorizationHeader = ctx.request.headers['authorization'];

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
      // ctx.set('Access-Control-Allow-Origin', ctx.request.headers.origin || '*');
    }

    // Get the global middlewares config
    const middlewaresConfig = strapi.config.get('middlewares') as any[];
    // Find the cors middleware
    const corsMiddleware = middlewaresConfig.find((mw: any) => mw.name === 'strapi::cors');

    if (corsMiddleware) {
      const corsConfig = corsMiddleware?.config;
      const origin = ctx?.request?.headers?.origin;
      let allowedOrigins = corsConfig?.origin ?? '*'; // if corsConfig.origin is a string, convert it to an array

      if (typeof allowedOrigins === 'string') {
        allowedOrigins = [allowedOrigins];
      }

      if (allowedOrigins.includes(origin)) {
        ctx.set('Access-Control-Allow-Origin', origin);
      } else if (typeof origin === 'undefined' || allowedOrigins.includes('*')) {
        ctx.set('Access-Control-Allow-Origin', '*');
      } else {
        //do nothing
      }
    }

    return;
  }

  await next();

  if (ctx.method === 'GET' && ctx.status >= 200 && ctx.status < 300 && routeIsCachable) {
    loggy.info(`MISS with key: ${key}`);
    const headersToStore = getHeadersToStore(
      ctx,
      cacheHeaders,
      cacheHeadersAllowList,
      cacheHeadersDenyList
    );

    if (ctx.body instanceof Stream) {
      const buf = await streamToBuffer(ctx.body);
      const contentEncoding = ctx.response.headers['content-encoding'];
      const decompressed = await decompressBuffer(buf, contentEncoding);
      const responseText = decodeBufferToText(decompressed);

      await cacheStore.set(key, { body: responseText, headers: headersToStore });
      ctx.body = buf;
    } else {
      await cacheStore.set(key, { body: ctx.body, headers: headersToStore });
    }
  }
};

export default middleware;
