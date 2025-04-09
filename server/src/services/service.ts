import type { Core } from '@strapi/strapi';
import { LRUCache } from 'lru-cache';
import { withTimeout } from '../../src/utils/withTimeout';
import { CacheProvider, CacheService } from 'src/types/cache.types';

const service = ({ strapi }: { strapi: Core.Strapi }): CacheService => {
  let cacheInstance: CacheProvider | null = null;
  return {
    createCache() {
      if (cacheInstance) {
        return cacheInstance;
      }

      let initialized = false;
      let provider: LRUCache<string, any>;
      strapi.log.info('Creating REST Cache provider...');

      const instance: CacheProvider = {
        init() {
          if (initialized) {
            strapi.log.error('REST Cache provider already initialized');
            return;
          }

          initialized = true;
          provider = new LRUCache({
            max: 1024 * 1014 * 10 /* 10MB */,
            ttl: 1000 * 60 * 60 /* 1 hour */,
            size: 1000,
          });
          strapi.log.info('REST Cache provider initialized');
        },

        /**
         * @param {string} key
         */
        async get(key: string) {
          if (!initialized) {
            strapi.log.error('REST Cache provider not initialized');
            return null;
          }

          if (!this.ready) {
            strapi.log.error('REST Cache provider not ready');
            return null;
          }

          const getTimeout = 1000;
          return withTimeout(async () => await provider.get(key), getTimeout).catch((error) => {
            if (error?.message === 'timeout') {
              strapi.log.error(`REST Cache provider timed-out after ${getTimeout}ms.`);
            } else {
              strapi.log.error(`REST Cache provider errored:`);
              strapi.log.error(error);
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
            strapi.log.error('REST Cache provider not initialized');
            return null;
          }

          if (!this.ready) {
            strapi.log.error('REST Cache provider not ready');
            return null;
          }

          try {
            const size = provider.size;
            return provider.set(key, val);
          } catch (error) {
            strapi.log.error(`REST Cache provider errored:`);
            strapi.log.error(error);
            return null;
          }
        },

        /**
         * @param {string} key
         */
        async del(key: string) {
          if (!initialized) {
            strapi.log.error('REST Cache provider not initialized');
            return null;
          }

          if (!this.ready) {
            strapi.log.error('REST Cache provider not ready');
            return null;
          }

          try {
            strapi.log.info(`PURGING KEY: ${key}`);
            return provider.delete(key);
          } catch (error) {
            strapi.log.error(`REST Cache provider errored:`);
            strapi.log.error(error);
            return null;
          }
        },

        async keys() {
          if (!initialized) {
            strapi.log.error('REST Cache provider not initialized');
            return null;
          }

          if (!this.ready) {
            strapi.log.error('REST Cache provider not ready');
            return null;
          }

          try {
            return Array.from(provider.keys()) as string[];
          } catch (error) {
            strapi.log.error(`REST Cache provider errored:`);
            strapi.log.error(error);
            return null;
          }
        },

        async reset() {
          if (!initialized) {
            strapi.log.error('REST Cache provider not initialized');
            return null;
          }

          if (!this.ready) {
            strapi.log.error('REST Cache provider not ready');
            return null;
          }

          try {
            const allKeys = await this.keys();
            if (!allKeys) {
              strapi.log.error('REST Cache provider not ready');
              return null;
            }
            strapi.log.info(`PURGING ALL KEYS: ${allKeys.length}`);
            return this.keys().then((keys) => Promise.all(allKeys.map((key) => this.del(key))));
          } catch (error) {
            strapi.log.error(`REST Cache provider errored:`);
            strapi.log.error(error);
            return null;
          }
        },

        get ready() {
          if (!initialized) {
            strapi.log.info('REST Cache provider not initialized');
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
