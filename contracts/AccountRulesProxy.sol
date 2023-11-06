pragma solidity 0.6.0;
// SPDX-License-Identifier: UNLICENSED

interface AccountRulesProxy {
    function transactionAllowed(
        address sender,
        address target,
        uint256 value,
        uint256 gasPrice,
        uint256 gasLimit,
        bytes calldata payload
    ) external view returns (bool);
}
