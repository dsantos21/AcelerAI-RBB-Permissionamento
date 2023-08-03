const NodeIngressContract = artifacts.require("NodeIngress.sol");
const NodeRulesContract = artifacts.require("NodeRules.sol");
const AdminContract = artifacts.require("Admin.sol");

const RULES="0x72756c6573000000000000000000000000000000000000000000000000000000";
const ADMIN="0x61646d696e697374726174696f6e000000000000000000000000000000000000";

const node1High = "0x9bd359fdc3a2ed5df436c3d8914b1532740128929892092b7fcb320c1b62f375";
const node1Low = "0x892092b7fcb320c1b62f3759bd359fdc3a2ed5df436c3d8914b1532740128929";
const node1Host = "0x0000000000000000000011119bd359fd";
const node1Port = 30303;
const node1Type = 0; // 0: Boot, 1: Validator, 2: Writer, 3: WriterPartner, 4: ObserverBoot, 5: Other
const node1GeoHash = "0x000000000000";
const node1Name = "node1";
const node1Organization = "organization1";

const node2High = "0x892092b7fcb320c1b62f3759bd359fdc3a2ed5df436c3d8914b1532740128929";
const node2Low = "0xcb320c1b62f37892092b7f59bd359fdc3a2ed5df436c3d8914b1532740128929";
const node2Host = "0x0000000000000000000011119bd359fd";
const node2Port = 30304;

const address2 = "0x345ca3e014aaf5dca488057592ee47305d9b3e10".toLowerCase();
const { time } = require('@openzeppelin/test-helpers');
contract ("Node Ingress (no contracts registered)", (accounts) => {
    let nodeIngressContract;
    let nodeRulesContract;
    let adminContract;

    beforeEach("create a new contract for each test", async () => {
        nodeIngressContract = await NodeIngressContract.new();
        adminContract = await AdminContract.new();
        nodeRulesContract = await NodeRulesContract.new(nodeIngressContract.address);
    })

    it("should allow any connection if rules contract has not been registered", async () => {
        result = await nodeIngressContract.getContractAddress(RULES);
        assert.equal(result, "0x0000000000000000000000000000000000000000", "NodeRules contract should NOT be registered");

        let permitted = await nodeIngressContract.connectionAllowed(node1High, node1Low, node1Host, node1Port, node2High, node2Low, node2Host, node2Port);
        assert.equal(permitted, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", "expected connectionAllowed to return true");
    });

    it("Should return empty value if NodeRules contract has not been registered", async () => {
        let result = await nodeIngressContract.getContractAddress(RULES);
        assert.equal(result, "0x0000000000000000000000000000000000000000", "NodeRules contract should NOT already be registered");
    });

    it("Should return empty value if Admin contract has not been registered", async () => {
        let result = await nodeIngressContract.getContractAddress(ADMIN);
        assert.equal(result, "0x0000000000000000000000000000000000000000", "Admin contract should NOT already be registered");
    });
    
    it("Should not register zero address contract", async () => {

        // Attempt to register zero address contract
        try {
            await nodeIngressContract.setContractAddress(RULES, "0x0000000000000000000000000000000000000000");
            assert.fail("Should not allow address(0) Contract in registry");
        } catch (err) {
            expect(err.reason).to.contain("Contract address must not be zero");
        }
    });

    it("Should register contract successfully", async () => {
        // Verify that the NodeRules contract has not yet been registered
        let result = await nodeIngressContract.getContractAddress(RULES);

        assert.equal(result, "0x0000000000000000000000000000000000000000", "NodeRules contract should NOT already be registered");

        // Register the NodeRules contract
        //por motivos de: você não pode registrar um contrato sem um endereço de admin, o adminContract tem que ser registrado antes do rules. Isso vai se repetir várias vezes pelos testes.
        result = await nodeIngressContract.setContractAddress(ADMIN, adminContract.address);
        result = await nodeIngressContract.setContractAddress(RULES, nodeRulesContract.address);

        // assert values in the RegistryUpdated event
        assert.equal(result.logs[0].args[0], nodeRulesContract.address, "Event address SHOULD be correct");
        assert.equal(result.logs[0].args[1], RULES, "Event name SHOULD be correct");

        // Verify the NodeRules contract address
        result = await nodeIngressContract.getContractAddress(RULES);
        assert.equal(result, nodeRulesContract.address, "NodeRules contract address SHOULD be correct");
    });

      it("Should return all registered contracts", async () => {
        let result = await nodeIngressContract.setContractAddress(ADMIN, adminContract.address);
        assert.equal(result.logs[0].args[0], adminContract.address, "Event address SHOULD be correct");
        assert.equal(result.logs[0].args[1], ADMIN, "Event name SHOULD be correct");

        result = await nodeIngressContract.setContractAddress(RULES, nodeRulesContract.address);
        assert.equal(result.logs[0].args[0], nodeRulesContract.address, "Event address SHOULD be correct");
        assert.equal(result.logs[0].args[1], RULES, "Event name SHOULD be correct");
        result = await nodeIngressContract.getAllContractKeys();
        assert.equal(result[0], ADMIN, "Admin contract SHOULD be registered");
        assert.equal(result[1], RULES, "NodeRules contract SHOULD be registered");
      });


    it('Should update a specified contract', async () => {
        let result;

         // Verify that the NodeRules contract has not yet been registered
        result = await nodeIngressContract.setContractAddress(ADMIN, adminContract.address);
        result = await nodeIngressContract.getContractAddress(RULES);
        assert.equal(result, "0x0000000000000000000000000000000000000000", 'NodeRules contract should NOT already be registered');

         // Register the NodeRules contract
        result = await nodeIngressContract.setContractAddress(RULES, nodeRulesContract.address);

         // Verify the NodeRules contract address
        result = await nodeIngressContract.getContractAddress(RULES);
        assert.equal(result, nodeRulesContract.address, 'NodeRules contract address SHOULD be correct');

         // Verify correct number of Contracts
        result = await nodeIngressContract.getAllContractKeys();
        assert.equal(result.length, 2, '2 keys SHOULD be registered');

         // Update the NodeRules contract
        result = await nodeIngressContract.setContractAddress(RULES, address2);

         // assert values in the RegistryUpdated event
        assert.equal(result.logs[0].args[0].toLowerCase(), address2, 'Event address from REMOVE SHOULD be zero');
        assert.equal(result.logs[0].args[1], RULES, 'Event name SHOULD be correct');

         // Verify that the NodeRules contract has been deleted
        result = await nodeIngressContract.getContractAddress(RULES);
        assert.equal(result.toLowerCase(), address2, 'NodeRules contract SHOULD have been updated');

         // Verify correct number of Contracts
        result = await nodeIngressContract.getAllContractKeys();
        assert.equal(result.length, 2, '2 keys SHOULD be registered');
    });
});
//
contract("Ingress contract", (accounts) => {
    let nodeIngressContract;
    let nodeRulesContract;
    let adminContract;

    beforeEach("Setup contract registry", async () => {
        nodeIngressContract = await NodeIngressContract.new();
        adminContract = await AdminContract.new();
        await nodeIngressContract.setContractAddress(ADMIN, adminContract.address);
        nodeRulesContract = await NodeRulesContract.new(nodeIngressContract.address);
        await nodeIngressContract.setContractAddress(RULES, nodeRulesContract.address);
    })

    it("Should not allow an unauthorized account to perform administration operations", async () => {
        // Verify account 1 is not authorized
        let result = await nodeIngressContract.isAuthorized(accounts[1]);
        assert.equal(result, false, "Sender account should NOT be authorized");

        // Attempt to register an additional contract
        try {
            await nodeIngressContract.setContractAddress(RULES, nodeRulesContract.address, { from: accounts[1] });
            assert.fail("Unauthorized sender was able to set Contract in registry");
        } catch (err) {
            expect(err.reason).to.contain("Not authorized to update contract registry");
        }

    });
//
    it("Should allow authorized account to perform administration operations", async () => {
        //operações autorizadas: adicionar contrato... e só.
        const CONTRACT_NAME="0x666f6f0000000000000000000000000000000000000000000000000000000000";
        const CONTRACT_ADDR="0x1111111111111111111111111111111111111111";
        //
        // // Verify sender is initially authorized
        let result = await nodeIngressContract.isAuthorized(accounts[0]);
        assert.equal(result, true, "Sender account SHOULD be authorized");
        //
        // // try to remove non existent contract. should have no effect
        // await nodeIngressContract.removeContract(CONTRACT_NAME);
        //
        // // Register the NodeRules contract
        await nodeIngressContract.setContractAddress(CONTRACT_NAME, CONTRACT_ADDR);
        //
        // // Verify the NodeRules contract is registered
        result = await nodeIngressContract.getContractAddress(CONTRACT_NAME);
        assert.equal(result, CONTRACT_ADDR, "Contract SHOULD be registered");

        //
        // // Verify correct number of Contracts
        result = await nodeIngressContract.getAllContractKeys();
        assert.equal(result.length, 3, "3 keys SHOULD be registered");
        //
        // // Remove the NodeRules contract ie not the last one
        // await nodeIngressContract.removeContract(RULES);
        //
        // // Verify that the NodeRules contract has been removed
        // result = await nodeIngressContract.getContractAddress(RULES);
        // assert.equal(result, "0x0000000000000000000000000000000000000000", "Contract should NOT be registered");
        //
        // // Verify correct number of Contracts
        // result = await nodeIngressContract.getAllContractKeys();
        // assert.equal(result.length, 2, "2 keys SHOULD be registered");
        // result = await nodeIngressContract.getSize();
        // assert.equal(result, 2, "2 keys SHOULD be registered");
        //
        // // Remove the new contract
        // await nodeIngressContract.removeContract(CONTRACT_NAME);
        //
        // // Verify that the new contract has been removed
        // result = await nodeIngressContract.getContractAddress(CONTRACT_NAME);
        // assert.equal(result, "0x0000000000000000000000000000000000000000", "Contract should NOT be registered");
        //
        // // Verify correct number of Contracts
        // result = await nodeIngressContract.getAllContractKeys();
        // assert.equal(result.length, 1, "1 keys SHOULD be registered");
    });
//
    it("Should emit an event when the NodeRules are updated", async () => {
        //Add a more restrictive rule
        await nodeRulesContract.addEnode(node1High, node1Low, node1Type, node1GeoHash, node1Name, node1Organization, { from: accounts[0] });

        // Get the events
        let result = await nodeIngressContract.getPastEvents("NodePermissionsUpdated", {fromBlock: 0, toBlock: "latest" });

        // Verify the NodePermissionsUpdated event
        assert.equal(result[0].returnValues.addsRestrictions, false, "addsRestrictions SHOULD be false");

        // Add a less restrictive rule
        result = await nodeRulesContract.removeEnode(node1High, node1Low);

        // Get the events
        result = await nodeIngressContract.getPastEvents("NodePermissionsUpdated", {fromBlock: 0, toBlock: "latest" });

        // Verify the NodePermissionsUpdated event
        assert.equal(result[1].returnValues.addsRestrictions, true, "addsRestrictions SHOULD be true");
    });
//
    it("Should only trigger NodeRules update events when issued from NodeRules contract", async () => {
        let result;

        const acProxy = await NodeRulesContract.new(nodeIngressContract.address);

        // Register the contracts
        await nodeIngressContract.setContractAddress(RULES, nodeRulesContract.address);
        await nodeIngressContract.setContractAddress(ADMIN, acProxy.address);

        // Verify the contract addresses
        result = await nodeIngressContract.getContractAddress(RULES);
        assert.equal(result, nodeRulesContract.address, "NodeRules contract address SHOULD be correct");
        result = await nodeIngressContract.getContractAddress(ADMIN);
        assert.equal(result, acProxy.address, "Admin contract address SHOULD be correct");

        // Verify correct number of Contracts
        result = await nodeIngressContract.getAllContractKeys();
        assert.equal(result.length, 2, "2 keys SHOULD be registered");

        // Trigger an event from NodeRules contract
        await nodeRulesContract.triggerRulesChangeEvent(true);

        // Get the events
        result = await nodeIngressContract.getPastEvents("NodePermissionsUpdated", {fromBlock: 0, toBlock: "latest" });

        // Verify the NodePermissionsUpdated event
        assert.equal(result.length, 1, "Number of events SHOULD be 1");

        // Attempt to trigger an additional event from Admin contract
        try {
            await acProxy.triggerRulesChangeEvent(true);
            assert.fail("Unauthorized contract was allowed to trigger event")
        } catch (err) {
            assert.isOk(err.toString().includes("revert"), "Expected revert in message");
        }

        // Get the events
        result = await nodeIngressContract.getPastEvents("NodePermissionsUpdated", {fromBlock: 0, toBlock: "latest" });

        // Verify the NodePermissionsUpdated event
        assert.equal(result.length, 1, "Number of events SHOULD be 1");
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




});
