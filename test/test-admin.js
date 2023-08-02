const Admin = artifacts.require('Admin.sol');
const { time } = require('@openzeppelin/test-helpers');

contract("Admin (admin management)", async accounts => {

  let adminContract;

  beforeEach(async () => {
    adminContract = await Admin.new();
  })

  it("accounts that deployed contract should be admin", async () => {
    let isAuthorized = await adminContract.isAuthorized(accounts[0]);

    assert.ok(isAuthorized);
  });

  it("non-deployer account should not be admin", async () => {
    let isAuthorized = await adminContract.isAuthorized(accounts[1]);
    assert.notOk(isAuthorized);
  });

  it("non admin cannot add another admin", async () => {
    try {
      await adminContract.addAdmin(accounts[2], { from: accounts[1] });
      expect.fail(null, null, "Modifier was not enforced")
    } catch(err) {
      expect(err.reason).to.contain('Sender not authorized');
    }
  });

  it("admin can add another admin", async () => {
    await adminContract.addAdmin(accounts[2], { from: accounts[0] });
    let isAuthorized = await adminContract.isAuthorized(accounts[2]);
    assert.ok(isAuthorized);
  });

  it("non admin cannot remove another admin", async () => {
    try {
      await adminContract.removeAdmin(accounts[2], { from: accounts[1] });
      expect.fail(null, null, "Modifier was not enforced")
    } catch(err) {
      expect(err.reason).to.contain("Sender not authorized");
    }
  });

  it("admin can remove another admin", async () => {
    await adminContract.addAdmin(accounts[2], { from: accounts[0] });
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena
    let isAuthorized = await adminContract.isAuthorized(accounts[2]);
    assert.ok(isAuthorized);

    tx = await adminContract.removeAdmin(accounts[2], { from: accounts[0] });
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena
    isAuthorized = await adminContract.isAuthorized(accounts[2]);
    assert.notOk(isAuthorized);
  });

  it("admin cannot remove himself", async () => {
    try {
      await adminContract.removeAdmin(accounts[0], { from: accounts[0] });
      expect.fail(null, null, "Modifier was not enforced")
    } catch(err) {
      expect(err.reason).to.contain("Cannot invoke method with own account as parameter");
    }
  });


  it("get admins list", async () => {
    let admins = await adminContract.getAdmins.call();

    assert.sameMembers([accounts[0]], admins)
  });

  it("get admins list reflect changes", async () => {
    let admins = await adminContract.getAdmins.call();
    assert.sameMembers([accounts[0]], admins)

    await adminContract.addAdmin(accounts[1], { from: accounts[0] });
    admins = await adminContract.getAdmins.call();
    assert.sameMembers([accounts[0], accounts[1]], admins);

    await time.increase(time.duration.days(1)); // Avança 1 dia

    await adminContract.addAdmin(accounts[2], { from: accounts[0] });
    admins = await adminContract.getAdmins.call();
    assert.sameMembers([accounts[0], accounts[1], accounts[2]], admins);

    await time.increase(time.duration.days(1)); // Avança 1 dia

    await adminContract.removeAdmin(accounts[1], { from: accounts[0] });
    admins = await adminContract.getAdmins.call();
    assert.sameMembers([accounts[0], accounts[2]], admins);
  });

//-------------------------------------------- QUARENTENA - ADD -------------------------------------------------------------------------------

  it("should not allow an admin to add another admin within 24 hours", async () => {
    await adminContract.addAdmin(accounts[1], { from: accounts[0] }); //o admin0 (considerando que accounts[0] já é um admin) tenta adicionar adicionar admin1
    await time.increase(time.duration.hours(1)); // Avança 1 hora, ou seja, não adiciona admin1
    let isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.ok(isAuthorized1);
  });

  it("should allow an admin to add another admin after 24 hours", async () => {
    await adminContract.addAdmin(accounts[1], { from: accounts[0] }); //o admin0 tenta adicionar admin1
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena e adiciona admin1
    let isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.ok(isAuthorized1);
  });

  it("added admin should be able to add another admin after 24 hours", async () => {
    await adminContract.addAdmin(accounts[1], { from: accounts[0] }); //admin0 tenta adiciona admin1
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena
    let isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.ok(isAuthorized1);

    await adminContract.addAdmin(accounts[2], { from: accounts[1] }); //o admin1 tenta adicionar admin2 
    await time.increase(time.duration.days(1)); // Avança 1 hora, ou seja, não se torna admin
    let isAuthorized2 = await adminContract.isAuthorized(accounts[2]);
    assert.ok(isAuthorized2);
  });

  it("added admin must not be able to add another admin within 24 hours", async () => {
    await adminContract.addAdmin(accounts[1], { from: accounts[0] }); //o admin0 tenta adicionar admin1
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena
    let isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.ok(isAuthorized1);

    await adminContract.addAdmin(accounts[2], { from: accounts[1] }); //o admin1 tenta adicionar admin2
    await time.increase(time.duration.hours(1)); // Avança 1 hora, ou seja, não adiciona outro admin
    let isAuthorized2 = await adminContract.isAuthorized(accounts[2]);
    assert.ok(isAuthorized2);
  });

//-------------------------------------------- QUARENTENA - REMOVE -------------------------------------------------------------------------------

  it("should not allow removing an admin after having removed another admin within 24 hours", async () => {
    await adminContract.addAdmin(accounts[1], { from: accounts[0] }); //o admin0 tenta adicionar admin1
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena e adiciona admin1
    let isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.ok(isAuthorized1);

    await adminContract.addAdmin(accounts[2], { from: accounts[1] }); //o admin1 tenta adicionar admin2
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena e adiciona admin2
    let isAuthorized2 = await adminContract.isAuthorized(accounts[2]);
    assert.ok(isAuthorized2);

    await adminContract.removeAdmin(accounts[2], { from: accounts[0] }); //o admin0 tenta remover admin2
    await time.increase(time.duration.hours(1)); // Avança 1 hora, ou seja, não remove admin ainda
    isAuthorized2 = await adminContract.isAuthorized(accounts[2]);
    assert.notOk(isAuthorized2);

    await adminContract.removeAdmin(accounts[1], { from: accounts[0] }); //o admin0 tenta remover admin1 dentro da quarentena
    isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.ok(isAuthorized1); // Certificando-se de que a remoção não foi bem-sucedida
  });

  it("should allow removing an admin after having removed another admin after 24 hours", async () => {
    await adminContract.addAdmin(accounts[1], { from: accounts[0] }); //o admin0 tenta adicionar admin1 
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena e adiciona admin2
    let isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.ok(isAuthorized1);

    await adminContract.addAdmin(accounts[2], { from: accounts[1] }); //o admin1 tenta adicionar admin2
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena e adiciona admin2
    let isAuthorized2 = await adminContract.isAuthorized(accounts[2]);
    assert.ok(isAuthorized2);

    await adminContract.removeAdmin(accounts[2], { from: accounts[0] }); //o admin0 tenta remover admin2
    await time.increase(time.duration.days(1)); // Avança 1 dia, ou seja, remove admin 
    isAuthorized2 = await adminContract.isAuthorized(accounts[2]);
    assert.notOk(isAuthorized2);

    await adminContract.removeAdmin(accounts[1], { from: accounts[0] }); //o admin0 tenta remover admin2 fora da quarentena
    await time.increase(time.duration.days(1)); // Avança 1 dia, ou seja, remove admin 
    isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.notOk(isAuthorized1);
  });

  it("admin added must be able to remove another admin after 24 hours", async () => {
    await adminContract.addAdmin(accounts[1], { from: accounts[0] }); //admin0 tenta adiciona admin1
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena e adiciona admin1
    let isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.ok(isAuthorized1);

    await adminContract.removeAdmin(accounts[0], { from: accounts[1] }); //o admin1 tenta remover admin0 após quarentena
    await time.increase(time.duration.days(1)); // Avança 1 dia da quarentena e remove admin0
    let isAuthorized2 = await adminContract.isAuthorized(accounts[0]);
    assert.notOk(isAuthorized2);
  });

  it("admin added must not be able to remove another admin within 24 hours", async () => {
    await adminContract.addAdmin(accounts[1], { from: accounts[0] }); //admin0 tenta adiciona admin1
    await time.increase(time.duration.hours(1)); // Avança 11 dia da quarentena e adiciona admin1
    let isAuthorized1 = await adminContract.isAuthorized(accounts[1]);
    assert.ok(isAuthorized1);

    await adminContract.removeAdmin(accounts[0], { from: accounts[1] }); //o admin1 tenta remover admin0 dentro da quarentena
    await time.increase(time.duration.days(1)); //Avança 1 dia da quarentena e ainda não remove admin0
    let isAuthorized2 = await adminContract.isAuthorized(accounts[0]);
    assert.ok(isAuthorized2);
  });

  it("admin can add multiple admins", async () => {
    await adminContract.addAdmins([accounts[2], accounts[3]], { from: accounts[0] });

    let isAdmin2 = await adminContract.isAuthorized(accounts[2]);
    let isAdmin3 = await adminContract.isAuthorized(accounts[3]);

    assert.ok(isAdmin2);
    assert.ok(isAdmin3);
  });

  it("non admin cannot add multiple admins", async () => {
    try {
        await adminContract.addAdmins([accounts[2], accounts[3]], { from: accounts[1] });
        expect.fail(null, null, "Modifier was not enforced")
    } catch(err) {
        expect(err.reason).to.contain('Sender not authorized');
    }
  });


  it("Should emit events when an Admin is added", async () => {
    const ownAddress = accounts[0].toLowerCase();
    const address = accounts[1].toLowerCase();

    // Add a new account
    await adminContract.addAdmin(address);
    let block0 = await web3.eth.getBlock("latest");
    let blockTimestamp0 = block0['timestamp'];

    await time.increase(time.duration.days(1)); // Avança 1 dia

    // Attempt to add a duplicate entry
    await adminContract.addAdmin(address);
    let block1 = await web3.eth.getBlock("latest");
    let blockTimestamp1 = block1['timestamp'];

    await time.increase(time.duration.days(1)); // Avança 1 dia

    // Attempt to add self
    await adminContract.addAdmin(ownAddress);
    let block2 = await web3.eth.getBlock("latest");
    let blockTimestamp2 = block2['timestamp'];

    await time.increase(time.duration.days(1)); // Avança 1 dia

    // Get the events
    let result = await adminContract.getPastEvents("AdminAdded", {fromBlock: 0, toBlock: "latest" });

    // Verify the first AccountAdded event is 'true'
    assert.equal(result[0].returnValues.adminAdded, true, "adminAdded SHOULD be true");
    assert.equal(result[0].returnValues.accountGrantee.toLowerCase(), address, "account grantee address SHOULD be " + address);
    assert.equal(result[0].returnValues.accountGrantor.toLowerCase(), ownAddress, "account grantor SHOULD be " + ownAddress);
    assert.equal(result[0].returnValues.blockTimestamp, blockTimestamp0, "block timestamp SHOULD be " + blockTimestamp0);
    assert.equal(result[0].returnValues.message, "Admin account added successfully", "adding Admin successfully message SHOULD be correct");

    // Verify the unsuccessful duplicate AccountAdded event is 'false'
    assert.equal(result[1].returnValues.adminAdded, false, "adminAdded with duplicate account SHOULD be false");
    
    assert.equal(result[1].returnValues.accountGrantee.toLowerCase(), address, "account grantee address SHOULD be " + address);
    assert.equal(result[1].returnValues.accountGrantor.toLowerCase(), ownAddress, "account grantor SHOULD be " + ownAddress);
    assert.equal(result[1].returnValues.blockTimestamp, blockTimestamp1, "block timestamp SHOULD be " + blockTimestamp1);

    // Verify the unsuccessful duplicate AccountAdded event has correct message
    assert.equal(result[1].returnValues.message, "Account is already an Admin", "duplicate Admin error message SHOULD be correct");

    // Verify the adding own account AccountAdded event is 'false'
    assert.equal(result[2].returnValues.adminAdded, false, "adminAdded with own account SHOULD be false");
    
    assert.equal(result[2].returnValues.accountGrantee.toLowerCase(), ownAddress, "account grantee address SHOULD be " + ownAddress);
    assert.equal(result[2].returnValues.accountGrantor.toLowerCase(), ownAddress, "account grantor SHOULD be " + ownAddress);
    assert.equal(result[2].returnValues.blockTimestamp, blockTimestamp2, "block timestamp SHOULD be " + blockTimestamp2);

    // Verify the adding own account AccountAdded event has correct message
    assert.equal(result[2].returnValues.message, "Adding own account as Admin is not permitted", "adding self Admin error message SHOULD be correct");
  });

  it("Should emit events when multiple Admins are added", async () => {
    const ownAddress = accounts[0].toLowerCase();
    const address = accounts[1].toLowerCase();

    //add same account twice and attempt to add self
    await adminContract.addAdmins([address, address, ownAddress])
    let block = await web3.eth.getBlock("latest");
    let blockTimestamp = block['timestamp'];

    // Get the events
    let result = await adminContract.getPastEvents("AdminAdded", {fromBlock: 0, toBlock: "latest" });

    // Verify the first AccountAdded event is 'true'
    assert.equal(result[0].returnValues.adminAdded, true, "adminAdded SHOULD be true");
    assert.equal(result[0].returnValues.accountGrantee.toLowerCase(), address, "account grantee address SHOULD be " + address);
    assert.equal(result[0].returnValues.accountGrantor.toLowerCase(), ownAddress, "account grantor SHOULD be " + ownAddress);
    assert.equal(result[0].returnValues.blockTimestamp, blockTimestamp, "block timestamp SHOULD be " + blockTimestamp);
    assert.equal(result[0].returnValues.message, "Admin account added successfully", "adding Admin successfully message SHOULD be correct");

    // Verify the unsuccessful duplicate AccountAdded event is 'false'
    assert.equal(result[1].returnValues.adminAdded, false, "adminAdded with duplicate account SHOULD be false");

    assert.equal(result[1].returnValues.accountGrantee.toLowerCase(), address, "account grantee address SHOULD be " + address);
    assert.equal(result[1].returnValues.accountGrantor.toLowerCase(), ownAddress, "account grantor SHOULD be " + ownAddress);
    assert.equal(result[1].returnValues.blockTimestamp, blockTimestamp, "block timestamp SHOULD be " + blockTimestamp);

    // Verify the unsuccessful duplicate AccountAdded event has correct message
    assert.equal(result[1].returnValues.message, "Account is already an Admin", "duplicate Admin error message SHOULD be correct");

    // Verify the adding own account AccountAdded event is 'false'
    assert.equal(result[2].returnValues.adminAdded, false, "adminAdded with own account SHOULD be false");

    assert.equal(result[2].returnValues.accountGrantee.toLowerCase(), ownAddress, "account grantee address SHOULD be " + ownAddress);
    assert.equal(result[2].returnValues.accountGrantor.toLowerCase(), ownAddress, "account grantor SHOULD be " + ownAddress);
    assert.equal(result[2].returnValues.blockTimestamp, blockTimestamp, "block timestamp SHOULD be " + blockTimestamp);

    // Verify the adding own account AccountAdded event has correct message
    assert.equal(result[2].returnValues.message, "Adding own account as Admin is not permitted", "adding self Admin error message SHOULD be correct");
  });

  it("Should emit events when an Admin is removed", async () => {
    const ownAddress = accounts[0].toLowerCase();
    const address = accounts[1].toLowerCase();

    // Add a new account
    await adminContract.addAdmin(address);
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena

    await adminContract.removeAdmin(address);
    let block0 = await web3.eth.getBlock("latest");
    let blockTimestamp0 = block0['timestamp'];
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena

    await adminContract.removeAdmin(address);
    let block1 = await web3.eth.getBlock("latest");
    let blockTimestamp1 = block1['timestamp'];
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena

    let result = await adminContract.getPastEvents("AdminRemoved", {fromBlock: 0, toBlock: "latest" });

    // Verify the first AccountRemoved event is 'true'
    assert.equal(result[0].returnValues.adminRemoved, true, "adminRemoved SHOULD be true");
    assert.equal(result[0].returnValues.accountGrantee.toLowerCase(), address, "account grantee address SHOULD be " + address);
    assert.equal(result[0].returnValues.accountGrantor.toLowerCase(), ownAddress, "account grantor SHOULD be " + ownAddress);
    assert.equal(result[0].returnValues.blockTimestamp, blockTimestamp0, "block timestamp SHOULD be " + blockTimestamp0);

    // Verify the second AccountRemoved event is 'false'
    assert.equal(result[1].returnValues.adminRemoved, false, "adminRemoved SHOULD be false");
    assert.equal(result[1].returnValues.accountGrantee.toLowerCase(), address, "account grantee address SHOULD be " + address);
    assert.equal(result[1].returnValues.accountGrantor.toLowerCase(), ownAddress, "account grantor SHOULD be " + ownAddress);
    assert.equal(result[1].returnValues.blockTimestamp, blockTimestamp1, "block timestamp SHOULD be " + blockTimestamp1);

  });
});
