const AccountAdmin = artifacts.require('AccountAdmin.sol');
const { time } = require('@openzeppelin/test-helpers');

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
                                      /* VERIFICAR ESSE AQUI EMBAIXO */
  // it("Should verify if it is possible voting to 0x000...00 address", async() => {
  //   try {
  //     await accountAdminContract.voteForSuperAdmin("0x0000000000000000000000000000000000000000", {from: accounts[0]});
  //   } catch (err){
  //     console.log(err);
  //   }
  // });

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
  })

});
