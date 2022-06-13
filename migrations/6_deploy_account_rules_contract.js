const Web3Utils = require("web3-utils");
const AllowlistUtils = require('../scripts/allowlist_utils');

const AccountRules = artifacts.require("./AccountRules.sol");
const AccountIngress = artifacts.require("./AccountIngress.sol");
const Admin = artifacts.require("./Admin.sol");

const adminContractName = Web3Utils.utf8ToHex("administration");
const rulesContractName = Web3Utils.utf8ToHex("rules");

/* The address of the account ingress contract if pre deployed */
let accountIngress = process.env.ACCOUNT_INGRESS_CONTRACT_ADDRESS;

module.exports = async(deployer, network) => {

    const admin = await Admin.deployed();

    if (! accountIngress) {
        const accountIngressContract = await AccountIngress.deployed()
        accountIngress = accountIngressContract.address;
    }

    const accountIngressInstance = await AccountIngress.at(accountIngress);

    await deployer.deploy(AccountRules, accountIngress);
    console.log("   > AccountRules deployed with AccountIngress.address = " + accountIngress);
    let accountRulesContract = await AccountRules.deployed();

    if (AllowlistUtils.isInitialAllowlistedAccountsAvailable()) {
        console.log("   > Adding Initial Allowlisted Accounts ...");
        let allowlistedAccounts = AllowlistUtils.getInitialAllowlistedAccounts();
        if (allowlistedAccounts.length > 0) {
            let accountsAddedResult = await accountRulesContract.addAccounts(allowlistedAccounts);
            console.log ("   > Initial Allowlisted Accounts added: " + allowlistedAccounts);
        }
    }

    await accountIngressInstance.setContractAddress(rulesContractName, AccountRules.address);
    console.log("   > Updated AccountIngress contract with AccountRules address = " + AccountRules.address);
    
    // The admin contract must be the last one to be setted in Account Ingress Contract
    await accountIngressInstance.setContractAddress(adminContractName, admin.address);
    console.log("   > Updated AccountIngress with Admin address = " + admin.address);
}
