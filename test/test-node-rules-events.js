const NodeIngressContract = artifacts.require('NodeIngress.sol');
const NodeRulesContract = artifacts.require('NodeRules.sol');
const AdminContract = artifacts.require('Admin.sol');

// Contract keys
const RULES_NAME = "0x72756c6573000000000000000000000000000000000000000000000000000000";
const ADMIN_NAME = "0x61646d696e697374726174696f6e000000000000000000000000000000000000";

// enodeAllowed reponses
const PERMITTED = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const NOT_PERMITTED = "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

const node1High = "0x9bd359fdc3a2ed5df436c3d8914b1532740128929892092b7fcb320c1b62f375";
const node1Low = "0x2e1092b7fcb320c1b62f3759bd359fdc3a2ed5df436c3d8914b1532740128929";
const node1Type = 0; // 0: Boot, 1: Validator, 2: Writer, 3: WriterPartner, 4: ObserverBoot, 5: Other
const node1GeoHash = "0x000000000000";
const node1Name = "node1";
const node1Organization = "organization1";

const newAdmin = "f17f52151EbEF6C7334FAD080c5704D77216b732";

contract("NodeRules (Events)", () => {
  let nodeIngressContract;
  let nodeRulesContract;
  let adminContract;

  beforeEach(async () => {
    nodeIngressContract = await NodeIngressContract.new();

    adminContract = await AdminContract.new();
    await nodeIngressContract.setContractAddress(ADMIN_NAME, adminContract.address);

    nodeRulesContract = await NodeRulesContract.new(nodeIngressContract.address);
    await nodeIngressContract.setContractAddress(RULES_NAME, nodeRulesContract.address);
  })

  it('should emit events when node added', async () => {
    await nodeRulesContract.addEnode(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);
    await nodeRulesContract.addEnode(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);

    // Get the events
    let result = await nodeRulesContract.getPastEvents("NodeAdded", {fromBlock: 0, toBlock: "latest" });

    // Verify the successful NodeAdded event is 'true'
    assert.equal(result[0].returnValues.nodeAdded, true, "nodeAdded SHOULD be true");

    // Verify the unsuccessful dupliate NodeAdded event is 'false'
    assert.equal(result[1].returnValues.nodeAdded, false, "nodeAdded SHOULD be false");
  });

  it('should emit events when node removed', async () => {
    await nodeRulesContract.addEnode(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);
    await nodeRulesContract.removeEnode(node1High, node1Low);
    await nodeRulesContract.removeEnode(node1High, node1Low);

    // Get the events
    let result = await nodeRulesContract.getPastEvents("NodeRemoved", {fromBlock: 0, toBlock: "latest" });

    // Verify the successful NodeRemoved event is 'true'
    assert.equal(result[0].returnValues.nodeRemoved, true, "nodeRemoved SHOULD be true");

    // Verify the unsuccessful duplicate NodeRemoved event is 'false'
    assert.equal(result[1].returnValues.nodeRemoved, false, "nodeRemoved SHOULD be false");
  });
});
