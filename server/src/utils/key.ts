import { Context } from 'koa';

export const generateCacheKey = (ctx: Context) => {
  const { url } = ctx.request;
  const { method } = ctx.request;

  return `${method}:${url}:${generateQueryParamsKey(ctx)}:${generateHeadersKey(ctx)}`;
};

const generateQueryParamsKey = (ctx: Context) => {
  const { query } = ctx.request;
  return Object.entries(query)
    .map(([key, value]) => {
      return `${key}=${value}`;
    })
    .join(',');
};

const generateHeadersKey = (ctx: Context) => {
  return Object.entries(ctx.request.header)
    .map(([key, value]) => {
      return `${key}=${value}`;
    })
    .join(',');
};
