pragma solidity 0.5.9;

import "./AdminProxy.sol";
import "./AdminList.sol";


contract Admin is AdminProxy, AdminList {

    struct quarentena {
        address _address;
        uint expires; // timestamp
    }

    // list of quarentena
    quarentena[] public quarentenaList;

    address[] public quarentenaExpirados;

    /**
     * add an address to the quarentena list
     * @param _address address to be added to the quarentena list
     */
    function addQuarentena(address _address) public returns (bool) {
        uint length = quarentenaList.length;
        for (uint i = 0; i < length; i++) {
            if (quarentenaList[i]._address == _address) {
                // update
                quarentenaList[i].expires = now + 1 days;
                //sanitizeQuarentena();
                return true;
            }
        }
        // add
        quarentenaList.push(quarentena(_address, now + 1 days));
        //sanitizeQuarentena();
        return true;
    }

    /**
     * remove an address from the quarentena list
     * @param _address address to be removed from the quarentena list
     */
    function removeQuarentena(address _address) public returns (bool) {
        uint length = quarentenaList.length;
        for (uint i = 0; i < length; i++) {
            if (quarentenaList[i]._address == _address) {
                if (i < length - 1) {
                    quarentenaList[i] = quarentenaList[length - 1];
                }
                quarentenaList.length--;
                return true;
            }
        }
        return false;
    }    

    /**
     * checks if an address is in the quarentena list and feeds the list of expired quarentena
     * @param _address address to be checked
     */
    function emQuarentena (address _address) public view returns (bool) {
        uint length = quarentenaList.length;
        for (uint i = 0; i < length; i++) {
            // endereco em quarentena. eh o endereco informado?
            // verify if now is greater than the date of the quarentena
            if (quarentenaList[i]._address == _address) {
                if (quarentenaList[i].expires > now) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * sanitize quarentena pushing expired itens to quarentenaExpirados
     */

    function sanitizeQuarentena() public {
        uint length = quarentenaList.length;
        for (uint i = 0; i < length; i++) {
            // verify if now is greater than the date of the quarentena
            if (quarentenaList[i].expires < now) {
                quarentenaExpirados.push(quarentenaList[i]._address);
            }
        }
        purgeQuarentena();
    }

    /**
     * Remove expired quarentena from the list
     */
    function purgeQuarentena() public {
        uint length = quarentenaExpirados.length;
        for (uint i = 0; i < length; i++) {
            removeQuarentena(quarentenaExpirados[i]);
        }
        quarentenaExpirados.length=0;
    }


    modifier onlyAdmin() {
        require(isAuthorized(msg.sender), "Sender not authorized");
        _;
    }

    modifier notSelf(address _address) {
        require(msg.sender != _address, "Cannot invoke method with own account as parameter");
        _;
    }

    constructor() public {
        add(msg.sender);
    }

    function isAuthorized(address _address) public view returns (bool) {
        return exists(_address);
    }

    function addAdmin(address _address) public onlyAdmin returns (bool) {
        if ( emQuarentena(msg.sender)) {
            // raise exception
            revert("Sender is in quarentena");
        }
        if (msg.sender == _address) {
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "Adding own account as Admin is not permitted");
            return false;
        } else {
            bool result = add(_address);
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            emit AdminAdded(result, _address, msg.sender, block.timestamp, message);
            // add msg.sender to quarantine 
            addQuarentena(msg.sender);
            addQuarentena(_address);
            return result;
        }

    }

    function removeAdmin(address _address) public onlyAdmin notSelf(_address) returns (bool) {
        if ( emQuarentena(msg.sender) ){
            revert("Sender is in quarentena");
        }
        bool removed = remove(_address);
        emit AdminRemoved(removed, _address, msg.sender, block.timestamp);
        // add msg.sender to quarantine 
        addQuarentena(msg.sender);
        return removed;
    }

    function getAdmins() public view returns (address[] memory){
        return allowlist;
    }

    function addAdmins(address[] memory accounts) public onlyAdmin returns (bool) {
        return addAll(accounts, msg.sender);
    }
}
