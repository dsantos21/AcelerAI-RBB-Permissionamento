import { Contract } from 'ethers';
import AccountRulesAbi from '../abis/AccountRules.json';
import { AccountIngress } from '../@types/AccountIngress';
import { AccountRules } from '../@types/AccountRules';
import { utils } from 'ethers';

let instance: AccountRules | null = null;

export const accountRulesFactory = async (ingressInstance: AccountIngress) => {
  if (instance) return instance;

  const ruleContractName = await ingressInstance.RULES_CONTRACT();
  const accountRulesAddress = await ingressInstance.getContractAddress(ruleContractName);

  instance = (new Contract(
    accountRulesAddress,
    AccountRulesAbi.abi,
    ingressInstance.signer
  ) as unknown) as AccountRules;
  return instance;
};
