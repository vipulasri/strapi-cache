import type { Core } from '@strapi/strapi';
import { Context } from 'koa';
declare const controller: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    purgeCache(ctx: Context): Promise<void>;
    purgeCacheByKey(ctx: Context): Promise<void>;
    cacheableRoutes(ctx: Context): Promise<void>;
};
export default controller;
