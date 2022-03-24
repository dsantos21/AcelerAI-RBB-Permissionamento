const Admin = artifacts.require("./Admin.sol");

module.exports = async(deployer, network) => {
    

    const admin = await Admin.deployed();
    await admin.revokeAccessToStructuralChanges();
    
    console.log("   > Access revoked");
}
