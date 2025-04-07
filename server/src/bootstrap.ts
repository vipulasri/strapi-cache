import type { Core } from '@strapi/strapi';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  console.log('Initializing REST Cache plugin...');

  try {
    const cacheStore = strapi.plugin('strapi-cache').services.service.createCache();
    cacheStore.init();

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
