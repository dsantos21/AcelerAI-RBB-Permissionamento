const AdminContract = artifacts.require('Admin.sol');
const RulesContract = artifacts.require('AccountRules.sol');
const IngressContract = artifacts.require('Ingress.sol');
const Web3 = require('web3');
const web3 = new Web3();

// Contract keys
const RULES_NAME = "0x72756c6573000000000000000000000000000000000000000000000000000000";
const ADMIN_NAME = "0x61646d696e697374726174696f6e000000000000000000000000000000000000";

contract("Contract permissioning", accounts => {
    let rules, ingress;
    let contractAddr = web3.utils.randomHex(20);
    let contractAdmin1 = accounts[1];
    let contractAdmin2 = accounts[2];

    beforeEach(async () => {
        ingress = await IngressContract.new();

        admin = await AdminContract.new();
        await ingress.setContractAddress(ADMIN_NAME, admin.address);
    
        rules = await RulesContract.new(ingress.address);
        await ingress.setContractAddress(RULES_NAME, rules.address);
    });

    it("should return true from isBlocked if the account is blocked", async () => {
        await rules.blockContract(contractAddr, { from: accounts[0] });
        assert.equal(await rules.isBlocked(contractAddr), true);
    });

    it("should return false from isBlocked if the account is not blocked", async () => {
        assert.equal(await rules.isBlocked(contractAddr), false);
    });

    it("should return false when a target (contract) is unblocked after being blocked", async () => {
        await rules.blockContract(contractAddr, { from: accounts[0] });
        await rules.unblockContract(contractAddr, { from: accounts[0] });
        assert.equal(await rules.isBlocked(contractAddr), false);
    });

    it("should return false from isContractAdmin if the account is not an admin", async () => {
        await rules.blockContract(contractAddr, { from: accounts[0] });
        assert.equal(await rules.isContractAdmin(contractAddr, contractAdmin1), false);
    });

    it("should return true from isContractAdmin if the account is an admin", async () => {
        await rules.blockContract(contractAddr, { from: accounts[0] });
        // It needs to be permitted
        await rules.addAccount(contractAdmin1, { from: accounts[0] });
        await rules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        assert.equal(await rules.isContractAdmin(contractAddr, contractAdmin1), true);
    });

    it("should assure that only admins can block a contract", async () => {
        let hasThrown = false;
        try {
            await rules.blockContract(contractAddr, { from: accounts[1] });
        }
        catch (error) {
            hasThrown = true; // Set the flag to true if an error is thrown
        }
        if (!hasThrown) {
            assert.fail("It should have failed because the sender is not an admin");
        }
    });

    it("should assure that only admins can unblock a contract", async () => {
        let hasThrown = false;
        try {
            await rules.blockContract(contractAddr, { from: accounts[0] });
            await rules.unblockContract(contractAddr, { from: accounts[1] });
        }
        catch (error) {
            hasThrown = true; // Set the flag to true if an error is thrown
        }
        if (!hasThrown) {
            assert.fail("It should have failed because the sender is not an admin");
        }
    });

    it("should assure that only admins can add a contract admin", async () => {
        let hasThrown = false;
        try {
            await rules.blockContract(contractAddr, { from: accounts[0] });
            await rules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[1] });
        }
        catch (error) {
            hasThrown = true; // Set the flag to true if an error is thrown
        }
        if (!hasThrown) {
            assert.fail("It should have failed because the sender is not an admin");
        }
    });

    it("should return false from isContractAdmin if the account was removed from admin", async () => {
        // block contract
        await rules.blockContract(contractAddr, { from: accounts[0] });        
        // It needs to be permited
        await rules.addAccount(contractAdmin1, { from: accounts[0] });
        await rules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        await rules.removeContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        assert.equal(await rules.isContractAdmin(contractAddr, contractAdmin1), false);
    });

    it ("should not allow removing a contract admin if the address is not an admin", async () => {
        let hasThrown = false;
        try {
            await rules.blockContract(contractAddr, { from: accounts[0] });
            await rules.removeContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        }
        catch (error) {
            hasThrown = true; // Set the flag to true if an error is thrown
        }
        if (!hasThrown) {
            assert.fail("It should have failed because the address is not an admin");
        }
    });

    it("should not allow adding a contract admin if the contract is not blocked", async () => {
        let hasThrown = false;
        try {
            await rules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        }
        catch (error) {
            hasThrown = true; // Set the flag to true if an error is thrown
        }
        if (!hasThrown) {
            assert.fail("It should have failed because the contract is not blocked");
        }
    });

    it('should allow transaction if target is not blocked', async () => {
        // It is a fresh call, so there is no previously blocked contract.
        // accounts[0] was permited in the constructor
        const result = await rules.transactionAllowed(accounts[0], contractAddr, 0, 0, 0, '0x');
        expect(result).to.equal(true);
    });

    it('should return false if target (contract) is blocked and sender is not an admin', async () => {
        // Block contract
        await rules.blockContract(contractAddr, { from: accounts[0] });
        // There was no admin added, so sender is not an admin.
        // accounts[0] is permited in the constructor
        const result = await rules.transactionAllowed(accounts[0], contractAddr, 0, 0, 0, '0x');
        expect(result).to.equal(false);
    });

    it('should return true if target (contract) is blocked but sender is an admin', async () => {
        // Block contract
        await rules.blockContract(contractAddr, { from: accounts[0] });
        // Sender needs to be permited
        await rules.addAccount(contractAdmin1, { from: accounts[0] });
        // Add admin
        await rules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        // Sender is an admin.
        const result = await rules.transactionAllowed(contractAdmin1, contractAddr, 0, 0, 0, '0x');
        expect(result).to.equal(true);
    });

    it("should not allow adding a contract admin if the address is not permited", async () => {
        let hasThrown = false;
        try {
            await rules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        }
        catch (error) {
            hasThrown = true; // Set the flag to true if an error is thrown
        }
        if (!hasThrown) {
            assert.fail("It should have failed because the address is not permited");
        }
    });

    if("should not allow a transaction if the sender is not permited, even if is an admin of the contract", async () => {
        // Block contract
        await rules.blockContract(contractAddr, { from: accounts[0] });
        // Permit the address
        await rules.addAccount(contractAdmin1, { from: accounts[0] });
        // Add admin
        await rules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        // Remove permission
        await rules.removeAccount(contractAdmin1, { from: accounts[0] });
        // Sender is an admin, but not permited.
        const result = await rules.transactionAllowed(contractAdmin1, contractAddr, 0, 0, 0, '0x');

        expect(result).to.equal(false);
    });
});

