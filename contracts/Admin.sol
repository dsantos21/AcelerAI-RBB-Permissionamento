pragma solidity 0.5.9;

import "./AdminProxy.sol";
import "./AdminList.sol";


contract Admin is AdminProxy, AdminList {
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

    mapping(address => uint) private quarantinedAdmins;

    /**
     * @dev Adds an admin account to the quarantined list.
     * If the address is already in the list, the existing timestamp will be replaced with the new one.
     * @param _address The address of the account to be added to the quarantined list.
     * @param _timestamp The timestamp at the start of quarantine.
     *
     * Requirements:
     * - The caller must be an admin.
     */
    function addAdminToQuarentineds(address _address, uint _timestamp) public onlyAdmin {
        quarantinedAdmins[_address] = _timestamp;
    }

    /**
     * Removes an admin account from the quarantined list.
     * @param _address The address of the account to be removed from the quarantined list.
     */
    function removeAdminFromQuarentineds(address _address) internal {
        delete quarantinedAdmins[_address];
    }

    /**
     * Check if the admin is quarentined, reading the quarantinedAdmins mapping.
     * The admin should be considered quarentined if it's in the mapping and the timestampStartOfQuarentine
     * is less than 1 day.
     * Also, if it is in the mapping and the timestampStartOfQuarentine is more than 1 day, 
     * the admin should be removed from the mapping, returning to the normal state.
     * @param _address The address of the account to be checked.
     * @return A boolean indicating whether the admin account is quarentined.
     */
    function isAdminQuarentined(address _address) public returns (bool) {
        if (quarantinedAdmins[_address] > 0) {
            if (block.timestamp - quarantinedAdmins[_address] < 1 days) {
                return true;
            } else {
                removeAdminFromQuarentineds(_address);
            }
        }
        return false;
    }

    /**
     * @dev Adds an admin account.
     * @param _address The address of the account to be added as an admin.
     * @return A boolean indicating whether the admin account was added successfully.
     *
     * Requirements:
     * - The caller must be an admin.
     * - The account to be added cannot be the same as the caller's address.
     *
     * Emits an {AdminAdded} event with the following parameters:
     * - `success`: A boolean indicating whether the admin account was added successfully.
     * - `account`: The address of the account that was added as an admin.
     * - `caller`: The address of the caller who added the admin account.
     * - `timestamp`: The timestamp when the admin account was added.
     * - `message`: A message indicating the result of the operation.
     */
    function addAdmin(address _address) public onlyAdmin returns (bool) {
        require( (! isAdminQuarentined(msg.sender)), "Admin sender is quarentined");
        //
        if (msg.sender == _address) {
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "Adding own account as Admin is not permitted");
            return false;
        } else {
            bool result = add(_address);
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            if (result) {
                addAdminToQuarentineds(msg.sender, block.timestamp);
                addAdminToQuarentineds(_address, block.timestamp);
            }
            emit AdminAdded(result, _address, msg.sender, block.timestamp, message);
            return result;
        }
    }

    function removeAdmin(address _address) public onlyAdmin notSelf(_address) returns (bool) {
        require( (! isAdminQuarentined(msg.sender)), "Admin sender is quarentined");
        bool removed = remove(_address);
        if (removed) {
            addAdminToQuarentineds(msg.sender, block.timestamp);
        }
        emit AdminRemoved(removed, _address, msg.sender, block.timestamp);
        return removed;
    }

    function getAdmins() public view returns (address[] memory){
        return allowlist;
    }

    function addAdmins(address[] memory accounts) public onlyAdmin returns (bool) {
        return addAll(accounts, msg.sender);
    }
}
