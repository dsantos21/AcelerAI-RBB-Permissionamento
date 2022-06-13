const NodeIngress = artifacts.require("./NodeIngress.sol");

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
}