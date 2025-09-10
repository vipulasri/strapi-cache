/// <reference types="koa" />
declare const _default: {
    register: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    bootstrap: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    destroy(): void;
    config: {
        default: ({ env }: {
            env: any;
        }) => {
            debug: boolean;
            max: number;
            ttl: number;
            size: number;
            allowStale: boolean;
            cacheableRoutes: any[];
            provider: string;
            excludeRoutes: any[];
            redisConfig: any;
            redisClusterNodes: any[];
            redisClusterOptions: {};
            cacheHeaders: boolean;
            cacheHeadersDenyList: any[];
            cacheHeadersAllowList: any[];
            cacheAuthorizedRequests: boolean;
            cacheGetTimeoutInMs: number;
            autoPurgeCache: boolean;
            autoPurgeCacheOnStart: boolean;
        };
        validator: (config: any) => void;
    };
    controllers: {
        controller: ({ strapi }: {
            strapi: import("@strapi/types/dist/core").Strapi;
        }) => {
            purgeCache(ctx: import("koa").Context): Promise<void>;
            purgeCacheByKey(ctx: import("koa").Context): Promise<void>;
            cacheableRoutes(ctx: import("koa").Context): Promise<void>;
        };
    };
    routes: {
        'purge-route': {
            type: string;
            routes: {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: (string | {
                        name: string;
                        config: {
                            actions: string[];
                        };
                    })[];
                };
            }[];
        };
    };
    services: {
        service: ({ strapi }: {
            strapi: import("@strapi/types/dist/core").Strapi;
        }) => import("./types/cache.types").CacheService;
    };
    contentTypes: {};
    policies: {};
    middlewares: {
        graphql: (ctx: any, next: any) => Promise<void>;
        cache: (ctx: import("koa").Context, next: any) => Promise<void>;
    };
};
export default _default;
