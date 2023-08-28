pragma solidity 0.5.9;

import "./AdminProxy.sol";
import "./AdminList.sol";


contract Admin is AdminProxy, AdminList {

    mapping(address => uint256) private lastCallTimestamp;
    address owner;
    address public SuperUser;

    modifier onlyAdmin() {
        require(isAuthorized(msg.sender), "Sender not authorized");
        _;
    }

    modifier notSelf(address _address) {
        require(msg.sender != _address, "Cannot invoke method with own account as parameter");
        _;
    }

     modifier onlySuperUser() { 
        require(msg.sender == SuperUser, "Only super user can perform this action");
        _;
    }

    struct Vote {
        mapping(address => bool) voters;
        uint256 count;
        uint256 lastVoteTimestamp;
    }
    
    mapping(address => Vote) public votes;

    constructor() public {
        add(msg.sender);
        owner = msg.sender;
        makeSuperUser(msg.sender);
    }

    function isSuperUser (address _address) public view returns (bool) { 
        return _address == SuperUser;
    }

    function removeSuperUserSelf() public {
        require(isSuperUser(msg.sender), "Not permitted");
        SuperUser = address(0);
    }

    function removeSuperUser() private{
        SuperUser = address(0);
    }

    function getAdminSize() public view returns (uint256) {
        address[] memory admins = getAdmins();
        return admins.length;
    }

    function isAuthorized(address _address) public view returns (bool) {
        return exists(_address);
    }

    function makeSuperUser(address superToBe) private{
        SuperUser = superToBe;
    }

    function voteForSuperUser(address superToBe) public onlyAdmin returns (bool){
        require(superToBe != address(0), "Address must not be zero.");
        require(!votes[superToBe].voters[msg.sender], "Already voted for this proposal");
        
        if (block.timestamp > votes[superToBe].lastVoteTimestamp + 7 days){
            delete votes[superToBe];
            votes[superToBe].voters[msg.sender] = true;
            votes[superToBe].count++;
            votes[superToBe].lastVoteTimestamp = block.timestamp;
        }

        if (votes[superToBe].count >= 3){
            makeSuperUser(superToBe);
            votes[superToBe].count = 0;
        }

    }

    function voteToRemove(address notSuperAnymore) public onlyAdmin returns (bool){
        require(notSuperAnymore == SuperUser, "This address is not a super user.");
        require(!votes[notSuperAnymore].voters[msg.sender], "Already voted for this proposal");

        if (votes[notSuperAnymore].count >= 3){
            SuperUser = address(0);
            votes[notSuperAnymore].count = 0;
        } else {
            votes[notSuperAnymore].count++;
        }

    }

    function addAdmin(address _address) public onlyAdmin returns (bool) {
        if (msg.sender == _address) {
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "Adding own account as Admin is not permitted");
            return false;
        }
        if (block.timestamp < lastCallTimestamp[msg.sender] + 1 days){
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "You can only do this once a day");
            return false;
        }
        if (block.timestamp < lastCallTimestamp[_address] + 1 days){
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "Account still under quarantine");
            return false;
        }
        else {
            bool result = add(_address);
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            emit AdminAdded(result, _address, msg.sender, block.timestamp, message);    
            if (result == true){
                lastCallTimestamp[msg.sender] = block.timestamp;
                lastCallTimestamp[_address] = block.timestamp;
            }
            return result;
        }
    }

    function removeAdmin(address _address) public onlyAdmin notSelf(_address) returns (bool) {
        if (block.timestamp < lastCallTimestamp[msg.sender] + 1 days){
            emit AdminRemoved(false, _address, msg.sender, block.timestamp);
            return false;
        }
        else {
            bool removed = remove(_address);
            emit AdminRemoved(removed, _address, msg.sender, block.timestamp);
            lastCallTimestamp[msg.sender] = block.timestamp;
            return removed;
        }

    }

    function getAdmins() public view returns (address[] memory){
        return allowlist;
    }

    function addAdmins(address[] memory accounts) public onlyAdmin returns (bool) {
        require(msg.sender == owner, "Batch addresses are only allowed during deploy");
        owner = address(0);
        return addAll(accounts, msg.sender);
    }
}
