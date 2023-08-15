const Web3Utils = require("web3-utils");
const AllowlistUtils = require('../scripts/allowlist_utils');

const NodeRules = artifacts.require("./NodeRules.sol");
const NodeIngress = artifacts.require("./NodeIngress.sol");
const Admin = artifacts.require("./Admin.sol");

const adminContractName = Web3Utils.utf8ToHex("administration");
const rulesContractName = Web3Utils.utf8ToHex("rules");

/* The address of the node ingress contract if pre deployed */
let nodeIngress = process.env.NODE_INGRESS_CONTRACT_ADDRESS;

module.exports = async(deployer, network) => {
    if (! nodeIngress) {
        // Only deploy if we haven't been provided a predeployed address
        await deployer.deploy(NodeIngress);
        console.log("   > Deployed NodeIngress contract to address = " + NodeIngress.address);
        nodeIngress = NodeIngress.address;

    }
    // If supplied an address, make sure there's something there
    const nodeIngressInstance = await NodeIngress.at(nodeIngress);
    try {
        const result = await nodeIngressInstance.getContractVersion();
        console.log("   > NodeIngress contract initialised at address = " + nodeIngress + " version=" + result);
    } catch (err) {
        console.log(err);
        console.error("   > Predeployed NodeIngress contract is not responding like an NodeIngress contract at address = " + nodeIngress);
    }

    const admin = await Admin.deployed()
    await nodeIngressInstance.setContractAddress(adminContractName, admin.address);
    console.log("   > Updated NodeIngress with Admin  address = " + admin.address);

    await deployer.deploy(NodeRules, nodeIngress);
    console.log("   > NodeRules deployed with NodeIngress.address = " + nodeIngress);
    let nodeRulesContract = await NodeRules.deployed();

    if(AllowlistUtils.isInitialAllowlistedNodesAvailable()) {
        console.log("   > Adding Initial Allowlisted eNodes ...");
        let allowlistedNodes = AllowlistUtils.getInitialAllowlistedNodes();
        for (i = 0; i < allowlistedNodes.length; i++) {
            let enode = allowlistedNodes[i];
            const { enodeHigh, enodeLow, nodeType, geoHash, name, organization } = AllowlistUtils.enodeToParams(enode);
            
            await nodeRulesContract.addNodeDuringDeploy(
                enodeHigh,
                enodeLow,
                nodeType,
                geoHash,
                name,
                organization
            );
            console.log("     > eNode added: " + enode );
        }
    }
    await nodeIngressInstance.setContractAddress(rulesContractName, NodeRules.address);
    console.log("   > Updated NodeIngress contract with NodeRules address = " + NodeRules.address);
    
    await nodeRulesContract.finishDeploy();
    console.log("Deploy step finished");
    
    await nodeRulesContract.triggerRulesChangeEvent(false);
    console.log("Trigger called");
}
