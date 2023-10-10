pragma solidity 0.8.0;
// SPDX-License-Identifier: UNLICENSED

interface AdminProxy {
    function isAuthorized(address source) external view returns (bool);
}
