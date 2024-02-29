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
        if (
            accountPermitted (sender) && (
                !isBlocked(target) || isContractAdmin(target, sender))
        ) {
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

    // Control blocked contracts with a set of authorized address that can run the blocked contract
    address[] private blockedContracts;
    mapping (address => address[]) private contractAdmins; 

    function unblockContract(address _contract) public onlyAdmin {
        for (uint i = 0; i < blockedContracts.length; i++) {
            if (blockedContracts[i] == _contract) {
                delete blockedContracts[i];
                break;
            }
        }
    }

    function blockContract(address _contract) public onlyAdmin {
        blockedContracts.push(_contract);
        // If no admins exists, initialize admins list with empty array
        if (contractAdmins[_contract].length == 0) {
            contractAdmins[_contract] = new address[](0);
        }
    }

    function isBlocked(address _contract) public view returns (bool) {
        for (uint i = 0; i < blockedContracts.length; i++) {
            if (blockedContracts[i] == _contract) {
                return true;
            }
        }
        return false;
    }

    function isContractAdmin(address _contract, address _admin) public view returns (bool) {
        for (uint i = 0; i < contractAdmins[_contract].length; i++) {
            if (contractAdmins[_contract][i] == _admin) {
                return true;
            }
        }
        return false;
    }

    /**
     * should not allow adding a contract admin if the contract is not blocked
     * @param _contract 
     * @param _admin 
     */
    function addContractAdmin(address _contract, address _admin) public onlyAdmin {
        require(!isContractAdmin(_contract, _admin), "Admin already exists for this contract");
        require(isBlocked(_contract), "Contract is not blocked");
        contractAdmins[_contract].push(_admin);
    }

    /**
     * should not allow removing a contract admin if the address is not an contract admin
     * @param _contract 
     * @param _admin 
     */
    function removeContractAdmin(address _contract, address _admin) public onlyAdmin {
        require(isContractAdmin(_contract, _admin), "Admin does not exists for this contract");
        for (uint i = 0; i < contractAdmins[_contract].length; i++) {
            if (contractAdmins[_contract][i] == _admin) {
                delete contractAdmins[_contract][i];
                break;
            }
        }
    }
}