pragma solidity 0.5.9;

import "./AccountRulesProxy.sol";
import "./AccountRulesList.sol";
import "./AccountIngress.sol";
import "./Admin.sol";

import "./AccountRulesProxy.sol";
import "./AccountRulesList.sol";
import "./ContractRulesAdminProxy.sol";

contract AccountRules is
    AccountRulesProxy,
    AccountRulesList,
    ContractRulesAdminProxy
{
    // Porém, assumindo que um contrato tenha que ser interrompido temporariamente para averiguação,
    // é possível que alguns administradores do contrato (diferente dos admins do próprio permissionamento)
    // precisem manter o direito de invocá-lo.
    // Desta forma,
    //  para cada endereço de contrato proibido,
    //  opcionalmente, pode haver um conjunto (novamente, você decide que tipo de estrutura usar) de endereços que, sim, podem invocá-los, mesmo durante seu bloqueio.
    // Estes administradores de contrato não são gerais.
    //      Para cada contrato,
    //          há um conjunto (possivelmente vazio) de administradores. Não confundir com os administradores do permissionamento controlados pelo Admin.sol!
    // Assim, após verificar se o sender está permissionado (conforme o código atual),
    // o transactionAllowed deve verificar se o target está entre os contratos bloqueados.
    // Se não está bloqueado, libera a transação.
    // Se o target está bloqueado, mas o sender é um dos administradores do contrato, também libera a transação.
    // Em caso contrário (target bloqueado e sender não é administrador do contrato), bloqueia a transação, retornando false.

    // white list of targets
    mapping(address => address[])  contractAdmins;

    // black list of targets
    address[] blockedTargets;

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
        address adminContractAddress = ingressContract.getContractAddress(
            ingressContract.ADMIN_CONTRACT()
        );

        require(
            adminContractAddress != address(0),
            "Ingress contract must have Admin contract registered"
        );
        require(
            Admin(adminContractAddress).isAuthorized(msg.sender),
            "Sender not authorized"
        );
        _;
    }

    constructor(AccountIngress _ingressContract) public {
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
        address _contract, // target
        uint256, // value
        uint256, // gasPrice
        uint256, // gasLimit
        bytes memory // payload
    ) public view returns (bool) {
        if (accountPermitted(sender)) {
            if (isContractAdmin(_contract, sender)) {
                return true;
            } else if (!isBlocked(_contract)) {
                    return true;
            }
        }
        return false;
    }

    function accountPermitted(address _account) public view returns (bool) {
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

    function getAccounts() public view returns (address[] memory) {
        return allowlist;
    }

    function addAccounts(
        address[] memory accounts
    ) public onlyAdmin returns (bool) {
        return addAll(accounts, msg.sender);
    }

    function blockContract(address _contract) public onlyAdmin onlyOnEditMode {
        if (!isBlocked(_contract)) {
            blockedTargets.push(_contract);
        }
    }

    function unblockContract(
        address _contract
    ) public onlyAdmin onlyOnEditMode {
        //if (!isContractAdmin(_contract, msg.sender)) {
        //    revert("Sender is not an admin for this contract");
        //}
        // remove _contract from blockedTargets
        for (uint i = 0; i < blockedTargets.length; i++) {
            if (blockedTargets[i] == _contract) {
                for (uint j = i; j < blockedTargets.length - 1; j++) {
                    blockedTargets[j] = blockedTargets[j + 1];
                }
                delete blockedTargets[blockedTargets.length - 1];
                blockedTargets.length--;
                break;
            }
        }
    }

    function isBlocked(address _contract) public view returns (bool) {
        // return true if _contract is in blockedTargets
        for (uint i = 0; i < blockedTargets.length; i++) {
            if (blockedTargets[i] == _contract) {
                return true;
            }
        }
        return false;
    }

    function addContractAdmin(
        address _contract,
        address _admin
    ) public onlyAdmin onlyOnEditMode {
        if (!isBlocked(_contract)) {
           revert("Contract is not blocked");
           // return;
        }
        //if (isBlocked(_contract) && !isContractAdmin(_contract, msg.sender)) {
        //    //revert("Sender is not an admin for this blocked contract");
        //    return;
        //}
        if (isContractAdmin(_contract, _admin)) {
            //revert("Already admin for this contract");
            return;
        }
        contractAdmins[_contract].push(_admin);
    }

    function removeContractAdmin(
        address _contract,
        address _admin
    ) public onlyAdmin onlyOnEditMode {
        //if (!isContractAdmin(_contract, msg.sender)) {
        //    revert("Sender is not an admin for this contract");
        //    //return;
        //}
        if (!isContractAdmin(_contract, _admin)) {
           revert("Not an admin for this contract");
           //return;
        }
        address[] storage admins = contractAdmins[_contract];
        for (uint i = 0; i < admins.length; i++) {
            if (admins[i] == _admin) {
                for (uint j = i; j < admins.length - 1; j++) {
                    admins[j] = admins[j + 1];
                }
                delete admins[admins.length - 1];
                admins.length--;
                break;
            }
        }
    }

    function isContractAdmin(
        address _contract,
        address _admin
    ) public view returns (bool) {
        address[] memory admins = contractAdmins[_contract];
        for (uint i = 0; i < admins.length; i++) {
            if (admins[i] == _admin) {
                return true;
            }
        }
        return false;
    }
}
