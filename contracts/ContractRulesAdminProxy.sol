pragma solidity 0.5.9;

interface ContractRulesAdminProxy {
    // Insert the contract in the list of blocked contracts
    function blockContract (address _contract) external; 
    // Remove the contract from the list of blocked contracts
    function unblockContract (address _contract) external;
    // Check if the contract is blocked
    function isBlocked (address _contract) external view returns (bool);
    // Add an admin for a contract
    function addContractAdmin(address _contract, address _admin) external;
    // Remove an admin for a contract
    function removeContractAdmin(address _contract, address _admin) external;
    // Check if an admin is authorized for a contract
    function isContractAdmin(address _contract, address _admin) external view returns (bool);
}
