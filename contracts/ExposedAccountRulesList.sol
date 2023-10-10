pragma solidity 0.8.0;
// SPDX-License-Identifier: UNLICENSED

import "./AccountRulesList.sol";


contract ExposedAccountRulesList is AccountRulesList {

    function _size() public view returns (uint256) {
        return size();
    }

    function _exists(address _account) public view returns (bool) {
        return exists(_account);
    }

    function _add(address _account) public returns (bool) {
        return add(_account);
    }

    function _addAll(address[] memory accounts) public returns (bool) {
        return addAll(accounts, msg.sender);
    }

    function _remove(address _account) public returns (bool) {
        return remove(_account);
    }
}
