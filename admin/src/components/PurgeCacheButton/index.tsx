import { useIntl } from 'react-intl';
import { Archive } from '@strapi/icons';
import { Button, Modal } from '@strapi/design-system';
import { useRBAC } from '@strapi/strapi/admin';
import { pluginPermissions } from '../../permission';
import { Typography } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import { useNotification } from '@strapi/strapi/admin';
import { useEffect, useState } from 'react';

function PurgeCacheButton() {
  const { allowedActions } = useRBAC(pluginPermissions);
  const formatMessage = useIntl().formatMessage;
  const { post, get } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { contentType } = useContentManagerContext();
  const [cacheableRoutes, setCacheableRoutes] = useState<string[]>();
  const pluralName = contentType?.info.pluralName;

  useEffect(() => {
    if (!allowedActions.canPurgeCache) {
      return;
    }
    const fetchCacheableRoutes = async () => {
      try {
        const { data } = await get('/strapi-cache/cacheable-routes');
        return data;
      } catch (error) {
        console.error('Error fetching cacheable routes:', error);
        return [];
      }
    };
    fetchCacheableRoutes().then((data) => {
      setCacheableRoutes(data);
    });
  }, [allowedActions.canPurgeCache]);

  const clearCache = () => {
    if (!pluralName) {
      toggleNotification({
        type: 'warning',
        message: formatMessage({
          id: 'strapi-cache.cache.purge.no-content-type',
          defaultMessage: 'No content type found',
        }),
      });
      return;
    }

    post(`/strapi-cache/purge-cache/${pluralName}`, undefined, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(() => {
        toggleNotification({
          type: 'success',
          message:
            formatMessage({
              id: 'strapi-cache.cache.purge.success',
              defaultMessage: 'Cache purged successfully',
            }) + `: ${pluralName}`,
        });
      })
      .catch(() => {
        toggleNotification({
          type: 'danger',
          message:
            formatMessage({
              id: 'strapi-cache.cache.purge.error',
              defaultMessage: 'Error purging cache',
            }) + `: ${pluralName}`,
        });
      });
  };

  const isCacheableRoute = () => {
    if (!pluralName || !cacheableRoutes) {
      return false;
    }

    return (
      cacheableRoutes.length === 0 ||
      cacheableRoutes.some((route) => {
        return route.includes(pluralName);
      })
    );
  };

  if (!allowedActions.canPurgeCache || !isCacheableRoute()) {
    return null;
  }

  return (
    <>
      <Modal.Root>
        <Modal.Trigger>
          <Button startIcon={<Archive />} variant="danger">
            {formatMessage({
              id: 'strapi-cache.cache.purge',
              defaultMessage: 'Purge Cache',
            })}
          </Button>
        </Modal.Trigger>
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>
              {formatMessage({
                id: 'strapi-cache.cache.purge',
                defaultMessage: 'Purge Cache',
              })}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Typography variant="omega">
              {formatMessage({
                id: 'strapi-cache.cache.purge.confirmation',
                defaultMessage: 'Are you sure you want to purge the cache?',
              })}
            </Typography>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="tertiary">
                {formatMessage({
                  id: 'strapi-cache.cache.cancel',
                  defaultMessage: 'No, cancel',
                })}
              </Button>
            </Modal.Close>
            <Modal.Close>
              <Button onClick={clearCache}>
                {formatMessage({
                  id: 'strapi-cache.cache.confirm',
                  defaultMessage: 'Yes, confirm',
                })}
              </Button>
            </Modal.Close>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}

export default PurgeCacheButton;
