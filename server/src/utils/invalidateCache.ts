import { Core } from '@strapi/strapi';
import { CacheProvider } from 'src/types/cache.types';

export async function invalidateCache(event: any, cacheStore: CacheProvider, strapi: Core.Strapi) {
  const { model } = event;
  const uid = model.uid;
  console.log(model);

  try {
    const contentType = strapi.contentType(uid);

    if (!contentType || !contentType.kind) {
      strapi.log.info(`Content type ${uid} not found`);
      return;
    }

    const pluralName =
      contentType.kind === 'singleType'
        ? contentType.info.singularName
        : contentType.info.pluralName;
    const apiPath = `/api/${pluralName}`;
    const regex = new RegExp(`^.*:${apiPath}(/.*)?(\\?.*)?$`);

    await cacheStore.clearByRegexp([regex]);
    strapi.log.info(`Invalidated cache for ${apiPath}`);
  } catch (error) {
    strapi.log.error('Cache invalidation error:', error);
  }
}
