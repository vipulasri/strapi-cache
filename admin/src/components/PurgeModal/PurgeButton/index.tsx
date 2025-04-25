import { Button } from '@strapi/design-system';
import { useIntl } from 'react-intl';

function PurgeButton({ onClick }: { onClick: () => void }) {
  const formatMessage = useIntl().formatMessage;

  return (
    <Button onClick={onClick}>
      {formatMessage({
        id: 'strapi-cache.cache.confirm',
        defaultMessage: 'Yes, confirm',
      })}
    </Button>
  );
}

export default PurgeButton;
