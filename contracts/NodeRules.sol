pragma solidity 0.5.9;

import "./NodeRulesProxy.sol";
import "./NodeRulesList.sol";
import "./NodeIngress.sol";
import "./Admin.sol";
import "./Multisig.sol";


contract NodeRules is NodeRulesProxy, NodeRulesList, Multisig {

    event NodeAdded(
        bool nodeAdded,
        bytes32 enodeHigh,
        bytes32 enodeLow,
        bytes16 enodeIp,
        uint16 enodePort
    );

    event NodeRemoved(
        bool nodeRemoved,
        bytes32 enodeHigh,
        bytes32 enodeLow,
        bytes16 enodeIp,
        uint16 enodePort
    );
    
    event Executed(
        string opName,
        bytes32 enodeHigh,
        bytes32 enodeLow,
        bytes16 ip,
        uint16 port,
        address lastSender,
        bytes32 pollId
    );

    struct Node {
        bytes32 enodeHigh;
        bytes32 enodeLow;
        bytes16 ip;
        uint16 port;
    }

    // in read-only mode rules can't be added/removed
    // this will be used to protect data when upgrading contracts
    bool readOnlyMode = false;
    // version of this contract: semver like 1.2.14 represented like 001002014
    uint version = 2000000;

    NodeIngress private nodeIngressContract;
    
    string private constant ADD_ENODE = "ADD_ENODE";
    string private constant REMOVE_ENODE = "REMOVE_ENODE";

    modifier onlyAdmin() {
        address adminContractAddress = nodeIngressContract.getContractAddress(nodeIngressContract.ADMIN_CONTRACT());

        require(adminContractAddress != address(0), "Ingress contract must have Admin contract registered");
        require(Admin(adminContractAddress).isAuthorized(msg.sender), "Sender not authorized");
        _;
    }

    modifier onlyVotedForStructuralChanges() {
        address adminContractAddress = nodeIngressContract.getContractAddress(nodeIngressContract.ADMIN_CONTRACT());
        require(Admin(adminContractAddress).isVotedForStructuralChanges(msg.sender), "Not permitted");
        _;
    }

    constructor(address _adminContractAddress, NodeIngress _nodeIngressAddress) Multisig(_adminContractAddress) public {
        nodeIngressContract = _nodeIngressAddress;
    }

    // VERSION
    function getContractVersion() external view returns (uint) {
        return version;
    }

    // READ ONLY MODE
    function isReadOnly() external view returns (bool) {
        return readOnlyMode;
    }

    function enterReadOnly() external onlyVotedForStructuralChanges returns (bool) {
        require(readOnlyMode == false, "Already in read only mode");
        readOnlyMode = true;
        return true;
    }

    function exitReadOnly() external onlyVotedForStructuralChanges returns (bool) {
        require(readOnlyMode == true, "Not in read only mode");
        readOnlyMode = false;
        return true;
    }

    function connectionAllowed(
        bytes32 sourceEnodeHigh,
        bytes32 sourceEnodeLow,
        bytes16 sourceEnodeIp,
        uint16 sourceEnodePort,
        bytes32 destinationEnodeHigh,
        bytes32 destinationEnodeLow,
        bytes16 destinationEnodeIp,
        uint16 destinationEnodePort
    ) external view returns (bytes32) {
        if (
            enodePermitted (
                sourceEnodeHigh,
                sourceEnodeLow,
                sourceEnodeIp,
                sourceEnodePort
            ) && enodePermitted(
                destinationEnodeHigh,
                destinationEnodeLow,
                destinationEnodeIp,
                destinationEnodePort
            )
        ) {
            return 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
        } else {
            return 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
        }
    }

    function enodePermitted(
        bytes32 enodeHigh,
        bytes32 enodeLow,
        bytes16 ip,
        uint16 port
    ) public view returns (bool) {
        return exists(enodeHigh, enodeLow, ip, port);
    }

    function addEnode(
        bytes32 enodeHigh,
        bytes32 enodeLow,
        bytes16 ip,
        uint16 port,
        NodeType nodeType,
        bytes6 geoHash,
        string calldata name,
        string calldata organization
    ) external onlyAdmin {
        bytes32 pollId = getPollId(ADD_ENODE, enodeHigh, enodeLow, ip, port);
        if (voteAndVerify(pollId)){
            bool added = add(enodeHigh, enodeLow, ip, port, nodeType, geoHash, name, organization);
            
            if (added) {
                triggerRulesChangeEvent(false);
            }

            emit NodeAdded(
                added,
                enodeHigh,
                enodeLow,
                ip,
                port
            );

            finish(ADD_ENODE, enodeHigh, enodeLow, ip, port, msg.sender, pollId);
        }
    }

    function removeEnode(
        bytes32 enodeHigh,
        bytes32 enodeLow,
        bytes16 ip,
        uint16 port
    ) external onlyAdmin {
        bytes32 pollId = getPollId(REMOVE_ENODE, enodeHigh, enodeLow, ip, port);
        if (voteAndVerify(pollId)){
            bool removed = remove(enodeHigh, enodeLow, ip, port);

            if (removed) {
                triggerRulesChangeEvent(true);
            }

            emit NodeRemoved(
                removed,
                enodeHigh,
                enodeLow,
                ip,
                port
            );

            finish(REMOVE_ENODE, enodeHigh, enodeLow, ip, port, msg.sender, pollId);
        }
    }

    function getPollId(string memory opName, bytes32 enodeHigh, bytes32 enodeLow, bytes16 ip, uint16 port) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(opName, enodeHigh, enodeLow, ip, port));
    }

    function getSize() external view returns (uint) {
        return size();
    }

    function getByIndex(uint index) public view returns (bytes32 enodeHigh, bytes32 enodeLow, bytes16 ip, uint16 port, NodeType nodeType, bytes6 geoHash, string memory name, string memory organization) {
        if (index >= 0 && index < size()) {
            enode memory item = allowlist[index];
            return (item.enodeHigh, item.enodeLow, item.ip, item.port, item.nodeType, item.geoHash, item.name, item.organization);
        }
    }

    function triggerRulesChangeEvent(bool addsRestrictions) public {
        nodeIngressContract.emitRulesChangeEvent(addsRestrictions);
    }

    function finish(string memory opName, bytes32 enodeHigh, bytes32 enodeLow, bytes16 ip, uint16 port, address lastSender, bytes32 pollId) private {
        deletePollId(pollId);
        emit Executed(opName, enodeHigh, enodeLow, ip, port, lastSender, pollId);
    }
}
