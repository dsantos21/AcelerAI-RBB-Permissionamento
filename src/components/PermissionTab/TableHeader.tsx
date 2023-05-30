// Libs
import React from 'react';
import PropTypes from 'prop-types';
// Rimble Components
import { Flex, Box, Heading } from 'rimble-ui';

type TableHeader = {};

const TableHeader: React.FC<TableHeader> = () => (
  <Flex alignItems="center" justifyContent="space-between">
    <Box>
      <Heading.h2 fontWeight="700">Permissions</Heading.h2>
    </Box>
  </Flex>
);

export default TableHeader;
