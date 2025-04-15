export const loggy = {
  info: (msg: string) => {
    strapi.log.info(`[STRAPI CACHE] ${msg}`);
  },
  error: (msg: string) => {
    strapi.log.error(`[STRAPI CACHE] ${msg}`);
  },
  warn: (msg: string) => {
    strapi.log.warn(`[STRAPI CACHE] ${msg}`);
  },
};
