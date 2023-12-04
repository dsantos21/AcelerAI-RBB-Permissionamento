const AccountIngressContract = artifacts.require("AccountIngress.sol");
const AccountAdminContract = artifacts.require("AccountAdmin.sol");
const AccountRulesContract = artifacts.require("AccountRules.sol");

const RULES="0x72756c6573000000000000000000000000000000000000000000000000000000";
const ADMIN="0x61646d696e697374726174696f6e000000000000000000000000000000000000";

const address = "0x345ca3e014aaf5dca488057592ee47305d9b3e10".toLowerCase();

contract ("Account Ingress (no contracts registered)", (accounts) => {
    let accountIngressContract;
    let accountAdminContract;

    beforeEach("create a new contract for each test", async () => {
        accountIngressContract = await AccountIngressContract.new();
        accountAdminContract = await AccountAdminContract.new();
        accountRulesContract = await AccountRulesContract.new(accountIngressContract.address);
    })

    it("should allow any account if rules contract has not been registered", async () => {
        result = await accountIngressContract.getContractAddress(RULES);
        assert.equal(result, "0x0000000000000000000000000000000000000000", "Rules contract should NOT be registered");

        let permitted = await accountIngressContract.transactionAllowed(
            address,
            address,
            0,
            0,
            0,
            "0x00"
        );
        assert.equal(permitted, true, "expected transactionAllowed to return true when rules contract hasn't been set");
    });

    it("should return a logical version number", async () => {
        let version = await accountIngressContract.getContractVersion();
        assert(version >= 1000000, "Version is larger than 1");
        assert(version <= 999999999999, "Version is less than max");
    });

    it("should reject any attempts to emit events not from the rules contract", async () => {
        try {
          await accountIngressContract.emitRulesChangeEvent(true);
          assert.fail("emitRulesChange should deny non rules contract callers")
        } catch (err) {
          assert.ok("emitRulesChange rejects callers that aren't the rules contract")
        }
    });

    it("should allow the admin contract to be set", async () => {
        let result = await accountIngressContract.setContractAddress(ADMIN, accountAdminContract.address);
        assert.ok(result.receipt.status, "setContractAddress should succeed");
    });

    it("should allow the admin contract to be retrieved", async () => {
        await accountIngressContract.setContractAddress(ADMIN, accountAdminContract.address);
        let result = await accountIngressContract.getContractAddress(ADMIN);
        assert.equal(result, accountAdminContract.address, "Admin contract should be registered");
    });

    it("should allow the rules contract to be set", async () => {
        let result = await accountIngressContract.setContractAddress(RULES, accountRulesContract.address);
        assert.ok(result.receipt.status, "setContractAddress should succeed");
    });

    it("should allow the rules contract to be retrieved", async () => {
        await accountIngressContract.setContractAddress(RULES, accountRulesContract.address);
        let result = await accountIngressContract.getContractAddress(RULES);
        assert.equal(result, accountRulesContract.address, "Rules contract should be registered");
    });

    it("should forbid a resigned superadmin to change rules", async() => {
        await accountIngressContract.setContractAddress(RULES, accountRulesContract.address);
        await accountIngressContract.setContractAddress(ADMIN, accountAdminContract.address);
        await accountAdminContract.resignSuperAdmin();
        try {
            await accountIngressContract.setContractAddress(RULES, accountRulesContract.address);
            assert.fail("setContractAddress should deny non superadmin callers")
        } catch (err) {
            assert.ok("setContractAddress rejects callers that aren't superadmins")
        }
    });

    it("should forbid a resigned superadmin to change admin", async() => {
        await accountIngressContract.setContractAddress(RULES, accountRulesContract.address);
        await accountIngressContract.setContractAddress(ADMIN, accountAdminContract.address);
        await accountAdminContract.resignSuperAdmin();
        try {
            await accountIngressContract.setContractAddress(ADMIN, accountAdminContract.address);
            assert.fail("setContractAddress should deny non superadmin callers")
        } catch (err) {
            assert.ok("setContractAddress rejects callers that aren't superadmins")
        }
    });

});