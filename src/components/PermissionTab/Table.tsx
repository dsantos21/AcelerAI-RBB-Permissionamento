// Libs
import React from 'react';
import PropTypes from 'prop-types';
// Rimble Components
import { Table, Box } from 'rimble-ui';
// Components
import PermissionTableHeader from './TableHeader';
import PermissionRow from './Row';
import EmptyRow from './EmptyRow';
// Styles
import styles from './styles.module.scss';

type Permission = {
  type: string;
  authorizer: string;
  authorized: string;
  date: string;
  txHash: string;
};

type PermissionTable = {
  list: (Permission & { status: string })[];
  toggleModal: (name: 'add' | 'remove' | 'lock') => (value?: boolean | string) => void;
  deleteTransaction: (identifier: string) => void;
  handleFilter: (value: any) => void;
  isAdmin: boolean;
  isReadOnly: boolean;
};

const PermissionTable: React.FC<PermissionTable> = ({
  list,
  toggleModal,
  deleteTransaction,
  handleFilter,
  isAdmin
}) => (
  <Box mt={5}>
    <PermissionTableHeader number={list.length} handleFilter={handleFilter} />
    <Table mt={4}>
      <thead>
        <tr>
          <th className={styles.headerCell}>Grantor</th>
          <th className={styles.headerCell}>Grantee</th>
          <th className={styles.headerCell}>Date</th>
          <th className={styles.headerCell}>Tx Hash</th>
        </tr>
      </thead>
      <tbody>
        {list.map(permission => (
          <PermissionRow key={permission.txHash} isAdmin={isAdmin} {...permission} />
        ))}
        {list.length === 0 && <EmptyRow />}
      </tbody>
    </Table>
  </Box>
);

PermissionTable.propTypes = {
  list: PropTypes.array.isRequired,
  toggleModal: PropTypes.func.isRequired,
  deleteTransaction: PropTypes.func.isRequired,
  handleFilter: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

export default PermissionTable;
