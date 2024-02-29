pragma solidity 0.5.9;

import "./AdminProxy.sol";
import "./AdminList.sol";


contract Admin is AdminProxy, AdminList {
    
    mapping (address => uint256) private quarantineEndsAt; //1 based indexing. 0 means non-existent

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
        if (msg.sender == _address) {
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "Adding own account as Admin is not permitted");
            return false;
        } else if (isInQuarantine(msg.sender)) {
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "Caller in quarantine. Adding accounts as Admin is not permitted");
            revert();
        } else {
            bool result = add(_address);
            if (result) {
                putInQuarantine(msg.sender);
                putInQuarantine(_address);
            }
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            emit AdminAdded(result, _address, msg.sender, block.timestamp, message);
            return result;
        }
    }

    function removeAdmin(address _address) public onlyAdmin notSelf(_address) returns (bool) {
        if (isInQuarantine(msg.sender)) {
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "Caller in quarantine. Removing Admin accounts is not permitted");
            revert();
        } else {
            bool removed = remove(_address);
            if (removed) {
                putInQuarantine(msg.sender);
            }
            emit AdminRemoved(removed, _address, msg.sender, block.timestamp);
            return removed;
        }
    }

    function getAdmins() public view returns (address[] memory){
        return allowlist;
    }

    function addAdmins(address[] memory accounts) public onlyAdmin returns (bool) {
        return addAll(accounts, msg.sender);
    }

    function isInQuarantine(address _account) internal view returns (bool) {
        return quarantineEndsAt[_account] != 0 && quarantineEndsAt[_account] > now ;
    }

    function putInQuarantine(address _account) internal returns (bool) {
        quarantineEndsAt[_account] = now + 1 days;
    }
}
