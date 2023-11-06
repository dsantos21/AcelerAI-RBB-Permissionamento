// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.0;

import "./NodeRulesProxy.sol";
import "./NodeRulesList.sol";
import "./NodeIngress.sol";
import "./Admin.sol";

contract NodeRules is NodeRulesProxy, NodeRulesList {

    event NodeAdded(
        bool nodeAdded,
        bytes32 enodeHigh,
        bytes32 enodeLow
    );

    event NodeRemoved(
        bool nodeRemoved,
        bytes32 enodeHigh,
        bytes32 enodeLow
    );

    address private owner;

    // Em modo somente leitura, regras não podem ser adicionadas/removidas
    bool private readOnlyMode = false;

    // Versão deste contrato: semver como 1.2.14 representado como 001002014
    uint private version = 1000000;

    NodeIngress private nodeIngressContract;

    modifier onlyOnEditMode() {
        require(!readOnlyMode, "In read only mode: rules cannot be modified");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    modifier onlyAdmin() {
        address adminContractAddress = nodeIngressContract.getContractAddress(nodeIngressContract.ADMIN_CONTRACT());
        require(adminContractAddress != address(0), "Ingress contract must have Admin contract registered");
        require(Admin(adminContractAddress).isAuthorized(msg.sender), "Sender not authorized");
        _;
    }

    constructor (NodeIngress _nodeIngressAddress) public {
        nodeIngressContract = _nodeIngressAddress;
        owner = msg.sender;
    }

    function getContractVersion() public view returns (uint) {
        return version;
    }

    function isReadOnly() public view returns (bool) {
        return readOnlyMode;
    }

    function enterReadOnly() public onlyAdmin returns (bool) {
        require(!readOnlyMode, "Already in read only mode");
        readOnlyMode = true;
        return true;
    }

    function exitReadOnly() public onlyAdmin returns (bool) {
        require(readOnlyMode, "Not in read only mode");
        readOnlyMode = false;
        return true;
    }

    function connectionAllowed(
        bytes32 sourceEnodeHigh,
        bytes32 sourceEnodeLow,
        bytes16,
        uint16,
        bytes32 destinationEnodeHigh,
        bytes32 destinationEnodeLow,
        bytes16,
        uint16
    ) public view override returns (bytes32) {
        if (enodePermitted(sourceEnodeHigh, sourceEnodeLow) &&
            enodePermitted(destinationEnodeHigh, destinationEnodeLow)) {
            return 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
        } else {
            return 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
        }
    }


    function enodePermitted(
        bytes32 enodeHigh,
        bytes32 enodeLow
    ) public view returns (bool) {
        return exists(enodeHigh, enodeLow);
    }

    function addNodeDuringDeploy(
        bytes32 enodeHigh,
        bytes32 enodeLow,
        NodeType nodeType,
        bytes6 geoHash,
        string memory name,
        string memory organization
    ) public onlyAdmin onlyOnEditMode onlyOwner returns (bool){
        bool added = add(enodeHigh, enodeLow, nodeType, geoHash, name, organization);
        if (added) {
            emit NodeAdded(added, enodeHigh, enodeLow);
        }
        return added;
    }

    function finishDeploy() public onlyOwner {
        owner = address(0);
    }

    function addEnode(
        bytes32 enodeHigh,
        bytes32 enodeLow,
        NodeType nodeType,
        bytes6 geoHash,
        string memory name,
        string memory organization
    ) public onlyAdmin onlyOnEditMode returns (bool) {
        bool added = add(enodeHigh, enodeLow, nodeType, geoHash, name, organization);

        if (added) {
            triggerRulesChangeEvent(false);
            emit NodeAdded(added, enodeHigh, enodeLow);
        }

        return added;
    }

    function removeEnode(
        bytes32 enodeHigh,
        bytes32 enodeLow
    ) public onlyAdmin onlyOnEditMode returns (bool) {
        bool removed = remove(enodeHigh, enodeLow);

        if (removed) {
            triggerRulesChangeEvent(true);
            emit NodeRemoved(removed, enodeHigh, enodeLow);
        }

        return removed;
    }

    function getSize() public view returns (uint) {
        return size();
    }

    function getByIndex(uint index) public view returns (bytes32 enodeHigh, bytes32 enodeLow, NodeType nodeType, bytes6 geoHash, string memory name, string memory organization) {
        require(index < size(), "Index out of bounds");

        enode memory item = allowlist[index];
        return (item.enodeHigh, item.enodeLow, item.nodeType, item.geoHash, item.name, item.organization);
    }

    function triggerRulesChangeEvent(bool addsRestrictions) public {
        nodeIngressContract.emitRulesChangeEvent(addsRestrictions);
    }
}
