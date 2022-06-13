pragma solidity 0.5.9;

import "./AccountRulesProxy.sol";
import "./AccountRulesList.sol";
import "./AccountIngress.sol";
import "./Admin.sol";


contract AccountRules is AccountRulesProxy, AccountRulesList {

    // in read-only mode rules can't be added/removed
    // this will be used to protect data when upgrading contracts
    bool private readOnlyMode = false;
    // version of this contract: semver like 1.2.14 represented like 001002014
    uint private version = 2000000;

    AccountIngress private accountIngressContract;

    modifier onlyOnEditMode() {
        require(!readOnlyMode, "In read only mode: rules cannot be modified");
        _;
    }

    modifier onlyAdmin() {
        require(isAuthorizedAdmin(msg.sender), "Sender not authorized");
        _;
    }

    modifier onlyVotedForStructuralChanges() {
        address adminContractAddress = accountIngressContract.getContractAddress(accountIngressContract.ADMIN_CONTRACT());
        require(Admin(adminContractAddress).isVotedForStructuralChanges(msg.sender), "Not permitted");
        _;
    }

    constructor (AccountIngress _accountIngressContract) public {
        accountIngressContract = _accountIngressContract;
        add(msg.sender);
    }

    // VERSION
    function getContractVersion() external view returns (uint) {
        return version;
    }

    // READ ONLY MODE
    function isReadOnly() external view returns (bool) {
        return readOnlyMode;
    }

    function enterReadOnly() external onlyVotedForStructuralChanges returns (bool) {
        require(readOnlyMode == false, "Already in read only mode");
        readOnlyMode = true;
        return true;
    }

    function exitReadOnly() external onlyVotedForStructuralChanges returns (bool) {
        require(readOnlyMode == true, "Not in read only mode");
        readOnlyMode = false;
        return true;
    }

    function transactionAllowed(
        address sender,
        address, // target
        uint256, // value
        uint256, // gasPrice
        uint256, // gasLimit
        bytes calldata // payload
    ) external view returns (bool) {
        if (accountPermitted(sender)) {
            return true;
        }
        if (isAuthorizedAdmin(sender)) {
            return true;
        }
        return false;
    }

    function accountPermitted(
        address _account
    ) public view returns (bool) {
        return exists(_account);
    }

    function addAccount(
        address account
    ) external onlyAdmin onlyOnEditMode returns (bool) {
        bool added = add(account);
        emit AccountAdded(added, account);
        return added;
    }

    function removeAccount(
        address account
    ) external onlyAdmin onlyOnEditMode returns (bool) {
        bool removed = remove(account);
        emit AccountRemoved(removed, account);
        return removed;
    }

    function getSize() external view returns (uint) {
        return size();
    }

    function getByIndex(uint index) external view returns (address account) {
        return allowlist[index];
    }

    function getAccounts() external view returns (address[] memory){
        return allowlist;
    }

    function addAccounts(address[] calldata accounts) external onlyAdmin returns (bool) {
        return addAll(accounts);
    }

    function isAuthorizedAdmin(address user) private view returns (bool) {
        address adminContractAddress = accountIngressContract.getContractAddress(accountIngressContract.ADMIN_CONTRACT());

        require(adminContractAddress != address(0), "Ingress contract must have Admin contract registered");
        return Admin(adminContractAddress).isAuthorized(user);
    }
}
