/// <reference types="koa" />
declare const _default: {
    controller: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        purgeCache(ctx: import("koa").Context): Promise<void>;
        purgeCacheByKey(ctx: import("koa").Context): Promise<void>;
        cacheableRoutes(ctx: import("koa").Context): Promise<void>;
    };
};
export default _default;
