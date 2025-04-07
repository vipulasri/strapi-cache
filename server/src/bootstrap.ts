import type { Core } from '@strapi/strapi';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  console.log('Initializing REST Cache plugin...');
  // Register the plugin
  const cacheStore = strapi.plugin('strapi-cache').services;
  cacheStore.service.createCache().init();

  if (!cacheStore) {
    strapi.log.error('REST Cache plugin not initialized');
    return;
  }

  console.log('REST Cache plugin initialized');
};

export default bootstrap;
