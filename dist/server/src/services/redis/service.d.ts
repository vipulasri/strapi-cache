import type { Core } from '@strapi/strapi';
import type { CacheService } from '../../types/cache.types';
declare const service: ({ strapi }: {
    strapi: Core.Strapi;
}) => CacheService;
export default service;
