const Web3Utils = require("web3-utils");
const AllowlistUtils = require('../../scripts/utils/allowlist_utils');

const Rules = artifacts.require("./AccountRules.sol");
const AccountIngress = artifacts.require("./AccountIngress.sol");
const Admin = artifacts.require("./Admin.sol");

const adminContractName = Web3Utils.utf8ToHex("administration");
const rulesContractName = Web3Utils.utf8ToHex("rules");

/* The address of the account ingress contract if pre deployed */
let accountIngress = process.env.ACCOUNT_INGRESS_CONTRACT_ADDRESS;

async function deploy() {
    let accountIngressInstance;
    if (! accountIngress) {
        // Only deploy if we haven't been provided a predeployed address
        //await deployer.deploy(AccountIngress);
        accountIngressInstance = await AccountIngress.new();
        AccountIngress.setAsDeployed(accountIngressInstance);

        console.log("   > Deployed AccountIngress contract to address = " + accountIngressInstance.address);
        accountIngress = accountIngressInstance.address;

    }
    // If supplied an address, make sure there's something there
    accountIngressInstance = await AccountIngress.at(accountIngress);
    AccountIngress.setAsDeployed(accountIngressInstance);
    
    try {
        const result = await accountIngressInstance.getContractVersion();
        console.log("   > AccountIngress contract initialised at address = " + accountIngress + " version=" + result);
    } catch (err) {
        console.log(err);
        console.error("   > Predeployed AccountIngress contract is not responding like an AccountIngress contract at address = " + accountIngress);
    }

    const admin = await Admin.deployed();
    await accountIngressInstance.setContractAddress(adminContractName, admin.address);
    console.log("   > Updated AccountIngress with Admin address = " + admin.address);

    //await deployer.deploy(Rules, accountIngress);
    let accountRulesContract = await Rules.new(accountIngress);
    Rules.setAsDeployed(accountRulesContract);
    console.log("   > Rules deployed with AccountIngress.address = " + accountIngress);
    //let accountRulesContract = await Rules.deployed();

    if (AllowlistUtils.isInitialAllowlistedAccountsAvailable()) {
        console.log("   > Adding Initial Allowlisted Accounts ...");
        let allowlistedAccounts = AllowlistUtils.getInitialAllowlistedAccounts();
        if (allowlistedAccounts.length > 0) {
            let accountsAddedResult = await accountRulesContract.addAccounts(allowlistedAccounts);
            console.log ("   > Initial Allowlisted Accounts added: " + allowlistedAccounts);
        }
    }

    await accountIngressInstance.setContractAddress(rulesContractName, accountRulesContract.address);
    console.log("   > Updated AccountIngress contract with Rules address = " + accountRulesContract.address);
}

module.exports = {
    deploy
}