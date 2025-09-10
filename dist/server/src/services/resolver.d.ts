import type { Core } from '@strapi/strapi';
import { CacheProvider } from '../../src/types/cache.types';
export declare const resolveCacheProvider: (strapi: Core.Strapi) => CacheProvider;
