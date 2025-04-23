import rawBody from 'raw-body';
import { generateGraphqlCacheKey } from '../utils/key';
import Stream, { Readable } from 'stream';
import { loggy } from '../utils/log';
import { CacheService } from '../../src/types/cache.types';
import { decodeBufferToText, decompressBuffer, streamToBuffer } from '../../src/utils/body';

const middleware = async (ctx: any, next: any) => {
  const cacheService = strapi.plugin('strapi-cache').services.service as CacheService;
  const cacheStore = cacheService.getCacheInstance();
  const { url } = ctx.request;

  const originalReq = ctx.req;
  const bodyBuffer = await rawBody(originalReq);
  const body = bodyBuffer.toString();

  const clonedReq = new Readable();
  clonedReq.push(bodyBuffer);
  clonedReq.push(null);

  (clonedReq as any).headers = { ...originalReq.headers };
  (clonedReq as any).method = originalReq.method;
  (clonedReq as any).url = originalReq.url;
  (clonedReq as any).httpVersion = originalReq.httpVersion;
  (clonedReq as any).socket = originalReq.socket;
  (clonedReq as any).connection = originalReq.connection;

  ctx.req = clonedReq;
  ctx.request.req = clonedReq;

  const key = generateGraphqlCacheKey(body);

  const isIntrospectionQuery = body.includes('IntrospectionQuery');
  if (isIntrospectionQuery) {
    loggy.info('Skipping cache for introspection query');
    await next();
    return;
  }

  const cacheEntry = await cacheStore.get(key);
  const cacheControlHeader = ctx.request.headers['cache-control'];
  const noCache = cacheControlHeader && cacheControlHeader.includes('no-cache');

  if (cacheEntry && !noCache) {
    loggy.info(`HIT with key: ${key}`);
    ctx.status = 200;
    ctx.body = cacheEntry.body;
    ctx.set(cacheEntry.headers);
    ctx.set({ 'Content-Encoding': 'identity' });
    return;
  }

  await next();

  if (
    ctx.method === 'POST' &&
    ctx.status >= 200 &&
    ctx.status < 300 &&
    url.startsWith('/graphql')
  ) {
    loggy.info(`MISS with key: ${key}`);

    if (ctx.body instanceof Stream) {
      const buf = await streamToBuffer(ctx.body);
      const contentEncoding = ctx.response.headers['content-encoding']; // e.g., gzip, br, deflate
      const decompressed = await decompressBuffer(buf, contentEncoding);
      const responseText = decodeBufferToText(decompressed);

      await cacheStore.set(key, { body: responseText, headers: ctx.response.headers });
      ctx.body = buf;
    } else {
      await cacheStore.set(key, {
        body: ctx.body,
        headers: ctx.response.headers,
      });
    }
  }
};

export default middleware;
