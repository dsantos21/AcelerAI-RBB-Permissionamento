pragma solidity 0.5.9;

import "./AccountRulesProxy.sol";
import "./AccountRulesList.sol";
import "./AccountIngress.sol";
import "./Admin.sol";
import "./ContractRulesAdminProxy.sol";

contract AccountRules is AccountRulesProxy, AccountRulesList, ContractRulesAdminProxy {

    // in read-only mode rules can't be added/removed
    // this will be used to protect data when upgrading contracts
    bool private readOnlyMode = false;
    // version of this contract: semver like 1.2.14 represented like 001002014
    uint private version = 1000000;

    AccountIngress private ingressContract;

    address[] public blockedContracts;
    mapping (address => uint256) private indexOfBlockedContracts; //1 based indexing. 0 means non-existent
    mapping (address => address[]) private contractAdmins; 

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
        address target,
        uint256, // value
        uint256, // gasPrice
        uint256, // gasLimit
        bytes memory // payload
    ) public view returns (bool) {
        return accountPermitted(sender)
            && (!isContractBlocked(target) || isInContractAdminsList(target, sender));
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
    
    // Insert the contract in the list of blocked contracts
    function blockContract(address _contract) external onlyAdmin {
        if (indexOfBlockedContracts[_contract] == 0) {
            indexOfBlockedContracts[_contract] = blockedContracts.push(_contract);
        }
    }

    // Remove the contract from the list of blocked contracts
    function unblockContract(address _contract) external onlyAdmin {
        uint256 index = indexOfBlockedContracts[_contract];
        if (index > 0 && index <= blockedContracts.length) { //1-based indexing
            //move last address into index being vacated (unless we are dealing with last index)
            if (index != blockedContracts.length) {
                address lastAccount = blockedContracts[blockedContracts.length - 1];
                blockedContracts[index - 1] = lastAccount;
                indexOfBlockedContracts[lastAccount] = index;
            }

            //shrink array
            blockedContracts.length -= 1;
            indexOfBlockedContracts[_contract] = 0;
        }
    }

    // Check if the contract is blocked
    function isBlocked(address _contract) external view returns (bool) {
        return isContractBlocked(_contract);
    }


    // Add an admin for a contract
    function addContractAdmin(address _contract, address _admin) external onlyAdmin {
        assert(isContractBlocked(_contract));
        contractAdmins[_contract].push(_admin);
    }

    // Check if the contract is blocked
    function isContractBlocked(address _contract) internal view returns (bool) {
        return indexOfBlockedContracts[_contract] != 0;
    }

    // Remove an admin for a contract
    function removeContractAdmin(address _contract, address _admin) external onlyAdmin {
        assert(isInContractAdminsList(_contract, _admin));
        address[] storage admins = contractAdmins[_contract];
        for (uint256 i  = 0; i < admins.length; i++) {
            if (admins[i] == _admin) {
                admins[i] = admins[admins.length-1];
                admins.pop();
                return;
            }
        }
    }

    // Check if an admin is authorized for a contract
    function isContractAdmin(address _contract, address _admin) external view returns (bool) {
        return isInContractAdminsList(_contract, _admin);
    }
    
    // Check if an admin is authorized for a contract
    function isInContractAdminsList(address _contract, address _admin) internal view returns (bool) {
        address[] storage admins = contractAdmins[_contract];
        for (uint256 i  = 0; i < admins.length; i++) {
            if (admins[i] == _admin) {
                return true;
            }
        }
        return false;
    }
    
}
