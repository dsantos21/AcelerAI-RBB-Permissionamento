pragma solidity 0.5.9;

import "./AdminProxy.sol";
import "./AdminList.sol";


contract Admin is AdminProxy, AdminList {

    // Map of Admins to date representing unblock date
    mapping(address => uint) public blockedUntil;

    modifier onlyAdmin() {
        require(isAuthorized(msg.sender), "Sender not authorized");
        _;
    }

    modifier notSelf(address _address) {
        require(msg.sender != _address, "Cannot invoke method with own account as parameter");
        _;
    }

    constructor() public {
        add(msg.sender);
    }

    function isAuthorized(address _address) public view returns (bool) {
        return exists(_address);
    }

    function addAdmin(address _address) public onlyAdmin returns (bool) {
        // Test if sender is in blockedUntil and if the block date is greater than current date
        require(blockedUntil[msg.sender] < block.timestamp, "Sender is blocked from adding Admins");


        // Add sender to blockedUntil, setting the block date to
        // current datetime plus one day
        blockedUntil[msg.sender] = block.timestamp + 1 days;
        blockedUntil[_address] = block.timestamp + 1 days;

        // Check if the address is the same as sender

        if (msg.sender == _address) {
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "Adding own account as Admin is not permitted");
            return false;
        } else {
            bool result = add(_address);
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            emit AdminAdded(result, _address, msg.sender, block.timestamp, message);
            return result;
        }
    }

    function removeAdmin(address _address) public onlyAdmin notSelf(_address) returns (bool) {
        // Test if sender is in blockedUntil and if the block date is greater than current date
        require(blockedUntil[msg.sender] < block.timestamp, "Sender is blocked from adding Admins");

        blockedUntil[msg.sender] = block.timestamp + 1 days;
        bool removed = remove(_address);
        emit AdminRemoved(removed, _address, msg.sender, block.timestamp);
        return removed;
    }

    function getAdmins() public view returns (address[] memory){
        return allowlist;
    }

    function addAdmins(address[] memory accounts) public onlyAdmin returns (bool) {
        // Test if sender is in blockedUntil and if the block date is greater than current date
        require(blockedUntil[msg.sender] < block.timestamp, "Sender is blocked from adding Admins");

        blockedUntil[msg.sender] = block.timestamp + 1 days;
        // Add all accounts to the blockedUntil list
        for (uint i = 0; i < accounts.length; i++) {
            blockedUntil[accounts[i]] = block.timestamp + 1 days;
        }

        return addAll(accounts, msg.sender);
    }
}
