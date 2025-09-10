import { Core } from '@strapi/strapi';
import { CacheProvider } from 'src/types/cache.types';
export declare function invalidateCache(event: any, cacheStore: CacheProvider, strapi: Core.Strapi): Promise<void>;
export declare function invalidateGraphqlCache(event: any, cacheStore: CacheProvider, strapi: Core.Strapi): Promise<void>;
