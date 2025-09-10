/// <reference types="node" />
import { Context } from 'koa';
import { OutgoingHttpHeaders } from 'http';
export declare function getHeadersToStore(ctx: Context, cacheHeaders: boolean, cacheHeadersAllowList?: string[], cacheHeadersDenyList?: string[]): OutgoingHttpHeaders | null;
export declare function getCacheHeaderConfig(): {
    cacheHeaders: boolean;
    cacheHeadersDenyList: string[];
    cacheHeadersAllowList: string[];
    cacheAuthorizedRequests: boolean;
};
