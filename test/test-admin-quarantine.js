const Admin = artifacts.require("Admin.sol");
const { time } = require('@openzeppelin/test-helpers');

contract("Admin", accounts => {
    let admin;

    beforeEach(async () => {
        admin = await Admin.new();
    });

    it("should add an admin and, after passing the quarantine time, be able to add another admin", async () => {
        await admin.addAdmin(accounts[1], { from: accounts[0] });
        await time.increase(time.duration.days(1));
        await admin.addAdmin(accounts[2], { from: accounts[0] });
        // Check whether both accounts are admins.
        assert.equal(await admin.isAuthorized(accounts[1]), true);
        assert.equal(await admin.isAuthorized(accounts[2]), true);
    });

    it("should add an admin and, after passing the quarantine time, be able to remove the added admin", async () => {
        await admin.addAdmin(accounts[1], { from: accounts[0] });
        await time.increase(time.duration.days(1));
        await admin.removeAdmin(accounts[1], { from: accounts[0] });
        // Check whether the added account is not an admin anymore.
        assert.equal(await admin.isAuthorized(accounts[1]), false);
    });

    it("should add an admin and put the caller in quarantine", async () => {
        await admin.addAdmin(accounts[1], { from: accounts[0] });
        try {
            await admin.addAdmin(accounts[2], { from: accounts[0] });
            assert.fail("The admin added another admin, so it should be in quarantine");
        } catch (error) {
            const revertFound = error.message.search('revert') >= 0;
            assert(revertFound, `It got an exception, but not as expected. It got this instead: ${error}`);
        }
    });

    it("should add an admin and put the added admin in quarantine", async () => {
        await admin.addAdmin(accounts[1], { from: accounts[0] });
        try {
            await admin.addAdmin(accounts[2], { from: accounts[1] });
            assert.fail("The newly added admin should be in quarantine");
        } catch (error) {
            const revertFound = error.message.search('revert') >= 0;
            assert(revertFound, `It got an exception, but not as expected. It got this instead: ${error}`);
        }
    });


    it("should remove an admin and put the caller in quarantine", async () => {
        await admin.addAdmin(accounts[1], { from: accounts[0] });

        // Advance time by one day.
        await time.increase(time.duration.days(1));

        await admin.removeAdmin(accounts[1], { from: accounts[0] });

        try {
            await admin.addAdmin(accounts[2], { from: accounts[0] });
            assert.fail("The admin removed another admin, so it should be in quarantine");
        } catch (error) {
            const revertFound = error.message.search('revert') >= 0;
            assert(revertFound, `It got an exception, but not as expected. It got this instead: ${error}`);
        }
    });

});