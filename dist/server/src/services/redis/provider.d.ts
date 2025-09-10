import type { Core } from '@strapi/strapi';
import { CacheProvider } from '../../types/cache.types';
export declare class RedisCacheProvider implements CacheProvider {
    private strapi;
    private initialized;
    private client;
    private cacheGetTimeoutInMs;
    private keyPrefix;
    constructor(strapi: Core.Strapi);
    init(): void;
    get ready(): boolean;
    get(key: string): Promise<any | null>;
    set(key: string, val: any): Promise<any | null>;
    del(key: string): Promise<any | null>;
    keys(): Promise<string[] | null>;
    reset(): Promise<any | null>;
    clearByRegexp(regExps: RegExp[]): Promise<void>;
}
