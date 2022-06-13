const Admin = artifacts.require("./Admin.sol");
const AccountIngress = artifacts.require("./AccountIngress.sol");
const NodeIngress = artifacts.require("./NodeIngress.sol");

/* The address of the node ingress contract if pre deployed */
let nodeIngress = process.env.NODE_INGRESS_CONTRACT_ADDRESS;

/* The address of the account ingress contract if pre deployed */
let accountIngress = process.env.ACCOUNT_INGRESS_CONTRACT_ADDRESS;

module.exports = async(deployer, network) => {
    if (! accountIngress) {
        accountIngressContract = await AccountIngress.deployed();
        accountIngress = accountIngressContract.address;
    }
    if (! nodeIngress) {
        nodeIngressContract = await NodeIngress.deployed();
        nodeIngress = nodeIngressContract.address;
    }
    await deployer.deploy(Admin, accountIngress, nodeIngress);
    console.log("   > Admin contract deployed with address = " + Admin.address);
}
