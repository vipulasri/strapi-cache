import type { Core } from '@strapi/strapi';
import { invalidateCache } from './utils/invalidateCache';
import { CacheService } from './types/cache.types';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  console.log('Initializing REST Cache plugin...');

  try {
    const cacheService = strapi.plugin('strapi-cache').services.service as CacheService;
    const cacheStore = cacheService.createCache();
    cacheStore.init();

    strapi.db.lifecycles.subscribe({
      async afterCreate(event) {
        await invalidateCache(event, cacheStore, strapi);
      },
      async afterUpdate(event) {
        await invalidateCache(event, cacheStore, strapi);
      },
      async afterDelete(event) {
        await invalidateCache(event, cacheStore, strapi);
      },
    });

    if (!cacheStore) {
      strapi.log.error('REST Cache plugin could not be initialized');
      return;
    }
  } catch (error) {
    strapi.log.error('Error initializing REST Cache plugin:', error);
    return;
  }

  console.log('REST Cache plugin initialized');
};

export default bootstrap;
