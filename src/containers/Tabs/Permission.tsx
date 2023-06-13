// Libs
import React from 'react';
import PropTypes from 'prop-types';
// Context
import { useAdminData } from '../../context/adminData';
import { usePermissionData } from '../../context/permissionData';
// Utils
import useTab from './useTab';

//import { errorToast } from '../../util/tabTools';
// Components
import PermissionTab from '../../components/PermissionTab/PermissionTab';
import LoadingPage from '../../components/LoadingPage/LoadingPage';
import NoContract from '../../components/Flashes/NoContract';

type PermissionTabContainerProps = {
  isOpen: boolean;
};

const PermissionTabContainer: React.FC<PermissionTabContainerProps> = ({ isOpen }) => {
  const { isAdmin, dataReady: adminDataReady } = useAdminData();
  const {
    allowlist,
    isReadOnly,
    dataReady,
    permissionRulesContract,
    permissionFilter,
    setPermissionFilter,
    reload
  } = usePermissionData();

  const { list, modals, toggleModal, deleteTransaction } = useTab(allowlist, (identifier: string) => allowlist[0]);

  if (!!permissionRulesContract) {
    //const handleFilter = async (value: any) => {
    const handleFilter = (value: any) => {
      const { authorizer, authorized } = value;

      if (permissionFilter) {
        permissionFilter.accountGrantee = authorized ? authorized : null;
        permissionFilter.accountGrantor = authorizer ? authorizer : null;
        setPermissionFilter(permissionFilter);
        reload();
      }
    };

    const allDataReady = dataReady && adminDataReady;
    if (isOpen && allDataReady) {
      return (
        <PermissionTab
          list={list}
          modals={modals}
          toggleModal={toggleModal}
          isAdmin={isAdmin}
          deleteTransaction={deleteTransaction}
          handleFilter={handleFilter}
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
