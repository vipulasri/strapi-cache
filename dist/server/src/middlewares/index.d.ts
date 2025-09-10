/// <reference types="koa" />
declare const _default: {
    graphql: (ctx: any, next: any) => Promise<void>;
    cache: (ctx: import("koa").Context, next: any) => Promise<void>;
};
export default _default;
