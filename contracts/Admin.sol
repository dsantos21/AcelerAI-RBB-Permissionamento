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
        checkQuarantine(msg.sender, _address);

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
        checkQuarantineArray(msg.sender, new address[](0));

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
        checkQuarantineArray(msg.sender, accounts);

        blockedUntil[msg.sender] = block.timestamp + 1 days;
        // Add all accounts to the blockedUntil list
        for (uint i = 0; i < accounts.length; i++) {
            blockedUntil[accounts[i]] = block.timestamp + 1 days;
        }

        return addAll(accounts, msg.sender);
    }

    // Create a private function with 2 parameters - sender and accounts - and test if sender can execute admin tasks (he only can execute admin tasks if he is not in the blockedUntil map or if the blocked date is in the past), and if the answer is true also adds the sender and all the accounts in the array to the blockedUntil map with the current date plus one day
    function checkQuarantineArray(address sender, address[] memory accounts) private returns (bool) {
        require(blockedUntil[msg.sender] <= block.timestamp, "Sender is blocked from adding Admins");
        blockedUntil[sender] = block.timestamp + 1 days;
        for (uint i = 0; i < accounts.length; i++) {
            blockedUntil[accounts[i]] = block.timestamp + 1 days;
        }
        return true;
    }

    function checkQuarantine(address sender, address _address) private returns (bool) {
        address[] memory arr = new address[](1);
        arr[0] = _address;
        return checkQuarantineArray(msg.sender, arr);
    }

}
