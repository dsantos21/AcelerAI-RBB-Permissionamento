import { Contract } from 'ethers';
import AdminAbi from '../abis/Admin.json';
import { AccountIngress } from '../@types/AccountIngress';
import { NodeIngress } from '../@types/NodeIngress';
import { Admin } from '../@types/Admin';

let instance: Admin | null = null;

export const adminFactory = async (ingressInstance: AccountIngress | NodeIngress) => {
  if (instance) return instance;

  const adminContractName = await ingressInstance.ADMIN_CONTRACT();
  const adminAddress = await ingressInstance.getContractAddress(adminContractName);

  instance = (new Contract(adminAddress, AdminAbi.abi, ingressInstance.signer) as unknown) as Admin;
  return instance;
};
