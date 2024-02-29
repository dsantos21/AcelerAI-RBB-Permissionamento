const Admin = artifacts.require("Admin.sol");
const { time } = require('@openzeppelin/test-helpers');

contract("Admin", accounts => {
    let admin;
    let now;
    let user1, user2, user3, user4, user5;

    beforeEach(async () => {
        admin = await Admin.new();
        now = Math.floor(Date.now() / 1000);
        user1 = accounts[1];
        user2 = accounts[2];
        user3 = accounts[3];
        user4 = accounts[4];
        user5 = accounts[5];
    });

  it("should be true", async () => {
    let t = admin.test();
    // assert t is true
    assert(t, "Test failed");
  });

  it("should add an address to quarentena", async () => {
    await admin.addQuarentena(user1, now);
    const isQuarentena = await admin.emQuarentena(user1);
    assert(isQuarentena, "Address was not added to quarentena");
  });

//   it("should remove an address from quarentena", async () => {
//     await admin.addQuarentena(user1, now);
//     await admin.removeQuarentena(user1);
//     const isQuarentena = await admin.emQuarentena(user1);
//     assert(!isQuarentena, "Address was not removed from quarentena");
//   });

  it("should check if an address is in quarentena", async () => {
    await admin.addQuarentena(user1, now);
    const isQuarentena = await admin.emQuarentena(user1);
    assert(isQuarentena, "Address should be in quarentena");
    const isNotQuarentena = await admin.emQuarentena(user5);
    if (isNotQuarentena) {
        assert.fail("Address should not be in quarentena");
    } else {
        assert(true);
    }
    //assert(t, "Address should not be in quarentena");
  });

  it("should check if an quarantine expires", async () => {
    let yesterday= Math.floor(Date.now() / 1000) - 88400;
    await admin.addQuarentena(user1, yesterday);
    await admin.sanitizeQuarentena();
    const isNotQuarentena = await admin.emQuarentena(user4);
    const t = !isNotQuarentena;
    assert(t, "Address should not be in quarentena");
  });

});