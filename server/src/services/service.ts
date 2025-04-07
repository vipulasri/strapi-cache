import type { Core } from '@strapi/strapi';
import { LRUCache } from 'lru-cache';
import { withTimeout } from '../../src/utils/withTimeout';

const service = ({ strapi }: { strapi: Core.Strapi }) => {
  let cacheInstance: any = null;
  return {
    createCache() {
      if (cacheInstance) {
        return cacheInstance;
      }

      let initialized = false;
      let provider: LRUCache<number, any>;
      console.log('Creating REST Cache provider...');

      const instance = {
        init() {
          if (initialized) {
            strapi.log.error('REST Cache provider already initialized');
            return;
          }

          initialized = true;
          provider = new LRUCache({
            max: 1024 * 1014 * 10 /* 10MB */,
          });
          console.log('REST Cache provider initialized');
        },

        /**
         * @param {number} key
         */
        async get(key: number) {
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
         * @param {number} key
         * @param {any} val
         * @param {number=} maxAge
         */
        async set(key: number, val: any, maxAge = 3600) {
          if (!initialized) {
            strapi.log.error('REST Cache provider not initialized');
            return null;
          }

          if (!this.ready) {
            strapi.log.error('REST Cache provider not ready');
            return null;
          }

          try {
            return provider.set(key, val, { ttl: maxAge });
          } catch (error) {
            strapi.log.error(`REST Cache provider errored:`);
            strapi.log.error(error);
            return null;
          }
        },

        /**
         * @param {number} key
         */
        async del(key: number) {
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
            return Array.from(provider.keys()) as number[];
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
            console.log('REST Cache provider not initialized');
            return false;
          }

          return true;
        },

        /**
         * @param {RegExp[]} regExps
         */
        async clearByRegexp(regExps = []) {
          const keys = (await this.keys()) || [];

          /**
           * @param {number} key
           */
          // const shouldDel = (key: number) =>
          //   regExps.find((r) => r.test(key.toString().replace(keysPrefix, '')));

          /**
           * @param {number} key
           */
          const del = (key: number) => this.del(key);

          await Promise.all(keys.map(del));
        },

        /**
         * @param {string} uid
         * @param {any} params
         * @param {boolean=} wildcard
         */
        async clearByUid(uid: string, params = {}, wildcard = false) {
          // const { strategy } = strapi.config.get('plugin.rest-cache');

          const cacheConfigService = strapi.plugin('rest-cache').service('cacheConfig');

          const cacheConf = cacheConfigService.get(uid);

          if (!cacheConf) {
            throw new Error(
              `Unable to clear cache: no configuration found for contentType "${uid}"`
            );
          }

          const regExps = cacheConfigService.getCacheKeysRegexp(uid, params, wildcard);

          for (const relatedUid of cacheConf.relatedContentTypeUid) {
            if (cacheConfigService.isCached(relatedUid)) {
              // clear all cache because we can't predict uri params
              regExps.push(...cacheConfigService.getCacheKeysRegexp(relatedUid, {}, true));
            }
          }

          await this.clearByRegexp(regExps);
        },
      };
      cacheInstance = instance;
      return instance;
    },
  };
};

export default service;
