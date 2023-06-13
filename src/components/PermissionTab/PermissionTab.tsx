// Libs
import React, { Fragment } from 'react';
import PropTypes from 'prop-types'; // Components
import PermissionTable from './Table';

type Permission = {
  type: string;
  authorizer: string;
  authorized: string;
  date: string;
  txHash: string;
};

type PermissionTab = {
  list: (Permission & { status: string })[];
  modals: {
    add: boolean;
    remove: string;
    lock: boolean;
  };
  toggleModal: (name: 'add' | 'remove' | 'lock') => (value?: boolean | string) => void;
  isAdmin: boolean;
  deleteTransaction: (identifier: string) => void;
  handleFilter: (value: any) => void;
  isOpen: boolean;
  isReadOnly: boolean;
};

const PermissionTab: React.FC<PermissionTab> = ({
  list,
  modals,
  toggleModal,
  isAdmin,
  isReadOnly,
  deleteTransaction,
  handleFilter,
  isOpen
}) => (
  <Fragment>
    {isOpen && (
      <Fragment>
        <PermissionTable
          list={list}
          toggleModal={toggleModal}
          isAdmin={isAdmin}
          deleteTransaction={deleteTransaction}
          handleFilter={handleFilter}
          isReadOnly={isReadOnly}
        />
      </Fragment>
    )}
  </Fragment>
);

PermissionTab.propTypes = {
  list: PropTypes.array.isRequired,
  modals: PropTypes.shape({
    add: PropTypes.bool.isRequired,
    remove: PropTypes.oneOfType([PropTypes.string]).isRequired,
    lock: PropTypes.bool.isRequired
  }).isRequired,
  toggleModal: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  deleteTransaction: PropTypes.func.isRequired,
  handleFilter: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired
};

export default PermissionTab;
