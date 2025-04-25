import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import PurgeModal from '../PurgeModal';
import { useIntl } from 'react-intl';

function PurgeEntityButton() {
  const { formatMessage } = useIntl();
  const { id, isSingleType, contentType } = useContentManagerContext();
  const keyToUse = isSingleType ? contentType?.info.singularName : id;

  return (
    <PurgeModal
      buttonWidth="100%"
      buttonText={formatMessage({
        id: 'strapi-cache.cache.purge.entity',
        defaultMessage: 'Purge Entity Cache',
      })}
      keyToUse={keyToUse}
    ></PurgeModal>
  );
}

export default PurgeEntityButton;
