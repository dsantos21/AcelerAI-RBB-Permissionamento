pragma solidity 0.6.0;
// SPDX-License-Identifier: UNLICENSED


contract AdminList {
    event AdminAdded(
        bool adminAdded,
        address indexed accountGrantee,
        address indexed accountGrantor,
        uint indexed blockTimestamp,
        string message
    );

    event AdminRemoved(
        bool adminRemoved,
        address indexed accountGrantee,
        address indexed accountGrantor,
        uint indexed blockTimestamp
    );

    address[] public allowlist;
    mapping (address => uint256) private indexOf; //1 based indexing. 0 means non-existent

    function size() internal view returns (uint256) {
        return allowlist.length;
    }

    function exists(address _account) internal view returns (bool) {
        return indexOf[_account] != 0;
    }

    function add(address _account) internal returns (bool) {
        if (indexOf[_account] == 0) {
            indexOf[_account] = allowlist.length + 1; // 1-based indexing
            allowlist.push(_account);
            return true;
        }
        return false;
    }


    function addAll(address[] memory accounts, address _grantor) internal returns (bool) {
        bool allAdded = true;
        for (uint i = 0; i<accounts.length; i++) {
            if (msg.sender == accounts[i]) {
                emit AdminAdded(false, accounts[i], _grantor, block.timestamp, "Adding own account as Admin is not permitted");
                allAdded = allAdded && false;
            } else if (exists(accounts[i])) {
                emit AdminAdded(false, accounts[i], _grantor, block.timestamp, "Account is already an Admin");
                allAdded = allAdded && false;
            }  else {
                bool result = add(accounts[i]);
                string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
                emit AdminAdded(result, accounts[i], _grantor, block.timestamp, message);
                allAdded = allAdded && result;
            }
        }

        return allAdded;
    }

    function remove(address _account) internal returns (bool) {
        uint256 index = indexOf[_account];
        if (index > 0 && index <= allowlist.length) { //1-based indexing
            //move last address into index being vacated (unless we are dealing with last index)
            if (index != allowlist.length) {
                address lastAccount = allowlist[allowlist.length - 1];
                allowlist[index - 1] = lastAccount;
                indexOf[lastAccount] = index;
            }

            //shrink array
            allowlist.pop();
            indexOf[_account] = 0;
            return true;
        }
        return false;
    }
}
