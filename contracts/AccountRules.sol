pragma solidity 0.5.9;

import "./AccountRulesProxy.sol";
import "./AccountRulesList.sol";
import "./ContractRulesAdminProxy.sol";
import "./AccountIngress.sol";
import "./Admin.sol";


contract AccountRules is AccountRulesProxy, AccountRulesList, ContractRulesAdminProxy {

    // in read-only mode rules can't be added/removed
    // this will be used to protect data when upgrading contracts
    bool private readOnlyMode = false;
    // version of this contract: semver like 1.2.14 represented like 001002014
    uint private version = 1000000;

    AccountIngress private ingressContract;

    mapping(address => bool) public blockedContracts;
    mapping(address => address[]) public contractsAdmins;


    modifier onlyOnEditMode() {
        require(!readOnlyMode, "In read only mode: rules cannot be modified");
        _;
    }

    modifier onlyAdmin() {
        address adminContractAddress = ingressContract.getContractAddress(ingressContract.ADMIN_CONTRACT());

        require(adminContractAddress != address(0), "Ingress contract must have Admin contract registered");
        require(Admin(adminContractAddress).isAuthorized(msg.sender), "Sender not authorized");
        _;
    }

    constructor (AccountIngress _ingressContract) public {
        ingressContract = _ingressContract;
        add(msg.sender);
    }

    // VERSION
    function getContractVersion() public view returns (uint) {
        return version;
    }

    // READ ONLY MODE
    function isReadOnly() public view returns (bool) {
        return readOnlyMode;
    }

    function enterReadOnly() public onlyAdmin returns (bool) {
        require(readOnlyMode == false, "Already in read only mode");
        readOnlyMode = true;
        return true;
    }

    function exitReadOnly() public onlyAdmin returns (bool) {
        require(readOnlyMode == true, "Not in read only mode");
        readOnlyMode = false;
        return true;
    }

    function transactionAllowed(
        address sender,
        address target, // target
        uint256, // value
        uint256, // gasPrice
        uint256, // gasLimit
        bytes memory // payload
    ) public view returns (bool) {
        if ((accountPermitted (sender) && !isBlocked(target)) || (accountPermitted (sender) && isBlocked(target) && isContractAdmin(target, sender)) ){
            return true;
        } else {
            return false;
        }
    }

    function accountPermitted(
        address _account
    ) public view returns (bool) {
        return exists(_account);
    }

    function addAccount(
        address account
    ) public onlyAdmin onlyOnEditMode returns (bool) {
        bool added = add(account);
        emit AccountAdded(added, account, msg.sender, block.timestamp);
        return added;
    }

    function removeAccount(
        address account
    ) public onlyAdmin onlyOnEditMode returns (bool) {
        bool removed = remove(account);
        emit AccountRemoved(removed, account, msg.sender, block.timestamp);
        return removed;
    }

    function getSize() public view returns (uint) {
        return size();
    }

    function getByIndex(uint index) public view returns (address account) {
        return allowlist[index];
    }

    function getAccounts() public view returns (address[] memory){
        return allowlist;
    }

    function addAccounts(address[] memory accounts) public onlyAdmin returns (bool) {
        return addAll(accounts, msg.sender);
    }

    function isContractAdmin(address _contract, address _admin) public view returns (bool) {
    // Check if the admin is in the array of admins for the contract
    for(uint i = 0; i < contractsAdmins[_contract].length; i++) {
        if (contractsAdmins[_contract][i] == _admin) {
            return true;
        }
    }
    return false;
    }

    function blockContract(address _contract) external onlyAdmin onlyOnEditMode {
        blockedContracts[_contract] = true;
    }

    function unblockContract(address _contract) external onlyAdmin onlyOnEditMode {
        blockedContracts[_contract] = false;
    }

    function isBlocked(address _contract) public view returns (bool) {
        return blockedContracts[_contract];
    }

    function addContractAdmin(address _contract, address _admin) external onlyAdmin onlyOnEditMode {
    
    bool isContractBlocked = isBlocked(_contract);
    require(isContractBlocked, "Contract is not blocked");

    // Check if the function caller is already an admin of the contract
    for(uint i = 0; i < contractsAdmins[_contract].length; i++) {
        require(msg.sender != contractsAdmins[_contract][i], "Caller is already an admin");
    }

    // Add the new admin to the contract
    contractsAdmins[_contract].push(_admin);
    }

    function removeContractAdmin(address _contract, address _admin) external onlyAdmin onlyOnEditMode {
    // Find the admin in the array of admins for the contract
    for(uint i = 0; i < contractsAdmins[_contract].length; i++) {
        if (contractsAdmins[_contract][i] == _admin) {
            // Remove the admin from the array by moving the last element to this spot and shortening the array
            contractsAdmins[_contract][i] = contractsAdmins[_contract][contractsAdmins[_contract].length - 1];
            contractsAdmins[_contract].pop();
            return;
        }
    }
    // If the function hasn't returned yet, the admin was not found
    revert("Admin not found");
}
}

