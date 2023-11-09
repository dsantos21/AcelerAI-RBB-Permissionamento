require("@nomiclabs/hardhat-web3");
const Web3Utils = require("web3-utils");
const AllowlistUtils = require('../utils/allowlist_utils');
const hre = require("hardhat");

const adminContractName = hre.ethers.zeroPadBytes(Web3Utils.utf8ToHex("administration"), 32);
const rulesContractName = hre.ethers.zeroPadBytes(Web3Utils.utf8ToHex("rules"), 32);

/* The address of the node ingress contract if pre deployed */
let nodeIngressAddress = process.env.NODE_INGRESS_CONTRACT_ADDRESS;

async function deploy(adminAddress) {
    let NodeIngress;
    if (! nodeIngressAddress) {
        // Only deploy if we haven't been provided a predeployed address
        NodeIngress = await hre.ethers.deployContract('NodeIngress');
        await NodeIngress.waitForDeployment();

        console.log("   > Deployed NodeIngress contract to address = " + NodeIngress.target);
        nodeIngressAddress = NodeIngress.target;

    }
    else {
        // If supplied an address, make sure there's something there
        NodeIngress = await hre.ethers.getContractAt('NodeIngress', nodeIngressAddress);
    }

    try {
        const result = await NodeIngress.getContractVersion();
        console.log("   > NodeIngress contract initialised at address = " + nodeIngressAddress + " version=" + result);
    } catch (err) {
        console.log(err);
        console.error("   > Predeployed NodeIngress contract is not responding like an NodeIngress contract at address = " + nodeIngressAddress);
    }

    await NodeIngress.setContractAddress(adminContractName, adminAddress);
    console.log("   > Updated NodeIngress with Admin  address = " + adminAddress);

    const NodeRules = await hre.ethers.deployContract('NodeRules', [nodeIngressAddress]);
    await NodeRules.waitForDeployment();
    console.log("   > NodeRules deployed with NodeIngress.address = " + nodeIngressAddress);

    if(AllowlistUtils.isInitialAllowlistedNodesAvailable()) {
        console.log("   > Adding Initial Allowlisted eNodes ...");
        let allowlistedNodes = AllowlistUtils.getInitialAllowlistedNodes();
        for (i = 0; i < allowlistedNodes.length; i++) {
            let enode = allowlistedNodes[i];
            const { enodeHigh, enodeLow, nodeType, geoHash, name, organization } = AllowlistUtils.enodeToParams(enode);

            tx =  await NodeRules.addNodeDuringDeploy( // definição de tx para chamá-lo mais abaixo, após o fim de cada transação. (Paliativo para resolver o problema de "encavalamento" de transação).
                enodeHigh,
                enodeLow,
                nodeType,
                geoHash,
                name,
                organization
            );
            await tx.wait();
            console.log("     > eNode added: " + enode );
        }
    }
    tx = await NodeIngress.setContractAddress(rulesContractName, NodeRules.target); // tx aguarda cada transação a ser feita.
    console.log("   > Updated NodeIngress contract with NodeRules address = " + NodeRules.target);

    //await NodeRules.finishDeploy();
    console.log("Deploy step finished");

    await tx.wait(); // Aguarda o término da transação anterior para não provocar erro na verificação da próxima (solidity require...)

    await NodeRules.triggerRulesChangeEvent(false);
    console.log("Trigger called");
}

module.exports = {
    deploy
}
