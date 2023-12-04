const AccountAdmin = artifacts.require('AccountAdmin.sol');
const { time } = require('@openzeppelin/test-helpers');

contract("AccountAdmin (admin management)", async accounts => {

  let accountAdminContract;

  beforeEach(async () => {
    accountAdminContract = await AccountAdmin.new();
  })

/*  it("accounts that deployed contract should be admin", async () => {
    let isAuthorized = await accountAdminContract.isAuthorized(accounts[0]);

    assert.ok(isAuthorized);
  });

  it("non-deployer account should not be admin", async () => {
    let isAuthorized = await accountAdminContract.isAuthorized(accounts[1]);
    assert.notOk(isAuthorized);
  });

  it("non admin cannot add another admin", async () => {
    try {
      await accountAdminContract.addAdmin(accounts[2], { from: accounts[1] });
      expect.fail(null, null, "Modifier was not enforced")
    } catch(err) {
      expect(err.reason).to.contain('Sender not authorized');
    }
  });

  it("admin can add another admin", async () => {
    await accountAdminContract.addAdmin(accounts[2], { from: accounts[0] });
    let isAuthorized = await accountAdminContract.isAuthorized(accounts[2]);
    assert.ok(isAuthorized);
  });

  it("non admin cannot remove another admin", async () => {
    try {
      await accountAdminContract.removeAdmin(accounts[2], { from: accounts[1] });
      expect.fail(null, null, "Modifier was not enforced")
    } catch(err) {
      expect(err.reason).to.contain("Sender not authorized");
    }
  });

  it("admin can remove another admin", async () => {
    await accountAdminContract.addAdmin(accounts[2], { from: accounts[0] });
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena
    let isAuthorized = await accountAdminContract.isAuthorized(accounts[2]);
    assert.ok(isAuthorized);

    tx = await accountAdminContract.removeAdmin(accounts[2], { from: accounts[0] });
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena
    isAuthorized = await accountAdminContract.isAuthorized(accounts[2]);
    assert.notOk(isAuthorized);
  });

  it("admin cannot add himself", async () => {
    //new test - ok?
    let returned = await accountAdminContract.addAdmin(accounts[0], { from: accounts[0] });

    let event = returned.logs[0].args;
    let added = event.adminAdded;

    assert.equal(added, false, "There was an error! Adding own account as Admin was permitted!");
  });

  it("admin cannot remove himself", async () => {
    try {
      await accountAdminContract.removeAdmin(accounts[0], { from: accounts[0] });
      expect.fail(null, null, "Modifier was not enforced")
    } catch(err) {
      expect(err.reason).to.contain("Cannot remove yourself");
    }
  });


  it("get admins list", async () => {
    let admins = await accountAdminContract.getAdmins.call();
    assert.sameMembers([accounts[0]], admins)
  });

  it("get admins list reflect changes", async () => {
    let admins = await accountAdminContract.getAdmins.call();
    assert.sameMembers([accounts[0]], admins)

    await accountAdminContract.addAdmin(accounts[1], { from: accounts[0] });
    admins = await accountAdminContract.getAdmins.call();
    assert.sameMembers([accounts[0], accounts[1]], admins);

    await time.increase(time.duration.days(1)); // Avança 1 dia

    await accountAdminContract.addAdmin(accounts[2], { from: accounts[0] });
    admins = await accountAdminContract.getAdmins.call();
    assert.sameMembers([accounts[0], accounts[1], accounts[2]], admins);

    await time.increase(time.duration.days(1)); // Avança 1 dia

    await accountAdminContract.removeAdmin(accounts[1], { from: accounts[0] });
    admins = await accountAdminContract.getAdmins.call();
    assert.sameMembers([accounts[0], accounts[2]], admins);
  });

//-------------------------------------------- QUARANTINE - ADD -------------------------------------------------------------------------------

  it("Should not allow an admin to add another admin within 24 hours", async () => {
    await accountAdminContract.addAdmin(accounts[1], { from: accounts[0] });
    await time.increase(time.duration.hours(1));
    let returned = await accountAdminContract.addAdmin(accounts[2], {from: accounts[0]});

    let logs = returned.logs[0].args;
    let grantee = logs.accountGrantee;
    let grantor = logs.accountGrantor;
    let added = logs.adminAdded;

    let isAuthorized = await accountAdminContract.isAuthorized(accounts[2]);
    assert.equal(added, false, "There was an error! Account 2 was added");
    assert.equal(isAuthorized, false, "There was an error! Account 2 is authorized");
    assert.equal(grantor, accounts[0], "There was an error! Account 0 is not the grantor!");
    assert.equal(grantee, accounts[2], "There was an error! Account 2 is not the grantee!");
  });

  it("Should not allow a recently added admin to add another admin within 24 hours", async () => {
    let returned1 = await accountAdminContract.addAdmin(accounts[1], { from: accounts[0] });
    await time.increase(time.duration.hours(1));
    let returned2 = await accountAdminContract.addAdmin(accounts[2], {from: accounts[1]});

    let isAuthorized = await accountAdminContract.isAuthorized(accounts[2]);
    let logs1 = returned1.logs[0].args;
    let added1 = logs1.adminAdded;
    let grantee1 = logs1.accountGrantee;
    let grantor1 = logs1.accountGrantor;

    let logs2 = returned2.logs[0].args;
    let added2 = logs2.adminAdded;
    let grantee2 = logs2.accountGrantee;
    let grantor2 = logs2.accountGrantor;

    assert.equal(added1, true, "There was an error! First admin was not added!");
    assert.equal(grantee1, accounts[1], "There was an error! Account 1 is not the grantee!");
    assert.equal(grantor1, accounts[0], "There was an error! Account 0 is not the grantor!");

    assert.notOk(isAuthorized);
    assert.equal(added2, false, "There was an error! Second admin was added!");
    assert.equal(grantee2, accounts[2], "There was an error! Account 2 is not the grantee!");
    assert.equal(grantor2, accounts[1], "There was an error! Account 1 is not the grantor!");
  });

  it("Should allow a recently added admin to add another admin after 24 hours", async () => {
    let returned1 = await accountAdminContract.addAdmin(accounts[1], { from: accounts[0] }); //o admin0 tenta adicionar admin1
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena
    let returned2 = await accountAdminContract.addAdmin(accounts[2], { from: accounts[1] });

    let isAuthorized = await accountAdminContract.isAuthorized(accounts[2]);
    let logs1 = returned1.logs[0].args;
    let added1 = logs1.adminAdded;
    let grantee1 = logs1.accountGrantee;
    let grantor1 = logs1.accountGrantor;

    let logs2 = returned2.logs[0].args;
    let added2 = logs2.adminAdded;
    let grantee2 = logs2.accountGrantee;
    let grantor2 = logs2.accountGrantor;

    assert.equal(added1, true, "There was an error! First admin was not added!");
    assert.equal(grantee1, accounts[1], "There was an error! Account 1 is not the grantee!");
    assert.equal(grantor1, accounts[0], "There was an error! Account 0 is not the grantor!");
    assert.ok(isAuthorized);
    assert.equal(added2, true, "There was an error! Second admin was not added!");
    assert.equal(grantee2, accounts[2], "There was an error! Account 2 is not the grantee!");
    assert.equal(grantor2, accounts[1], "There was an error! Account 1 is not the grantor!");
  });

  it("Should verify if account is already admin", async() => {
    await accountAdminContract.addAdmin(accounts[1], { from: accounts[0] }); //o admin0 tenta adicionar admin1
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena
    let result = await accountAdminContract.addAdmin(accounts[1], { from: accounts[0] });
    let logs = result.logs[0].args;
    let added = logs.adminAdded;
    let grantee = logs.accountGrantee;
    let grantor = logs.accountGrantor;
    assert.equal(added, false, "There was an error! Account was added! ")
    assert.equal(grantee, accounts[1], "There was an error! Account 1 is not the grantee!");
    assert.equal(grantor, accounts[0], "There was an error! Account 0 is not the grantor!");

  });


//-------------------------------------------- QUARENTENA - REMOVE -------------------------------------------------------------------------------

  it("Should not allow removing an admin after having added another admin within 24 hours", async () => {
    let result1 = await accountAdminContract.addAdmin(accounts[2], { from: accounts[0] });
    await time.increase(time.duration.days(1));
    
    let logs1 = result1.logs[0].args;
    let added1 = logs1.adminAdded;
    let grantee1 = logs1.accountGrantee;
    let grantor1 = logs1.accountGrantor;
    let isAuthorized1 = await accountAdminContract.isAuthorized(accounts[2]);

    assert.equal(added1, true,"There was an error! Account was not added!");
    assert.equal(grantee1, accounts[2], "There was an error! Account 2 is not the grantee!");
    assert.equal(grantor1, accounts[0], "There was an error! Account 0 is not the grantor!");
    assert.ok(isAuthorized1);

    let result2 = await accountAdminContract.addAdmin(accounts[1], { from: accounts[0] });
    await time.increase(time.duration.hours(1));

    let logs2 = result2.logs[0].args;
    let added2 = logs2.adminAdded;
    let grantee2 = logs2.accountGrantee;
    let grantor2 = logs2.accountGrantor;
    let isAuthorized2 = await accountAdminContract.isAuthorized(accounts[1]);

    assert.equal(added2, true, "There was an error! Account was not added!");
    assert.equal(grantee2, accounts[1], "There was an error! Account 1 is not the grantee!");
    assert.equal(grantor2, accounts[0], "There was an error! Account 0 is not the grantor!");
    assert.ok(isAuthorized2);

    let result3 = await accountAdminContract.removeAdmin(accounts[2], { from: accounts[0] });

    let logs3 = result3.logs[0].args;
    let removed = logs3.adminRemoved;
    let grantee3 = logs3.accountGrantee;
    let grantor3 = logs3.accountGrantor;
    let isAuthorized3 = await accountAdminContract.isAuthorized(accounts[2]);

    assert.equal(removed, false, "There was an error! Account was removed!");
    assert.equal(grantee3, accounts[2], "There was an error! Account 2 is not the grantee!");
    assert.equal(grantor3, accounts[0], "There was an error! Account 0 is not the grantor!");
    assert.ok(isAuthorized2);
  });

  it("Should not allow removing an admin after having removed another admin within 24 hours", async () => {
    let result1 = await accountAdminContract.addAdmin(accounts[2], { from: accounts[0] });
    await time.increase(time.duration.days(1));

    let result2 = await accountAdminContract.addAdmin(accounts[1], { from: accounts[0] });
    await time.increase(time.duration.days(1));

    let result3 = await accountAdminContract.removeAdmin(accounts[2], { from: accounts[0] });
    let result4 = await accountAdminContract.removeAdmin(accounts[1], { from: accounts[0] });

    let isAuthorized2 = await accountAdminContract.isAuthorized(accounts[2]); //this should be false
    let isAuthorized1 = await accountAdminContract.isAuthorized(accounts[1]); //this should be true

    assert.ok(isAuthorized1);
    assert.notOk(isAuthorized2);

    let logs1 = result1.logs[0].args;
    let added1 = logs1.adminAdded;
    let grantee1 = logs1.accountGrantee;
    let grantor1 = logs1.accountGrantor;

    assert.equal(added1, true,"There was an error! Account was not added!");
    assert.equal(grantee1, accounts[2], "There was an error! Account 2 is not the grantee!");
    assert.equal(grantor1, accounts[0], "There was an error! Account 0 is not the grantor!");

    let logs2 = result2.logs[0].args;
    let added2 = logs2.adminAdded;
    let grantee2 = logs2.accountGrantee;
    let grantor2 = logs2.accountGrantor;

    assert.equal(added2, true, "There was an error! Account was not added!");
    assert.equal(grantee2, accounts[1], "There was an error! Account 1 is not the grantee!");
    assert.equal(grantor2, accounts[0], "There was an error! Account 0 is not the grantor!");

    let logs3 = result3.logs[0].args;
    let removed3 = logs3.adminRemoved;
    let grantee3 = logs3.accountGrantee;
    let grantor3 = logs3.accountGrantor;

    assert.equal(removed3, true, "There was an error! Account was not removed!");
    assert.equal(grantee3, accounts[2], "There was an error! Account 2 is not the grantee!");
    assert.equal(grantor3, accounts[0], "There was an error! Account 0 is not the grantor!");

    let logs4 = result4.logs[0].args;
    let removed4 = logs4.adminRemoved;
    let grantee4 = logs4.accountGrantee;
    let grantor4 = logs4.accountGrantor;

    assert.equal(removed4, false, "There was an error! Account was removed!");
    assert.equal(grantee4, accounts[1], "There was an error! Account 1 is not the grantee!");
    assert.equal(grantor4, accounts[0], "There was an error! Account 0 is not the grantor!");

  });

  it("Should allow removing an admin after having removed another admin after 24 hours", async () => {
    await accountAdminContract.addAdmin(accounts[1], { from: accounts[0] });
    await time.increase(time.duration.days(1));
    await accountAdminContract.addAdmin(accounts[2], { from: accounts[1] });
    await time.increase(time.duration.days(1));
    let returned = await accountAdminContract.removeAdmin(accounts[2], { from: accounts[0] });

    let logs = returned.logs[0].args;
    let grantee = logs.accountGrantee;
    let grantor = logs.accountGrantor;
    let removed = logs.adminRemoved;

    isAuthorized2 = await accountAdminContract.isAuthorized(accounts[2]);
    assert.notOk(isAuthorized2);
    assert.equal(grantee, accounts[2],"There was an error! Account 2 is not the grantee!");
    assert.equal(grantor, accounts[0], "There was an error! Account 0 is not the grantor!");
    assert.equal(removed, true,  "There was an error! Account was not removed!");
  });

//----------------------------------------------------------------- ACABAM AQUI OS TESTES NOVOS --------------------------------------------------------

  it("admin can add multiple admins", async () => {
    await accountAdminContract.addAdmins([accounts[2], accounts[3]], { from: accounts[0] });

    let isAdmin2 = await accountAdminContract.isAuthorized(accounts[2]);
    let isAdmin3 = await accountAdminContract.isAuthorized(accounts[3]);

    assert.ok(isAdmin2);
    assert.ok(isAdmin3);

    //admin shouldn't add again
    isAdmin2 = await accountAdminContract.removeAdmin(accounts[2], {from: accounts[0]});
    isAdmin3 = await accountAdminContract.removeAdmin(accounts[3], {from: accounts[0]});
    try {
      await accountAdminContract.addAdmins([accounts[2], accounts[3]], { from: accounts[0] });
      expect.fail(null, null, "Modifier was not enforced")
    } catch(err) {
      expect(err.reason).to.contain("Batch addresses are only allowed during deploy");
    }


  });

  it("non admin cannot add multiple admins", async () => {
    try {
      await accountAdminContract.addAdmins([accounts[2], accounts[3]], { from: accounts[1] });
      expect.fail(null, null, "Modifier was not enforced")
    } catch(err) {
      expect(err.reason).to.contain('Sender not authorized');
    }
  });


  it("Should emit events when an Admin is added", async () => {
    const ownAddress = accounts[0].toLowerCase();
    const address = accounts[1].toLowerCase();

    // Add a new account
    await accountAdminContract.addAdmin(address);
    let block0 = await web3.eth.getBlock("latest");
    let blockTimestamp0 = block0['timestamp'];

    await time.increase(time.duration.days(1)); // Avança 1 dia

    // Attempt to add a duplicate entry
    await accountAdminContract.addAdmin(address);
    let block1 = await web3.eth.getBlock("latest");
    let blockTimestamp1 = block1['timestamp'];

    await time.increase(time.duration.days(1)); // Avança 1 dia

    // Attempt to add self
    await accountAdminContract.addAdmin(ownAddress);
    let block2 = await web3.eth.getBlock("latest");
    let blockTimestamp2 = block2['timestamp'];

    await time.increase(time.duration.days(1)); // Avança 1 dia

    // Get the events
    let result = await accountAdminContract.getPastEvents("AdminAdded", {fromBlock: 0, toBlock: "latest" });

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
    assert.equal(result[1].returnValues.message, "Account is already an Admin");
    // // Verify the unsuccessful duplicate AccountAdded event has correct message

    // Verify the adding own account AccountAdded event is 'false'
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
    await accountAdminContract.addAdmins([address, address, ownAddress])
    let block = await web3.eth.getBlock("latest");
    let blockTimestamp = block['timestamp'];

    // Get the events
    let result = await accountAdminContract.getPastEvents("AdminAdded", {fromBlock: 0, toBlock: "latest" });

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
    await accountAdminContract.addAdmin(address);
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena

    await accountAdminContract.removeAdmin(address);
    let block0 = await web3.eth.getBlock("latest");
    let blockTimestamp0 = block0['timestamp'];
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena

    await accountAdminContract.removeAdmin(address);
    let block1 = await web3.eth.getBlock("latest");
    let blockTimestamp1 = block1['timestamp'];
    await time.increase(time.duration.days(1)); // Avança 1 dia pra passar a quarentena

    let result = await accountAdminContract.getPastEvents("AdminRemoved", {fromBlock: 0, toBlock: "latest" });

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


//-------------------------------------------------------------TESTES NOVOS-----------------------------------------------------------------------------

    it("Voting system should work properly", async () => {
        //mudar o nome desse teste.
        let isAuthorized, result, address;
        isAuthorized = await adminContract.isAuthorized(accounts[0]);
        result = await nodeIngressContract.setContractAddress(ADMIN, adminContract.address);


        result = await adminContract.addAdmin(accounts[1], {from: accounts[0]})
        await time.increase(time.duration.days(1));
        isAuthorized = await adminContract.isAuthorized(accounts[1]);

        result = await adminContract.addAdmin(accounts[2], {from: accounts[0]})
        await time.increase(time.duration.days(1));
        isAuthorized = await adminContract.isAuthorized(accounts[2]);



        //1 - não pode deixar uma pessoa só mudar o endereço de um contrato
        const CONTRACT_ADDR="0x1111111111111111111111111111111111111111";
        result = await nodeIngressContract.setContractAddress(ADMIN, CONTRACT_ADDR,{from: accounts[0]});
        address = await nodeIngressContract.getContractAddress(ADMIN);
        assert.ok(address != CONTRACT_ADDR);

        //2 - não pode deixar duas pessoas mudarem o endereço de um contrato
        result = await nodeIngressContract.setContractAddress(ADMIN, CONTRACT_ADDR, {from: accounts[1]});
        address = await nodeIngressContract.getContractAddress(ADMIN);
        assert.ok(address != CONTRACT_ADDR);

        //3 - três pessoas juntas podem mudar o endereço de um contrato
        result = await nodeIngressContract.setContractAddress(ADMIN, CONTRACT_ADDR, {from: accounts[2]});
        address = await nodeIngressContract.getContractAddress(ADMIN);
        assert.ok(address == CONTRACT_ADDR);
    });

    it("Proposals should perish in seven days", async () => {
        let isAuthorized, result, address;
        isAuthorized = await adminContract.isAuthorized(accounts[0]);
        result = await nodeIngressContract.setContractAddress(ADMIN, adminContract.address);

        result = await adminContract.addAdmin(accounts[1], {from: accounts[0]})
        await time.increase(time.duration.days(1));
        isAuthorized = await adminContract.isAuthorized(accounts[1]);

        result = await adminContract.addAdmin(accounts[2], {from: accounts[0]})
        await time.increase(time.duration.days(1));
        isAuthorized = await adminContract.isAuthorized(accounts[2]);

        const CONTRACT_ADDR="0x1111111111111111111111111111111111111111";
        result = await nodeIngressContract.setContractAddress(ADMIN, CONTRACT_ADDR,{from: accounts[0]});
        address = await nodeIngressContract.getContractAddress(ADMIN);
        result = await nodeIngressContract.setContractAddress(ADMIN, CONTRACT_ADDR, {from: accounts[1]});
        address = await nodeIngressContract.getContractAddress(ADMIN);
        assert.ok(address != CONTRACT_ADDR);
        //
        await time.increase(time.duration.days(8));
        //Votando em uma eleição que já acabou

        result = await nodeIngressContract.setContractAddress(ADMIN, CONTRACT_ADDR, {from: accounts[0]});
        address = await nodeIngressContract.getContractAddress(ADMIN);
        assert.ok(address != CONTRACT_ADDR);
    });

*/

});
