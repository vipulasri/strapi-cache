import type { Core } from '@strapi/strapi';
import middlewares from './middlewares';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  console.log('Registering REST Cache plugin...');
  strapi.server.use(middlewares.receive);
};

export default register;
