import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tr,
  Th,
  Checkbox,
  Typography,
  Tbody,
  Td,
  Avatar,
  Flex,
  IconButton,
} from '@strapi/design-system';
import { Eye, Trash } from '@strapi/icons';
import { Modal } from '@strapi/design-system';
import { Button } from '@strapi/design-system';
import { Field } from '@strapi/design-system';

const CacheTable: React.FC<{ entries: any[] }> = ({ entries }) => {
  const COL_COUNT = 7;
  const ROW_COUNT = entries.length;

  return (
    <Box padding={8} background="neutral100">
      <Table colCount={COL_COUNT} rowCount={ROW_COUNT}>
        <Thead>
          <Tr>
            <Th>
              <Checkbox aria-label="Select all entries" />
            </Th>
            <Th>
              <Typography variant="sigma">ID</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Collection</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Content</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Actions</Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {entries.map((entry) => (
            <Tr key={entry.id}>
              <Td>
                <Checkbox aria-label={`Select ${entry.contact}`} />
              </Td>
              <Td>
                <Typography textColor="neutral800">{entry.id}</Typography>
              </Td>
              <Td>
                <Avatar.Item src={entry.cover} alt={entry.contact} fallback={entry.fallback} />
              </Td>
              <Td>
                <Typography textColor="neutral800">{entry.description}</Typography>
              </Td>
              <Td>
                <Flex>
                  <Modal.Root>
                    <Modal.Trigger>
                      <IconButton onClick={() => console.log('view')} label="View" borderWidth={0}>
                        <Eye />
                      </IconButton>
                    </Modal.Trigger>
                    <Modal.Content>
                      <Modal.Header>
                        <Modal.Title>Cache Entry</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Field.Root name="name" required>
                          <Field.Label>Name</Field.Label>
                          <Field.Input />
                        </Field.Root>
                      </Modal.Body>
                      <Modal.Footer>
                        <Modal.Close>
                          <Button>Close</Button>
                        </Modal.Close>
                      </Modal.Footer>
                    </Modal.Content>
                  </Modal.Root>
                  <Box paddingLeft={1}>
                    <IconButton
                      onClick={() => console.log('delete')}
                      label="Delete"
                      borderWidth={0}
                    >
                      <Trash />
                    </IconButton>
                  </Box>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default CacheTable;
