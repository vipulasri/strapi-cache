import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import PurgeModal from '../PurgeModal';
import { useIntl } from 'react-intl';

function PurgeCacheButton() {
  const { contentType } = useContentManagerContext();
  const { formatMessage } = useIntl();
  const keyToUse = contentType?.info.pluralName;

  return (
    <PurgeModal
      buttonText={formatMessage({
        id: 'strapi-cache.cache.purge',
        defaultMessage: 'Purge Cache',
      })}
      keyToUse={keyToUse}
    ></PurgeModal>
  );
}

export default PurgeCacheButton;
