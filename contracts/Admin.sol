pragma solidity 0.6.0;
// SPDX-License-Identifier: UNLICENSED

import "./AdminProxy.sol";
import "./AdminList.sol";

contract Admin is AdminProxy, AdminList {
    // Declaração dos eventos
    event AdminAdded(bool success, address indexed admin, address indexed addedBy, uint256 timestamp, string message);
    event AdminRemoved(bool success, address indexed admin, address indexed removedBy, uint256 timestamp);

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

    function isAuthorized(address _address) public override view returns (bool) {
        return exists(_address);
    }

    function addAdmin(address _address) public onlyAdmin returns (bool) {
        bool result;
        string memory message;

        if (msg.sender == _address) {
            message = "Adding own account as Admin is not permitted";
            result = false;
        } else {
            result = add(_address);
            message = result ? "Admin account added successfully" : "Account is already an Admin";
        }

        emit AdminAdded(result, _address, msg.sender, block.timestamp, message);
        return result;
    }

    function removeAdmin(address _address) public onlyAdmin notSelf(_address) returns (bool) {
        bool removed = remove(_address);
        emit AdminRemoved(removed, _address, msg.sender, block.timestamp);
        return removed;
    }

    function getAdmins() public view returns (address[] memory) {
        return allowlist;
    }

    function addAdmins(address[] memory accounts) public onlyAdmin returns (bool) {
        bool success = addAll(accounts, msg.sender);
        // Aqui pode-se emitir eventos para cada admin adicionado se necessário
        return success;
    }
}
