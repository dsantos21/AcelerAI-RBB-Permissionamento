require("@nomiclabs/hardhat-web3");
const AllowlistUtils = require('../utils/allowlist_utils');
const hre = require("hardhat");

async function deploy() {
    const Admin = await hre.ethers.deployContract('Admin');
    await Admin.waitForDeployment();
    console.log("   > Admin contract deployed with address = " + Admin.target);

    if(AllowlistUtils.isInitialAdminAccountsAvailable()) {
        console.log("   > Adding Initial Admin Accounts ...");
        let initialAdminAccounts = AllowlistUtils.getInitialAdminAccounts();
        if (initialAdminAccounts.length > 0) {
            let adminAddedResult = await Admin.addAdmins(initialAdminAccounts);
            console.log ("   > Initial admin accounts added : " + initialAdminAccounts); 
        }
    } 

    console.log("Deploy step finished");
    
    return Admin.target;
}

module.exports = {
    deploy
}