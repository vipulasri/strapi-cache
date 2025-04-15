import { Layouts } from '@strapi/admin/strapi-admin';
import { Box } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';
import { Typography } from '@strapi/design-system';

const SettingsPage = () => {
  const { formatMessage } = useIntl();

  return (
    <>
      <Layouts.Header
        title={formatMessage({
          id: getTranslation('view.settings.title'),
          defaultMessage: 'Strapi Cache Settings',
        })}
        subtitle={formatMessage({
          id: getTranslation('view.settings.subtitle'),
          defaultMessage: 'Configure what to cache',
        })}
      />

      <Layouts.Content>
        <Box background={'neutral0'} hasRadius shadow="filterShadow" padding={6}>
          <Typography variant="beta" textColor="neutral800">
            <strong>Coming soon</strong>
          </Typography>
        </Box>
      </Layouts.Content>
    </>
  );
};

export default SettingsPage;
