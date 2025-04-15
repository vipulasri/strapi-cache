import type { Core } from '@strapi/strapi';
import { invalidateCache, invalidateGraphqlCache } from './utils/invalidateCache';
import { CacheService } from './types/cache.types';
import { loggy } from './utils/log';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  loggy.info('Initializing');
  try {
    const cacheService = strapi.plugin('strapi-cache').services.service as CacheService;
    const cacheStore = cacheService.createCache();
    cacheStore.init();

    strapi.db.lifecycles.subscribe({
      async afterCreate(event) {
        await invalidateCache(event, cacheStore, strapi);
        await invalidateGraphqlCache(event, cacheStore, strapi);
      },
      async afterUpdate(event) {
        await invalidateCache(event, cacheStore, strapi);
        await invalidateGraphqlCache(event, cacheStore, strapi);
      },
      async afterDelete(event) {
        await invalidateCache(event, cacheStore, strapi);
        await invalidateGraphqlCache(event, cacheStore, strapi);
      },
    });

    if (!cacheStore) {
      loggy.error('Plugin could not be initialized');
      return;
    }
  } catch (error) {
    loggy.error('Plugin could not be initialized');
    return;
  }
  loggy.info('Plugin initialized');
};

export default bootstrap;
