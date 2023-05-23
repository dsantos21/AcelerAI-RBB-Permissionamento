const BN = web3.utils.BN;
const NodeRulesList = artifacts.require('ExposedNodeRulesList.sol');

const node1High = "0x9bd359fdc3a2ed5df436c3d8914b1532740128929892092b7fcb320c1b62f375";
const node1Low = "0x2e1092b7fcb320c1b62f3759bd359fdc3a2ed5df436c3d8914b1532740128929";
const node1Type = 0; // 0: Boot, 1: Validator, 2: Writer, 3: WriterPartner, 4: ObserverBoot, 5: Other
const node1GeoHash = "0x000000000000";
const node1Name = "node1";
const node1Organization = "organization1";
const node2High = "0x892092b7fcb320c1b62f3759bd359fdc3a2ed5df436c3d8914b1532740128929";
const node2Low = "0xcb320c1b62f37892092b7f59bd359fdc3a2ed5df436c3d8914b1532740128929";
const node2Type = 0; // 0: Boot, 1: Validator, 2: Writer, 3: WriterPartner, 4: ObserverBoot, 5: Other
const node2GeoHash = "0x000000000000";
const node2Name = "node2";
const node2Organization = "organization2";
const node3High = "0x765092b7fcb320c1b62f3759bd359fdc3a2ed5df436c3d8914b1532740128929";
const node3Low = "0x920982b7fcb320c1b62f3759bd359fdc3a2ed5df436c3d8914b1532740128929";
const node3Type = 0; // 0: Boot, 1: Validator, 2: Writer, 3: WriterPartner, 4: ObserverBoot, 5: Other
const node3GeoHash = "0x000000000000";
const node3Name = "node3";
const node3Organization = "organization3";

contract("NodeRulesList (list manipulation)", async () => {

  let rulesListContract;

  beforeEach(async () => {
    rulesListContract = await NodeRulesList.new();
  });

  it("should calculate same key for same enode", async () => {
    let key1 = new BN(await rulesListContract._calculateKey(node1High, node1Low));
    let key2 = new BN(await rulesListContract._calculateKey(node1High, node1Low));

    assert.ok(key1.eq(key2))
  });

  it("should calculate different key for different enode", async () => {
    let key1 = new BN(await rulesListContract._calculateKey(node1High, node1Low));
    let key2 = new BN(await rulesListContract._calculateKey(node2High, node2Low));

    assert.notOk(key1.eq(key2))
  });

  it("should start with an empty list of rules", async () => {
    let size = await rulesListContract._size();

    assert.equal(size, 0);
  });

  it("size method reflect list size", async () => {
    await rulesListContract._add(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);
    await rulesListContract._add(node2High, node2Low, node2Type, node2GeoHash, node2Name, node2Organization);
    await rulesListContract._add(node3High, node3Low, node3Type, node3GeoHash, node3Name, node3Organization);

    let size = await rulesListContract._size();
    assert.equal(size, 3);
  });

  it("exists should return true for existing address", async () => {
    await rulesListContract._add(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);

    let exists = await rulesListContract._exists(node1High, node1Low);

    assert.ok(exists);
  });

  it("exists should return false for absent address", async () => {
    // adding another address so list is not empty
    await rulesListContract._add(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);

    let exists = await rulesListContract._exists(node2High, node2Low);

    assert.notOk(exists);
  });

  it("exists should return false when list is empty", async () => {
    let exists = await rulesListContract._exists(node1High, node1Low);

    assert.notOk(exists);
  });

  it("add enode to list should add node to the list and increase list size", async () => {
    let exists = await rulesListContract._exists(node1High, node1Low);
    assert.notOk(exists);
    let size = await rulesListContract._size();
    assert.equal(size, 0);

    await rulesListContract._add(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);

    exists = await rulesListContract._exists(node1High, node1Low);
    assert.ok(exists);
    size = await rulesListContract._size();
    assert.equal(size, 1);
  });

  it("add existing enode should do nothing on second insert", async () => {
    await rulesListContract._add(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);
    await rulesListContract._add(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);

    let size = await rulesListContract._size();
    assert.equal(size, 1);

    let exists = await rulesListContract._exists(node1High, node1Low);
    assert.ok(exists);
  });

  it("remove absent enode should not fail", async () => {
    let txResult = await rulesListContract._remove(node1High, node1Low);

    assert.ok(txResult.receipt.status);
  });

  it("remove enode from list should remove enode from list and decrease list size", async () => {
    await rulesListContract._add(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization);
    let size = await rulesListContract._size();
    assert.equal(size, 1);
    let exists = await rulesListContract._exists(node1High, node1Low);
    assert.ok(exists);

    await rulesListContract._remove(node1High, node1Low);

    size = await rulesListContract._size();
    assert.equal(size, 0);
    exists = await rulesListContract._exists(node1High, node1Low);
    assert.notOk(exists);
  });

  it("get by index on empty list should return undefined", async () => {
    let node = await rulesListContract.allowlist[0];

    assert.isUndefined(node);
  });
});
