const Web3Utils = require("web3-utils");

const NodeRules = artifacts.require("./NodeRules.sol");
const NodeIngress = artifacts.require("./NodeIngress.sol");
const Admin = artifacts.require("./Admin.sol");

const adminContractName = Web3Utils.utf8ToHex("administration");
const rulesContractName = Web3Utils.utf8ToHex("rules");

/* The address of the node ingress contract if pre deployed */
let nodeIngress = process.env.NODE_INGRESS_CONTRACT_ADDRESS;

module.exports = async(deployer, network) => {

    const admin = await Admin.deployed();
    if (! nodeIngress) {
        const nodeIngressContract = await NodeIngress.deployed()
        nodeIngress = nodeIngressContract.address;
    }

    const nodeIngressInstance = await NodeIngress.at(nodeIngress);

    await deployer.deploy(NodeRules, admin.address, nodeIngress);
    console.log("   > NodeRules deployed with NodeIngress.address = " + nodeIngress);

    await nodeIngressInstance.setContractAddress(rulesContractName, NodeRules.address);
    console.log("   > Updated NodeIngress contract with NodeRules address = " + NodeRules.address);

    // The admin contract must be the last one to be setted in Node Ingress Contract
    await nodeIngressInstance.setContractAddress(adminContractName, admin.address);
    console.log("   > Updated NodeIngress with Admin address = " + admin.address);
}
