const NodeIngress = artifacts.require('NodeIngress.sol');
const NodeRules = artifacts.require('NodeRules.sol');
const Admin = artifacts.require('Admin.sol');

const RULES='0x72756c6573000000000000000000000000000000000000000000000000000000';
const ADMIN='0x61646d696e697374726174696f6e000000000000000000000000000000000000';

const node1High = "0x9bd359fdc3a2ed5df436c3d8914b1532740128929892092b7fcb320c1b62f375";
const node1Low = "0x2e1092b7fcb320c1b62f3759bd359fdc3a2ed5df436c3d8914b1532740128929";
const node1Host = "0x0000000000000000000011119bd359fd";
const node1Port = 1;
const node1Type = 0; // 0: Boot, 1: Validator, 2: Writer, 3: WriterPartner, 4: ObserverBoot, 5: Other
const node1GeoHash = "0x000000000000";
const node1Name = "node1";
const node1Organization = "organization1";

const node2High = "0x892092b7fcb320c1b62f3759bd359fdc3a2ed5df436c3d8914b1532740128929";
const node2Low = "0xcb320c1b62f37892092b7f59bd359fdc3a2ed5df436c3d8914b1532740128929";
const node2Host = "0x0000000000000000000011119bd359fd";
const node2Port = 2;
const node2Type = 0; // 0: Boot, 1: Validator, 2: Writer, 3: WriterPartner, 4: ObserverBoot, 5: Other
const node2GeoHash = "0x000000000000";
const node2Name = "node2";
const node2Organization = "organization2";

contract ('NodeIngress (proxying permissioning check to rules contract)', () => {

  let nodeIngressContract;
  let nodeRulesContract;
  let adminContract;

  beforeEach(async () => {
    nodeIngressContract = await NodeIngress.new();
    adminContract = await Admin.new();
    
    await nodeIngressContract.setContractAddress(ADMIN, adminContract.address);
    nodeRulesContract = await NodeRules.new(nodeIngressContract.address);

    result = await nodeIngressContract.getContractAddress(ADMIN);
    assert.equal(result, adminContract.address, 'Admin contract should be reg');
  });

  it('Should execute proxied call correctly', async () => {
    let result;
    let result2;

    await nodeIngressContract.setContractAddress(RULES, nodeRulesContract.address);

    result = await nodeIngressContract.getContractAddress(ADMIN);
    assert.equal(result, adminContract.address, 'Admin contract should be reg');

    // Verify that the NodeRules contract has been registered
    result = await nodeIngressContract.getContractAddress(RULES);
    assert.equal(result, nodeRulesContract.address, 'NodeRules contract should be reg');

    // Verify that the nodes are not permitted to talk
    result2 = await nodeRulesContract.connectionAllowed(node1High, node1Low, node1Host, node1Port, node2High, node2Low, node2Host, node2Port);
    result = await nodeIngressContract.connectionAllowed(node1High, node1Low, node1Host, node1Port, node2High, node2Low, node2Host, node2Port);
    assert.equal(result, "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", "Connection should NOT be allowed before Enodes have been registered");
    assert.equal(result, result2, "Call and proxy call did NOT return the same value");

    // Add the two Enodes to the NodeRules register
    result = await nodeRulesContract.addEnode(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);
    result = await nodeRulesContract.addEnode(node2High, node2Low, node2Type, node2GeoHash, node2Name, node2Organization);
    // Verify that the nodes are now able to talk
    result = await nodeIngressContract.connectionAllowed(node1High, node1Low, node1Host, node1Port, node2High, node2Low, node2Host, node2Port);
    result2 = await nodeRulesContract.connectionAllowed(node1High, node1Low, node1Host, node1Port, node2High, node2Low, node2Host, node2Port);
    assert.equal(result, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", "Connection SHOULD be allowed after Enodes have been registered");
    assert.equal(result, result2, "Call and proxy call did NOT return the same value");
  });

  it('Should permit changing active NodeRules contract addresses', async () => {
    let result;

    // const icProxy = await NodeIngress.new();
    const rcProxy1 = await NodeRules.new(nodeIngressContract.address);

    // Verify that the NodeRules contract has not been registered
    result = await nodeIngressContract.getContractAddress(RULES);
    assert.equal(result, "0x0000000000000000000000000000000000000000", 'NodeRules contract should NOT already be registered');

    // Register the initial NodeRules contract
    await nodeIngressContract.setContractAddress(RULES, rcProxy1.address);

    // Verify the initial rules contract has been registered
    result = await nodeIngressContract.getContractAddress(RULES);
    assert.equal(result, rcProxy1.address, 'Initial contract has NOT been registered correctly');

    // Verify that the newly registered contract is the initial version
    let contract = await NodeRules.at(result);
    result = await contract.getContractVersion();
    assert.equal(web3.utils.toDecimal(result), 1000000, 'Initial contract is NOT the correct version');

  });
});