export default {
  default: ({ env }) => ({
    debug: false,
    max: 1000,
    ttl: 1000 * 60 * 60,
    size: 1024 * 1014 * 10,
    allowStale: false,
    contentTypes: [],
  }),
  validator: (config) => {
    if (typeof config.debug !== 'boolean') {
      throw new Error(`Invalid config: debug must be a boolean`);
    }
    if (typeof config.max !== 'number') {
      throw new Error(`Invalid config: max must be a number`);
    }
    if (typeof config.ttl !== 'number') {
      throw new Error(`Invalid config: ttl must be a number`);
    }
    if (typeof config.size !== 'number') {
      throw new Error(`Invalid config: size must be a number`);
    }
    if (typeof config.allowStale !== 'boolean') {
      throw new Error(`Invalid config: allowStale must be a boolean`);
    }
    if (
      !Array.isArray(config.cacheableRoutes) ||
      config.cacheableRoutes.some((item) => typeof item !== 'string')
    ) {
      throw new Error(`Invalid config: cacheableRoutes must be an string array`);
    }
  },
};
