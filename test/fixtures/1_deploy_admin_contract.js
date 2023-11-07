const AllowlistUtils = require('../../scripts/utils/allowlist_utils');

const Admin = artifacts.require("./Admin.sol");

async function deploy() {
    //await deployer.deploy(Admin);
    //console.log("   > Admin contract deployed with address = " + Admin.address);
    //let instance = await Admin.deployed();

    const instance = await Admin.new(); 
    Admin.setAsDeployed(instance);

    if(AllowlistUtils.isInitialAdminAccountsAvailable()) {
        console.log("   > Adding Initial Admin Accounts ...");
        let initialAdminAccounts = AllowlistUtils.getInitialAdminAccounts();
        if (initialAdminAccounts.length > 0) {
            let adminAddedResult = await instance.addAdmins(initialAdminAccounts);
            console.log ("   > Initial admin accounts added : " + initialAdminAccounts); 
        }
    } 
}

module.exports = {
    deploy
}