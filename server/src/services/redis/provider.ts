import type { Core } from '@strapi/strapi';
import Redis from 'ioredis';
import { withTimeout } from '../../utils/withTimeout';
import { CacheProvider } from '../../types/cache.types';
import { loggy } from '../../utils/log';

export class RedisCacheProvider implements CacheProvider {
  private initialized = false;
  private client!: Redis;

  constructor(private strapi: Core.Strapi) {}

  init(): void {
    if (this.initialized) {
      loggy.error('Redis provider already initialized');
      return;
    }
    try {
      const redisUrl =
        this.strapi.plugin('strapi-cache').config('redisConfig') || 'redis://localhost:6379';
      this.client = new Redis(redisUrl);
      this.initialized = true;

      loggy.info('Redis provider initialized');
    } catch (error) {
      loggy.error(error);
    }
  }

  get ready(): boolean {
    if (!this.initialized) {
      loggy.info('Redis provider not initialized');
      return false;
    }

    return true;
  }

  async get(key: string): Promise<any | null> {
    if (!this.ready) return null;

    const timeout = 1000;
    return withTimeout(() => this.client.get(key), timeout)
      .then((data) => (data ? JSON.parse(data) : null))
      .catch((error) => {
        loggy.error(`Redis get error: ${error?.message || error}`);
        return null;
      });
  }

  async set(key: string, val: any): Promise<any | null> {
    if (!this.ready) return null;

    try {
      const ttl = Number(this.strapi.plugin('strapi-cache').config('ttl'));
      const serialized = JSON.stringify(val);
      if (ttl > 0) {
        await this.client.set(key, serialized, 'EX', ttl);
      } else {
        await this.client.set(key, serialized);
      }
      return val;
    } catch (error) {
      loggy.error(`Redis set error: ${error}`);
      return null;
    }
  }

  async del(key: string): Promise<any | null> {
    if (!this.ready) return null;

    try {
      loggy.info(`Redis PURGING KEY: ${key}`);
      await this.client.del(key);
      return true;
    } catch (error) {
      loggy.error(`Redis del error: ${error}`);
      return null;
    }
  }

  async keys(): Promise<string[] | null> {
    if (!this.ready) return null;

    try {
      const keys = await this.client.keys('*');
      return keys;
    } catch (error) {
      loggy.error(`Redis keys error: ${error}`);
      return null;
    }
  }

  async reset(): Promise<any | null> {
    if (!this.ready) return null;

    try {
      loggy.info(`Redis FLUSHING ALL KEYS`);
      await this.client.flushdb();
      return true;
    } catch (error) {
      loggy.error(`Redis reset error: ${error}`);
      return null;
    }
  }

  async clearByRegexp(regExps: RegExp[]): Promise<void> {
    const keys = await this.keys();
    if (!keys) return;

    const toDelete = keys.filter((key) => regExps.some((re) => re.test(key)));
    await Promise.all(toDelete.map((key) => this.del(key)));
  }
}
