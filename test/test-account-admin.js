const AccountAdmin = artifacts.require('AccountAdmin.sol');
const { time } = require('@openzeppelin/test-helpers');

contract("AccountAdmin (admin management)", async accounts => {

  let accountAdminContract;

  const NUMBER_OF_DAYS = 2;

  async function passDays(){
    await time.increase(time.duration.days(NUMBER_OF_DAYS));
  }

  async function voteThreeTimes(operation, acc1, acc2, acc3){
    //vota três vezes no accounts[0] para ser superAdmin ou removê-lo
    if (operation == 1){
      await accountAdminContract.voteForSuperAdmin(accounts[0], {from:acc1});
      await accountAdminContract.voteForSuperAdmin(accounts[0], {from:acc2});
      await accountAdminContract.voteForSuperAdmin(accounts[0], {from:acc3});
    } else {
      await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:acc1});
      await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:acc2});
      await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:acc3});
    }

  }

  beforeEach(async () => {
    accountAdminContract = await AccountAdmin.new();
    await accountAdminContract.addAdmin(accounts[1], {from: accounts[0]});
    await passDays();
    await accountAdminContract.addAdmin(accounts[2], {from: accounts[0]});
    await passDays();
    await accountAdminContract.addAdmin(accounts[3], {from: accounts[0]});
    await passDays();
    await accountAdminContract.addAdmin(accounts[4], {from: accounts[0]});
    await passDays();
    await accountAdminContract.setQuorumType(1, {from:accounts[0]});

    await accountAdminContract.resignSuperAdmin({from:accounts[0]});
    //coloca o quorum type para majority, para que os testes possam ser feitos
  })

  it("Should verify if votes stack", async () => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    let votesForAccount0Before = await accountAdminContract.votesFor(accounts[0]);
    let number_of_votes_before = parseInt(votesForAccount0Before.count);
    // console.log("Before: " + number_of_votes_before + " votes for account 0");


    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});
    let votesForAccount0After = await accountAdminContract.votesFor(accounts[0]);
    let number_of_votes_after = parseInt(votesForAccount0After.count);
    // console.log("After: " + number_of_votes_after + " votes for account 0");
    //
    // console.log("number_of_votes_before + 1: " + (number_of_votes_before + 1));

    assert.ok((number_of_votes_before + 1) == number_of_votes_after);

  });


  it ("Votes should reset after election", async () => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    let admin_before = await accountAdminContract.isSuperAdmin(accounts[0]);

    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[2]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[3]});

    let votesForAccount0 = await accountAdminContract.votesFor(accounts[0]);
    let number_of_votes_after = votesForAccount0.count;
    let admin_after = await accountAdminContract.isSuperAdmin(accounts[0]);

    // console.log("After: " + number_of_votes_after + " votes for account 0");
    assert.ok(parseInt(number_of_votes_after) === 0);
    assert.ok(admin_before === false);
    assert.ok(admin_after === true);
  });

  it("Should stop user voting twice", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    try {
      await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
      expect.fail(null, null, "User voted twice.");
    } catch(err) {
      expect(err.reason).to.contain("You've already voted for this proposal.");
    }
  });

  it ("Should not permit non-admin be promoted to Super Admin", async() => {
    try{
      await accountAdminContract.voteForSuperAdmin(accounts[5], {from:accounts[1]});
      expect.fail(null, null, "Non admin could be voted for Super Admin");
    } catch(err) {
      expect(err.reason).to.contain("This address is not an admin, so cannot be a super admin.");
    }

  });

  it ("Should not be possible voting to remove an address that isn't a Super Admin", async() => {
    try{
      await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from: accounts[1]});
      expect.fail(null, null, "Could vote to remove someone that is not a Super Admin");
    } catch(err){
      expect(err.reason).to.contain("There is no a super admin to be removed.");
    }
  });

  it ("Should be possible to revert a vote", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from: accounts[1]});
    let votesForAcc0 = await accountAdminContract.votesFor(accounts[0]);
    let num_bef = votesForAcc0.count;

    await accountAdminContract.revertVoteForSuperAdmin(accounts[0], {from: accounts[1]});
    votesForAcc0 = await accountAdminContract.votesFor(accounts[0]);
    let num_aft = votesForAcc0.count;

    assert.ok(num_bef == 1);
    assert.ok(num_aft == 0);

  });

  it("Should not be possible to revert a vote if voter didn't vote for that address", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[2], {from: accounts[0]});
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    try {
      await accountAdminContract.revertVoteForSuperAdmin(accounts[2], {from: accounts[1]});
      expect.fail(null, null, "Could revert vote even if user didn't vote for that proposal.");
    } catch(err){
      expect(err.reason).to.contain("You do not have a active vote for this proposal.");
    }
  });

  it("Should not be possible to revert a vote for an address that is not a Super Admin", async() => {
    await accountAdminContract.voteForSuperAdmin(accounts[0], {from:accounts[1]});
    try {
      await accountAdminContract.revertVoteForSuperAdmin(accounts[5], {from: accounts[1]});
      expect.fail(null, null, "Could revert vote for not admin address.");
    }catch(err){
      expect(err.reason).to.contain("This address is not an admin, so it was not voted.");
    }
  });

  it("Should not be possible to revert a vote if there is no election happening", async() => {
    try {
      await accountAdminContract.revertVoteForSuperAdmin(accounts[0], {from: accounts[1]});
      expect.fail(null, null, "Could revert vote even if there was no election happening.");
    } catch(err){
      expect(err.reason).to.contain("There is no current voting process.");
    }
  });

  it("Should remove SuperAdmin after voting process", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);
    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await voteThreeTimes(2, accounts[1], accounts[2], accounts[3]);

    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);

  });

  it("Should be possible for SuperAdmin to resign", async() =>{
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.resignSuperAdmin({from:accounts[0]});
    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);
  });

  it("Should be possible for SuperAdmin to add many admins", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    let array = [accounts[5], accounts[6], accounts[7]];

    await accountAdminContract.addAdmins(array, {from: accounts[0]});
    assert.ok(accountAdminContract.isQuarantined(accounts[5]));
    assert.ok(accountAdminContract.isQuarantined(accounts[6]));
    assert.ok(accountAdminContract.isQuarantined(accounts[7]));
  });

  it("SuperAdmin should be able to change quarantine time", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.setQuarantine(86400, {from: accounts[0]});
  });

  it("Setting quarantine time to illegal values should be impossible", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);
    try{
      await accountAdminContract.setQuarantine(0, {from: accounts[0]});
      expect.fail(null, null, "Could set quarantine to 0 days.");
    } catch(err) {
      expect(err.reason).to.contain("Quarantine duration must be at least 1 day.");
    }

  });


  it ("SuperAdmin should be able to change quorum type", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.setQuorumType(0, {from:accounts[0]});
    await accountAdminContract.setQuorumType(1, {from:accounts[0]});
    await accountAdminContract.setQuorumType(2, {from:accounts[0]});
    await accountAdminContract.setQuorumType(3, {from:accounts[0]});
  });


  it ("Quorum type = fixed should not be set to illegal values", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

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


  it ("SuperAdmin should be able to change vote duration", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.setVoteDuration(86400, {from: accounts[0]});
  });
//verificar se a duração da eleição pode ser setada para 1

  it("Election time interval should not be set to illegal values", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);
    try{
      await accountAdminContract.setVoteDuration(0, {from: accounts[0]});
      expect.fail(null, null, "Could set vote duration to zero");
    }catch(err){
      expect(err.reason).to.contain("Vote duration must be at least 1 day.");
    }

  });

  it("Quorum type: majority should be respected", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);


    await accountAdminContract.setQuorumType(0, {from: accounts[0]});
    await voteThreeTimes(2, accounts[1], accounts[2], accounts[3]);
    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);
  });

  it("Quorum type: two thirds should be respected", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == true);

    await accountAdminContract.setQuorumType(1, {from: accounts[0]});
    await accountAdminContract.addAdmin(accounts[5], {from:accounts[0]});

    await voteThreeTimes(2, accounts[1], accounts[2], accounts[3]);
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[4]});
    
    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);
  });

  it("Quorum type: two thids plus one should be respected", async() =>{
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    await accountAdminContract.addAdmins([accounts[5], accounts[6]], {from:accounts[0]});
    await accountAdminContract.setQuorumType(2, {from:accounts[0]});

    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[1]});
    await accountAdminContract.voteForRemovingSuperAdmin(accounts[0], {from:accounts[2]});

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result === true);

    await voteThreeTimes(2, accounts[3], accounts[4], accounts[5]);

    //accounts[0] e accounts[6] não votam

    result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result === false);
  });

  it("Quorum type: fixed should be respected", async() => {
    await voteThreeTimes(1, accounts[1], accounts[2], accounts[3]);

    await accountAdminContract.setQuorumType(3, {from:accounts[0]});
    await accountAdminContract.setFixedQuorumNumber(3, {from: accounts[0]});

    await voteThreeTimes(2, accounts[1], accounts[2], accounts[3]);

    let result = await accountAdminContract.isSuperAdmin(accounts[0]);
    assert.ok(result == false);
  });

  it("Admin that has just added another should be quarantined", async() => {
    await accountAdminContract.addAdmin(accounts[5], {from:accounts[1]});
    try {
      await accountAdminContract.addAdmin(accounts[6], {from:accounts[1]});
      expect.fail(null, null, "Could ignore quarantine time.");
    } catch(err){
      expect(err.reason).to.contain("Admin is still in quarantine.");
    }

    try{
      await accountAdminContract.addAdmin(accounts[7], {from:accounts[5]});
      expect.fail(null, null, "Added admin could ignore quarantine time.");
    } catch(err){
      expect(err.reason).to.contain("Admin is still in quarantine.");
    }

  });

  it("Admin that has just removed another should be quarantined", async() => {
    await accountAdminContract.addAdmin(accounts[5], {from:accounts[1]});
    try {
      await accountAdminContract.removeAdmin(accounts[4], {from:accounts[1]});
      expect.fail(null, null, "Could ignore quarantine time.");
    } catch(err){
      expect(err.reason).to.contain("Admin is still in quarantine.");
    }

    try{
      await accountAdminContract.removeAdmin(accounts[1], {from:accounts[3]});
      expect.fail(null, null, "Added admin could ignore quarantine time.");
    } catch(err){
      expect(err.reason).to.contain("Admin is still in quarantine.");
    }


  });

});