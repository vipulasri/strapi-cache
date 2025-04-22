import type { Core } from '@strapi/strapi';
import { Context } from 'koa';
import { CacheService } from 'src/types/cache.types';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async purgeCache(ctx: Context) {
    const service = strapi.plugin('strapi-cache').service('service') as CacheService;

    await service.getCacheInstance().reset();

    ctx.body = {
      message: 'Cache purged successfully',
    };
  },
  async purgeCacheByKey(ctx: Context) {
    const { key } = ctx.params;
    const service = strapi.plugin('strapi-cache').service('service') as CacheService;
    const regex = new RegExp(`(^|\/)${key}(\/|\\?|$)`);

    await service.getCacheInstance().clearByRegexp([regex]);

    ctx.body = {
      message: `Cache purged successfully for key: ${key}`,
    };
  },
});

export default controller;
