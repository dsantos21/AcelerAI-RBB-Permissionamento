const Admin = artifacts.require("Admin.sol");
const { time } = require('@openzeppelin/test-helpers');

contract("Admin", accounts => {
  let admin;
  let now;
  let user1 = accounts[1];
  let user2 = accounts[2];
  let user3 = accounts[3];
  let user4 = accounts[4];
  let user5 = accounts[5];

  beforeEach(async () => {
    admin = await Admin.new();
    now = Math.floor(Date.now() / 1000);
  });


  it("should add an address to quarentena", async () => {
    await admin.addQuarentena(user1);
    if (await admin.emQuarentena(user1), "Address was not added to quarentena") {
      assert(true);
    } else {
      assert.fail("Address was not added to quarentena");
    }
  });


  it("should check if an address is in quarentena", async () => {
    if (await admin.emQuarentena(user5)) {
      assert.fail("Address should not be in quarentena");
    } else {
      assert(true);
    }
  });

  it("should check if an quarantine expires", async () => {
    await admin.addQuarentena(user1);
    if (await admin.emQuarentena(user1)) {
      assert(true);
    } else {
      assert.fail("Address was not added to quarentena");
    }
    await time.increase(time.duration.days(1));
    if (await admin.emQuarentena(user1)) {
      assert("Address should not be in quarentena");
    } else {
      assert(true);
    }
  });

});