import type { Core } from '@strapi/strapi';
import { LRUCache } from 'lru-cache';
import { withTimeout } from '../../src/utils/withTimeout';
import { CacheProvider, CacheService } from '../types/cache.types';
import { loggy } from '../utils/log';

const service = ({ strapi }: { strapi: Core.Strapi }): CacheService => {
  let cacheInstance: CacheProvider | null = null;
  return {
    createCache() {
      if (cacheInstance) {
        return cacheInstance;
      }

      let initialized = false;
      let provider: LRUCache<string, any>;

      loggy.info('Creating provider');

      const instance: CacheProvider = {
        init() {
          if (initialized) {
            loggy.error('Provider already initialized');
            return;
          }

          initialized = true;
          provider = new LRUCache({
            max: 1024 * 1014 * 10 /* 10MB */,
            ttl: 1000 * 60 * 60 /* 1 hour */,
            size: 1000,
          });
          loggy.info('Provider initialized');
        },

        /**
         * @param {string} key
         */
        async get(key: string) {
          if (!initialized) {
            loggy.error('Provider not initialized');
            return null;
          }

          if (!this.ready) {
            loggy.error('Provider not ready');
            return null;
          }

          const getTimeout = 1000;
          return withTimeout(async () => await provider.get(key), getTimeout).catch((error) => {
            if (error?.message === 'timeout') {
              loggy.error(`Provider timed-out after ${getTimeout}ms.`);
            } else {
              loggy.error(`Provider errored:`);
              loggy.error(error);
            }
            return null;
          });
        },

        /**
         * @param {string} key
         * @param {any} val
         */
        async set(key: string, val: any) {
          if (!initialized) {
            loggy.error('Provider not initialized');
            return null;
          }

          if (!this.ready) {
            loggy.error('Provider not ready');
            return null;
          }

          try {
            const size = provider.size;
            return provider.set(key, val);
          } catch (error) {
            loggy.error(`Provider errored:`);
            loggy.error(error);
            return null;
          }
        },

        /**
         * @param {string} key
         */
        async del(key: string) {
          if (!initialized) {
            loggy.error('Provider not initialized');
            return null;
          }

          if (!this.ready) {
            loggy.error('Provider not ready');
            return null;
          }

          try {
            loggy.info(`PURGING KEY: ${key}`);
            return provider.delete(key);
          } catch (error) {
            loggy.error(`Provider errored:`);
            loggy.error(error);
            return null;
          }
        },

        async keys() {
          if (!initialized) {
            loggy.error('Provider not initialized');
            return null;
          }

          if (!this.ready) {
            loggy.error('Provider not ready');
            return null;
          }

          try {
            return Array.from(provider.keys());
          } catch (error) {
            loggy.error(`Provider errored:`);
            loggy.error(error);
            return null;
          }
        },

        async reset() {
          if (!initialized) {
            loggy.error('Provider not initialized');
            return null;
          }

          if (!this.ready) {
            loggy.error('Provider not ready');
            return null;
          }

          try {
            const allKeys = await this.keys();
            if (!allKeys) {
              loggy.error('Provider not ready');
              return null;
            }
            loggy.info(`PURGING ALL KEYS: ${allKeys.length}`);
            return this.keys().then((keys) => Promise.all(allKeys.map((key) => this.del(key))));
          } catch (error) {
            loggy.error(`Provider errored:`);
            loggy.error(error);
            return null;
          }
        },

        get ready() {
          if (!initialized) {
            loggy.info('Provider not initialized');
            return false;
          }

          return true;
        },

        /**
         * @param {RegExp[]} regExps
         */
        async clearByRegexp(regExps: RegExp[] = []) {
          const keys = (await this.keys()) || [];
          const toDelete = keys.filter((key) => regExps.some((re) => re.test(key)));
          await Promise.all(toDelete.map((key) => this.del(key)));
        },
      };
      cacheInstance = instance;
      return instance;
    },
  };
};

export default service;
