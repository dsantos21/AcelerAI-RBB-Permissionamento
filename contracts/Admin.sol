pragma solidity 0.5.9;

import "./AdminProxy.sol";
import "./AdminList.sol";
import "truffle/Console.sol";


contract Admin is AdminProxy, AdminList {
    
    mapping (address => uint) private quarentena;

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
        //console.log("add");
        //console.log(_address);
        bool senderQuarentena = (quarentena[msg.sender] != 0 && 
            ( block.timestamp < (quarentena[msg.sender]) ));
        require(!senderQuarentena, "Sender quarentine");

        if (msg.sender == _address) {
            emit AdminAdded(false, _address, msg.sender, block.timestamp, "Adding own account as Admin is not permitted");
            return false;
        } else {
            bool result = add(_address);
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            if(result){
                //adicionar admin adicionado e emissor em quarentena
                uint limiteQuarentena = block.timestamp + 1 days; 
                quarentena[_address] = limiteQuarentena;
                quarentena[msg.sender] = limiteQuarentena;
                console.log(limiteQuarentena);
            }
            emit AdminAdded(result, _address, msg.sender, block.timestamp, message);
            return result;
        }
    }

    function removeAdmin(address _address) public onlyAdmin notSelf(_address) returns (bool) {
        //console.log("remove");
        //console.log(msg.sender);
        //console.log(_address);
        bool senderQuarentena = (quarentena[msg.sender] != 0 && 
            ( block.timestamp < (quarentena[msg.sender]) ));
        require(!senderQuarentena, "Sender quarentine");
        bool removed = remove(_address);
        if(removed){
            //adicionar sender em quarentena
            uint limiteQuarentena = block.timestamp + 1 days; 
            quarentena[msg.sender] = limiteQuarentena;
            console.log(limiteQuarentena);
        }
        emit AdminRemoved(removed, _address, msg.sender, block.timestamp);
        return removed;
    }

    function getAdmins() public view returns (address[] memory){
        return allowlist;
    }

    function addAdmins(address[] memory accounts) public onlyAdmin returns (bool) {
        return addAll(accounts, msg.sender);
    }
}
