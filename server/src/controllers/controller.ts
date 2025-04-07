import type { Core } from '@strapi/strapi';
import { Context } from 'koa';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx: Context) {
    ctx.body = strapi
      .plugin('strapi-cache')
      // the name of the service file & the method.
      .service('service')
      .getWelcomeMessage();
  },
});

export default controller;
