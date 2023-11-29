const AllowlistUtils = require('../scripts/allowlist_utils');

const Admin = artifacts.require("./Admin.sol");
const AccountAdmin = artifacts.require("./AccountAdmin.sol");

module.exports = async(deployer, network) => {
    await deployer.deploy(Admin);
    await deployer.deploy(AccountAdmin);

    console.log("   > Admin contract deployed with address = " + Admin.address);
    console.log("   > AccountAdmin contract deployed with address = " + AccountAdmin.address);

    let adminInstance = await Admin.deployed();
    let accountAdminInstance = await AccountAdmin.deployed();

    if(AllowlistUtils.isInitialAdminAccountsAvailable()) {
        console.log("   > Adding Initial Admin and AccountAdmin Accounts ...");
        let initialAdminAccounts = AllowlistUtils.getInitialAdminAccounts();
        if (initialAdminAccounts.length > 0) {
            let adminAddedResult = await adminInstance.addAdmins(initialAdminAccounts);
            let accountAdminAddedResult = await accountAdminInstance.addAccountAdmins(initialAdminAccounts);            
            console.log ("   > Initial admin accounts added : " + initialAdminAccounts); 
        }
    } 
}
