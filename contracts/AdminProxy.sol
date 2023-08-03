pragma solidity 0.5.9;

interface AdminProxy {
    function isAuthorized(address source) external view returns (bool);
    function getAdminSize() external view returns (uint256);
}
