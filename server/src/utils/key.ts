import { Context } from 'koa';

export const generateCacheKey = (ctx: Context): `${string}:${string}` => {
  const { url } = ctx.request;
  const { method } = ctx.request;

  return `${method}:${url}`;
};
