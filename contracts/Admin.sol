pragma solidity 0.5.9;

import "./AdminProxy.sol";
import "./AdminList.sol";
import "./AccountIngress.sol";
import "./NodeIngress.sol";
import "./Multisig.sol";


contract Admin is AdminProxy, AdminList, Multisig {

    string private constant ADD_ADMIN = "ADD_ADMIN";
    string private constant REMOVE_ADMIN = "REMOVE_ADMIN";

    string private constant VOTE_FOR_STRUCTURAL_CHANGES = "VOTE_FOR_STRUCTURAL_CHANGES";
    string private constant REVOKE_ACCESS_TO_STRUCTURAL_CHANGES = "REVOKE_ACCESS_TO_STRUCTURAL_CHANGES";

    address private votedForStructuralChanges;

    address private nodeIngressContractAddress;
    address private accountIngressContractAddress;

    event Executed(
        string opName,
        address payload,
        address lastSender,
        bytes32 pollId
    );

    modifier multisigTx(string memory opName, address payload) {
        bytes32 pollId = getPollId(opName, payload);
        if (voteAndVerify(pollId)){
            _;
            finish(opName, payload, msg.sender, pollId);
        }
    }

    modifier onlyAdmin() {
        require(isAuthorized(msg.sender), "Sender not authorized");
        _;
    }

    modifier onlyVotedForStructuralChanges() {
        require(isVotedForStructuralChanges(msg.sender), "Not permitted");
        _;
    }

    modifier atLeastOneAdmin() {
        require(size() > 1, "There must be at least 1 administrator");
        _;
    }

    modifier isAdmin(address _address) {
        require(isAuthorized(_address), "The address given is not an admin");
        _;
    }

    constructor(address _accountIngressContractAddress, address _nodeIngressContractAddress) Multisig(address(this)) public {
        add(msg.sender);
        accountIngressContractAddress = _accountIngressContractAddress;
        nodeIngressContractAddress = _nodeIngressContractAddress;
    }
    
    function selfRevokeAdminAccess() external onlyAdmin atLeastOneAdmin {
        checkAndRevokeAccessToStructuralChanges(msg.sender);
        bool removed = remove(msg.sender);
        emit AdminRemoved(removed, msg.sender);
    }

    function selfRevokeAccessToStructuralChanges() external onlyVotedForStructuralChanges {
        votedForStructuralChanges = address(0);
    }

    function revokeAccessToStructuralChanges() external onlyAdmin multisigTx(REVOKE_ACCESS_TO_STRUCTURAL_CHANGES, address(0)) {
        votedForStructuralChanges = address(0);
    }

    function checkAndRevokeAccessToStructuralChanges(address _address) private {
        if (isVotedForStructuralChanges(_address)){
            votedForStructuralChanges = address(0);
        }
    }

    function isAuthorized(address _address) public view returns (bool) {
        if (msg.sender == accountIngressContractAddress || msg.sender == nodeIngressContractAddress){
            return isVotedForStructuralChanges(_address);
        }
        return exists(_address);
    }
    
    function isVotedForStructuralChanges(address _address) public view returns (bool) {
        return _address == votedForStructuralChanges;
    }

    function voteForStructuralChanges(address _address) external onlyAdmin isAdmin(_address) multisigTx(VOTE_FOR_STRUCTURAL_CHANGES, _address) {
        votedForStructuralChanges = _address;
    }

    function addAdmin(address _address) external onlyAdmin multisigTx(ADD_ADMIN, _address) {
        if (msg.sender == _address) {
            emit AdminAdded(false, _address, "Adding own account as Admin is not permitted");
        } else {
            bool result = add(_address);
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            emit AdminAdded(result, _address, message);
        }
    }

    function removeAdmin(address _address) external onlyAdmin isAdmin(_address) atLeastOneAdmin multisigTx(REMOVE_ADMIN, _address) {
        checkAndRevokeAccessToStructuralChanges(_address);
        bool removed = remove(_address);
        emit AdminRemoved(removed, _address);
    }

    function getAdmins() external view returns (address[] memory){
        return allowlist; // mythx-disable-line SWC-128
    }

    function getVotedForStructuralChanges() public view returns (address){
        return votedForStructuralChanges;
    }

    function getPollId(string memory opName, address payload) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(opName, payload));
    }

    function finish(string memory opName, address payload, address lastSender, bytes32 pollId) private {
        deletePollId(pollId);
        emit Executed(opName, payload, lastSender, pollId);
    }
}
