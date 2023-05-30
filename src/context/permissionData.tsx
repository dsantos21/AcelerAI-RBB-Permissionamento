// Libs
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AccountRules } from '../chain/@types/AccountRules';
import { accountRulesFactory } from '../chain/contracts/AccountRules';
import { useNetwork } from './network';

// Utils
import { paramsToIdentifier, Enode as RawEnode } from '../util/enodetools';
import { listenForAccountChange } from '../chain/provider';

type Permission = {
  type: string;
  authorizer: string;
  authorized: string;
  date: string;
  txHash: string;
  identifier: string;
};

type ContextType =
  | {
      permissionList: Permission[];
      setPermissionList: React.Dispatch<React.SetStateAction<Permission[]>>;
      accountReadOnly?: boolean;
      setAccountReadOnly: React.Dispatch<React.SetStateAction<boolean | undefined>>;
      permissionRulesContract?: AccountRules;
      setAccountRulesContract: React.Dispatch<React.SetStateAction<AccountRules | undefined>>;
    }
  | undefined;

const DataContext = createContext<ContextType>(undefined);

const loadPermissionData = (
  accountRulesContract: AccountRules | undefined,
  setPermissionList: (account: Permission[]) => void,
  setAccountReadOnly: (readOnly?: boolean) => void
) => {
  if (accountRulesContract === undefined) {
    setPermissionList([]);
    setAccountReadOnly(undefined);
  } else {
    const listPermission: Permission[] = [];
    //accountRulesContract.isReadOnly().then((isReadOnly: boolean) => setAccountReadOnly(isReadOnly));
    let filter = accountRulesContract.filters.AccountAdded(null, null, null, null);
    accountRulesContract.queryFilter(filter).then(events => {
      setPermissionList(
        events.map(e => {
          const d = new Date(e.args[3].toNumber() * 1000);

          return {
            type: 'account',
            authorizer: e.args[2],
            authorized: e.args[1],
            date: d.toLocaleString(),
            txHash: e.transactionHash,
            identifier: ''
          };
        })
      );
    });

    setAccountReadOnly(false);
  }
  /*
  if (permissionRulesContract != undefined) {
    permissionRulesContract.getPastEvents('AllEvents').then((events: any) => console.log(events));
  }
*/
};

/**
 * Provider for the data context that contains the node list
 * @param {Object} props Props given to the NodeDataProvider
 * @return The provider with the following value:
 *  - nodeList: list of whiteliist enode from Node Rules contract
 *  - setNodeList: setter for the list state
 */
export const PermissionDataProvider: React.FC<{}> = props => {
  const [permissionList, setPermissionList] = useState<Permission[]>([]);
  const [accountReadOnly, setAccountReadOnly] = useState<boolean | undefined>(undefined);
  const [permissionRulesContract, setAccountRulesContract] = useState<AccountRules | undefined>(undefined);

  const value = useMemo(
    () => ({
      permissionList,
      setPermissionList,
      accountReadOnly,
      setAccountReadOnly,
      permissionRulesContract,
      setAccountRulesContract
    }),
    [
      permissionList,
      setPermissionList,
      accountReadOnly,
      setAccountReadOnly,
      permissionRulesContract,
      setAccountRulesContract
    ]
  );

  const { accountIngressContract } = useNetwork();

  useEffect(() => {
    if (accountIngressContract === undefined) {
      setAccountRulesContract(undefined);
    } else {
      accountRulesFactory(accountIngressContract).then(contract => {
        setAccountRulesContract(contract);
        contract.removeAllListeners('AccountAdded');
        contract.removeAllListeners('AccountRemoved');
        contract.on('AccountAdded', () => {
          loadPermissionData(contract, setPermissionList, setAccountReadOnly);
        });
        contract.on('AccountRemoved', () => {
          loadPermissionData(contract, setPermissionList, setAccountReadOnly);
        });
      });
    }
  }, [accountIngressContract]);

  return <DataContext.Provider value={value} {...props} />;
};

/**
 * Fetch the appropriate node data on chain and synchronize with it
 * @return {Object} Contains data of interest:
 *  - dataReady: true if isReadOnly and node allowlist are correctly fetched,
 *  false otherwise
 *  - userAddress: Address of the user
 *  - isReadOnly: Node contract is lock or unlock,
 *  - allowlist: list of permitted nodes from Node contract,
 */
export const usePermissionData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('usePermissionData must be used within a PermissionDataProvider.');
  }

  const { permissionList, setPermissionList, accountReadOnly, setAccountReadOnly, permissionRulesContract } = context;

  useEffect(() => {
    loadPermissionData(permissionRulesContract, setPermissionList, setAccountReadOnly);
  }, [permissionRulesContract, setPermissionList, setAccountReadOnly]);

  const formattedPermissionList = useMemo(() => {
    return permissionList
      .map(permission => ({
        ...permission,
        status: 'active'
      }))
      .reverse();
  }, [permissionList]);

  const dataReady = useMemo(() => {
    return permissionRulesContract !== undefined && accountReadOnly !== undefined && permissionList !== undefined;
  }, [permissionRulesContract, accountReadOnly, permissionList]);

  return {
    dataReady,
    allowlist: formattedPermissionList,
    isReadOnly: accountReadOnly,
    permissionRulesContract
  };
};
