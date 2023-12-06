const AccountAdmin = artifacts.require('AccountAdmin.sol');
const { time } = require('@openzeppelin/test-helpers');
const {asyncCycle} = require("truffle/build/439.bundled");

contract("AccountAdmin (admin management)", async accounts => {

  let accountAdminContract;

  beforeEach(async () => {
    accountAdminContract = await AccountAdmin.new();
    await accountAdminContract.addAdmin(accounts[1], {from: accounts[0]});
    await accountAdminContract.addAdmin(accounts[2], {from: accounts[0]});
    await accountAdminContract.resignSuperAdmin({from:accounts[0]});
  })

  it("Should verify if votes stack", async () => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    let result = await accountAdminContract.votesFor(accounts[0]);
    let number_of_votes_before = result.count.words[0];

    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});
    result = await accountAdminContract.votesFor(accounts[0]);
    let number_of_votes_after = result.count.words[0];

    assert.ok(number_of_votes_before !== number_of_votes_after);

  });

  it ("Should verify if votes reset after election", async () => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    let admin_before = await accountAdminContract.isSuperAdmin(accounts[0]);

    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});
    let result = await accountAdminContract.votesFor(accounts[0]);
    let number_of_votes_after = result.count.words[0];
    let admin_after = await accountAdminContract.isSuperAdmin(accounts[0]);

    assert.ok(number_of_votes_after === 0);
    assert.ok(admin_before === false);
    assert.ok(admin_after === true);
  });

  it("Should verify if user can vote twice", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    try {
      await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
      expect.fail(null, null, "User voted twice.");
    } catch(err) {
      expect(err.reason).to.contain("You've already voted for this proposal.");
    }
  });

  it ("Should verify if someone can vote for non-admin to be a Super Admin", async() => {
    try{
      await accountAdminContract.voteForSuperAdmin(accounts[3], {from:accounts[1]});
      expect.fail(null, null, "Non admin could be voted for Super Admin");
    } catch(err) {
      expect(err.reason).to.contain("This address is not an admin, so cannot be a super admin.");
    }

  });

  it ("Should verify if it is possible voting to remove an address that isn't a Super Admin", async() => {
    try{
      await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from: accounts[1]});
      expect.fail(null, null, "Could vote to remove someone that is not a Super Admin");
    } catch(err){
      expect(err.reason).to.contain("There is no a super admin to be removed.");
    }
  });

  it ("Should verify if it is possible to revert a vote", async() => {
      await accountAdminContract.voteForSuperAdmin(accounts[0], {from: accounts[1]});
      let bef = await accountAdminContract.votesFor(accounts[0]);
      let num_bef = bef.count.words[0];

      await accountAdminContract.revertVoteForSuperAdmin(accounts[0], {from: accounts[1]});
      let a = await accountAdminContract.votesFor(accounts[0]);
      let num_aft = a.count.words[0];

      assert.ok(num_bef == 1);
      assert.ok(num_aft == 0);

  });

  it("Should verify if it is possible to revert a vote if voter didn't vote for that address", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[2], {from: accounts[0]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    try {
      await accountAdminContract.revertVoteForSuperAdmin(accounts[2], {from: accounts[1]});
      expect.fail(null, null, "Could revert vote even if user didn't vote for that proposal.");
    } catch(err){
      expect(err.reason).to.contain("You do not have a active vote for this proposal.");
    }
  });

  it("Should verify if it is possible to revert a vote for an address that is not a Super Admin", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    try {
      await accountAdminContract.revertVoteForSuperAdmin(accounts[3], {from: accounts[1]});
      expect.fail(null, null, "Could revert vote for not admin address.");
    }catch(err){
      expect(err.reason).to.contain("This address is not an admin, so it was not voted.");
    }
  });

  it("Should verify if it is possible to revert a vote if there is no election happening", async() => {
    try {
      await accountAdminContract.revertVoteForSuperAdmin(accounts[0], {from: accounts[1]});
      expect.fail(null, null, "Could revert vote even if there was no election happening.");
    } catch(err){
      expect(err.reason).to.contain("There is no current voting process.");
    }
  });

  it("Should verify if, after voting process, SuperAdmin is removed", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from: accounts[1]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from: accounts[2]});

    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);

  });

  it("Should verify if SuperAdmin can resign", async() =>{
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.resignSuperAdmin({from:accounts[0]});
    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);
  });

  it("Should verify if SuperAdmin can add many admins", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    let array = [accounts[3], accounts[4], accounts[5]];

    await accountAdminContract.addAdmins(array, {from: accounts[0]});
    assert.ok(accountAdminContract.isQuarantined(accounts[3]));
    assert.ok(accountAdminContract.isQuarantined(accounts[4]));
    assert.ok(accountAdminContract.isQuarantined(accounts[5]));
  });

  it("Should verify if SuperAdmin can change quarantine time", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.setQuarantine(86400, {from: accounts[0]});
  });

  it("Should verify if quarantine time can be set to illegal values", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);
    try{
      await accountAdminContract.setQuarantine(0, {from: accounts[0]});
      expect.fail(null, null, "Could set quarantine to 0 days.");
    } catch(err) {
      expect(err.reason).to.contain("Quarantine duration must be at least 1 day.");
    }

  });


  it ("Should verify if SuperAdmin can change quorum type", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.setQuorumType(0, {from:accounts[0]});
    await accountAdminContract.setQuorumType(1, {from:accounts[0]});
    await accountAdminContract.setQuorumType(2, {from:accounts[0]});
    await accountAdminContract.setQuorumType(3, {from:accounts[0]});
  });


  it ("Should verify if quorum type = fixed can be set to illegal values", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.setQuorumType(3, {from:accounts[0]});

    try{
      await accountAdminContract.setFixedQuorumNumber(0, {from: accounts[0]});
      expect.fail(null, null, "Could set quorum to 0 votes.");
    } catch(err){
      expect(err.reason).to.contain("Quorum must be greater than zero.");
    }

    let length = await accountAdminContract.getAdmins();
    length = length.length;

    try{
      await accountAdminContract.setFixedQuorumNumber(length+1, {from: accounts[0]});
      expect.fail(null, null, "Could set quorum to a number greater than admin size.");
    } catch(err){
      expect(err.reason).to.contain("Quorum must be less than or equal to the number of admins.");
    }

  });


  it ("Should verify if SuperAdmin can change vote duration", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.setVoteDuration(86400, {from: accounts[0]});
  });
//verificar se a duração da eleição pode ser setada para 1

  it("Should verify if election time interval can be set to illegal values", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);
    try{
      await accountAdminContract.setVoteDuration(0, {from: accounts[0]});
      expect.fail(null, null, "Could set vote duration to zero");
    }catch(err){
      expect(err.reason).to.contain("Vote duration must be at least 1 day.");
    }

  });

  it("Should verify if quorum type: majority is respected", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from: accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from: accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);


    await accountAdminContract.setQuorumType(0, {from: accounts[0]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from: accounts[1]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from: accounts[2]});
    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);
  });

  it("Should verify if quorum type: two thirds is respected", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from: accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from: accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.setQuorumType(1, {from: accounts[0]});
    await accountAdminContract.addAdmins([accounts[3], accounts[4]], {from:accounts[0]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from: accounts[1]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from: accounts[2]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[3]});
    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);
  });

  it("Should verify if quorum type: two thids plus one is respected", async() =>{
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});
    await accountAdminContract.addAdmins([accounts[3], accounts[4], accounts[5], accounts[6]], {from:accounts[0]});
    await accountAdminContract.setQuorumType(2, {from:accounts[0]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[2]});
    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[3]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[4]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[5]});

    //accounts[0] e accounts[6] não votam

    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);
  });

  it("Should verify if quorum type: fixed is respected", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});
    await accountAdminContract.addAdmins([accounts[3], accounts[4]], {from:accounts[0]});
    await accountAdminContract.setQuorumType(3, {from:accounts[0]});
    await accountAdminContract.setFixedQuorumNumber(3, {from: accounts[0]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[2]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[3]});
    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);
  });
  
});
