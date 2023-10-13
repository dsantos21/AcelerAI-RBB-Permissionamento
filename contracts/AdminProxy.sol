pragma solidity 0.8.21;
// SPDX-License-Identifier: UNLICENSED

interface AdminProxy {
    function isAuthorized(address source) external view returns (bool);
}
