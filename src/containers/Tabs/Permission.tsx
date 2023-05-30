// Libs
import React from 'react';
import PropTypes from 'prop-types';
import idx from 'idx';
import { utils } from 'ethers';
// Context
import { useAdminData } from '../../context/adminData';
import { usePermissionData } from '../../context/permissionData';
// Utils
import useTab from './useTab';

import { errorToast } from '../../util/tabTools';
// Components
import PermissionTab from '../../components/PermissionTab/PermissionTab';
import LoadingPage from '../../components/LoadingPage/LoadingPage';
import NoContract from '../../components/Flashes/NoContract';
// Constants
import {
  PENDING_ADDITION,
  PENDING_REMOVAL,
  FAIL_ADDITION,
  FAIL_REMOVAL,
  SUCCESS,
  FAIL
} from '../../constants/transactions';

type PermissionTabContainerProps = {
  isOpen: boolean;
};

const PermissionTabContainer: React.FC<PermissionTabContainerProps> = ({ isOpen }) => {
  const { isAdmin, dataReady: adminDataReady } = useAdminData();
  const { allowlist, isReadOnly, dataReady, permissionRulesContract } = usePermissionData();

  const { list, modals, toggleModal, addTransaction, updateTransaction, deleteTransaction, openToast } = useTab(
    allowlist,
    (identifier: string) => allowlist[0]
    //    identifierToParams
  );

  if (!!permissionRulesContract) {
    const allDataReady = dataReady && adminDataReady;
    if (isOpen && allDataReady) {
      return (
        <PermissionTab
          list={list}
          modals={modals}
          toggleModal={toggleModal}
          isAdmin={isAdmin}
          deleteTransaction={deleteTransaction}
          isReadOnly={isReadOnly!}
          isOpen={isOpen}
        />
      );
    } else if (isOpen && !allDataReady) {
      return <LoadingPage />;
    } else {
      return <div />;
    }
  } else if (isOpen && !permissionRulesContract) {
    return <NoContract tabName="Permission Rules" />;
  } else {
    return <div />;
  }
};

PermissionTabContainer.propTypes = {
  isOpen: PropTypes.bool.isRequired
};

export default PermissionTabContainer;
