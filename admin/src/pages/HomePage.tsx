import { Main } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';
import { Layouts } from '@strapi/strapi/admin';
import CacheTable from '../components/CacheTable';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const entries = [
    {
      id: 1,
      cover: 'https://via.placeholder.com/150',
      contact: 'John Doe',
      fallback: 'JD',
      description: 'This is a description for John Doe.',
      category: 'Category A',
    },
    {
      id: 2,
      cover: 'https://via.placeholder.com/150',
      contact: 'Jane Smith',
      fallback: 'JS',
      description: 'This is a description for Jane Smith.',
      category: 'Category B',
    },
  ];

  return (
    <Main>
      <Layouts.Header
        title={formatMessage({ id: getTranslation('name'), defaultMessage: 'Strapi Cache' })}
        subtitle={formatMessage({
          id: getTranslation('manage'),
          defaultMessage: 'Manage your rest cache',
        })}
        as="h2"
      />
      <CacheTable entries={entries} />
    </Main>
  );
};

export { HomePage };
