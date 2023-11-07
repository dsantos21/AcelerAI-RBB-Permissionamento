require("@nomiclabs/hardhat-web3");
const Web3Utils = require("web3-utils");
const AllowlistUtils = require('../utils/allowlist_utils');
const hre = require("hardhat");

const adminContractName = hre.ethers.zeroPadBytes(Web3Utils.utf8ToHex("administration"), 32);
const rulesContractName = hre.ethers.zeroPadBytes(Web3Utils.utf8ToHex("rules"), 32);

/* The address of the account ingress contract if pre deployed */
let accountIngressAddress = process.env.ACCOUNT_INGRESS_CONTRACT_ADDRESS;

async function deploy(adminAddress) {
    let AccountIngress;

    if (! accountIngressAddress) {
        // Only deploy if we haven't been provided a predeployed address
        AccountIngress = await hre.ethers.deployContract('AccountIngress');
        await AccountIngress.waitForDeployment();

        console.log("   > Deployed AccountIngress contract to address = " + AccountIngress.target);
        accountIngressAddress = AccountIngress.target;

    }
    else {
        // If supplied an address, make sure there's something there
        AccountIngress = await hre.ethers.getContractAt('AccountIngress', accountIngressAddress);
    }

    try {
        const result = await AccountIngress.getContractVersion();
        console.log("   > AccountIngress contract initialised at address = " + accountIngressAddress + " version=" + result);
    } catch (err) {
        console.log(err);
        console.error("   > Predeployed AccountIngress contract is not responding like an AccountIngress contract at address = " + accountIngressAddress);
    }

    await AccountIngress.setContractAddress(adminContractName, adminAddress);
    console.log("   > Updated AccountIngress with Admin address = " + adminAddress);

    const AccountRules = await hre.ethers.deployContract('AccountRules', [accountIngressAddress]);
    await AccountRules.waitForDeployment();
    console.log("   > Rules deployed with AccountIngress.address = " + accountIngressAddress);


    if (AllowlistUtils.isInitialAllowlistedAccountsAvailable()) {
        console.log("   > Adding Initial Allowlisted Accounts ...");
        let allowlistedAccounts = AllowlistUtils.getInitialAllowlistedAccounts();
        if (allowlistedAccounts.length > 0) {
            let accountsAddedResult = await AccountRules.addAccounts(allowlistedAccounts);
            console.log ("   > Initial Allowlisted Accounts added: " + allowlistedAccounts);
        }
    }

    await AccountIngress.setContractAddress(rulesContractName, AccountRules.target);
    console.log("   > Updated AccountIngress contract with Rules address = " + AccountRules.target);

    console.log("Deploy step finished");
}

module.exports = {
    deploy
}