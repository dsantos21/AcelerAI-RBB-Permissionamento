/*
 * Copyright ConsenSys AG.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
pragma solidity >=0.6.0 <0.9.0;

import "./AdminProxy.sol";
import "./AdminList.sol";
import "./NodeIngress.sol";
import "./AccountIngress.sol";


contract Admin is AdminProxy, AdminList {

    NodeIngress private nodeIngressContract;
    AccountIngress private accountIngressContract;

    // TODO: adicionar depois os métodos dos nodes
    string private constant ADD_ADMIN = "ADD_ADMIN";
    string private constant REMOVE_ADMIN = "REMOVE_ADMIN";

    string private constant ADD_ADMINS = "ADD_ADMINS"; // é o caso?

    string private constant CHANGE_REQUIREMENT = "CHANGE_REQUIREMENT";
    string private constant VOTE_FOR_STRUCTURAL_CHANGES = "VOTE_FOR_STRUCTURAL_CHANGES";

    mapping (bytes32 => address[]) private addressList;
    mapping (bytes32 => mapping (address => uint)) private hasVoted; // 1-based indexing. 0 means non-existent

    bytes32[] private hashesList;
    mapping (bytes32 => uint) private indexOfHashesList;

    address private votedForStructuralChanges;

    bool private qualifiedMajority; // true: qualified majority, greater than 2/3; false: simple majority, greater than 50%;

    event Voted(
        bytes32 hash,
        bool voted
    );

    event VoteCanceled(
        bytes32 hash,
        bool voteCanceled
    );
    
    event Executed(
        string opName,
        address payload,
        address lastSender,
        bytes32 hash
    );

    modifier multisigTx(string memory opName, address payload) {
        if(voteAndVerify(opName, payload, msg.sender)){
            _;
            finish(opName, payload, msg.sender);
        }
    }

    modifier onlyAdmin() {
        require(isAuthorized(msg.sender), "Sender not authorized");
        _;
    }

    modifier atLeastOneAdmin() {
        require(size() > 1, "There must be at least 1 administrator");
        _;
    }

    modifier isAdmin (address _address) {
        require(isAuthorized(_address), "The address given is not an admin");
        _;
    }

    constructor () {
        add(msg.sender);
        qualifiedMajority = true;
        votedForStructuralChanges = msg.sender;
    }

    function setAccountIngressContract (AccountIngress _accountIngressContract) external {
        require (isVotedForStructuralChanges(msg.sender), "Not permitted");
        accountIngressContract = _accountIngressContract;
    }

    function setNodeIngressContract (NodeIngress _nodeIngressContract) external {
        require (isVotedForStructuralChanges(msg.sender), "Not permitted");
        nodeIngressContract = _nodeIngressContract;
    }
    
    function revokeAccessToStructuralChanges() public {
        require(isVotedForStructuralChanges(msg.sender), "Not permitted");
        votedForStructuralChanges = address(0);
    }

    function isAuthorized (address _address) public override view returns (bool) {
        if (msg.sender == address(accountIngressContract) || msg.sender == address(nodeIngressContract)){
            return isVotedForStructuralChanges(_address);
        }
        return exists(_address);
    }
    
    function isVotedForStructuralChanges (address _address) public view returns (bool) { //haverá método com votação para zerar esse endereço?
        return _address == votedForStructuralChanges;
    }

    function voteForStructuralChanges (address _address) external onlyAdmin isAdmin(_address) multisigTx(VOTE_FOR_STRUCTURAL_CHANGES, _address) {
        votedForStructuralChanges = _address;
    }

    function addAdmin(address _address) external onlyAdmin multisigTx(ADD_ADMIN, _address) {
        if (msg.sender == _address) {
            emit AdminAdded(false, _address, "Adding own account as Admin is not permitted");
        } else {
            bool result = add(_address);
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            emit AdminAdded(result, _address, message);
        }
    }

    function removeAdmin(address _address) external onlyAdmin atLeastOneAdmin multisigTx(REMOVE_ADMIN, _address) {
        if (isVotedForStructuralChanges(_address)){
            votedForStructuralChanges = address(0);
        }
        bool removed = remove(_address);
        emit AdminRemoved(removed, _address);
    }

    function getAdmins() external view returns (address[] memory){
        return allowlist; // mythx-disable-line SWC-128
    }

    function getVotedForStructuralChanges() public view returns (address){
        return votedForStructuralChanges;
    }

    function getAddressListLength(bytes32 hash) public view returns (uint){
        return addressList[hash].length;
    }

    function getHashesList() public view returns (bytes32[] memory){
        return hashesList;
    }

    function getHash(string memory opName, address payload) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(opName, payload));
    }

    // Remover?
    // function addAdmins(address[] calldata accounts) external onlyAdmin multisigTx(keccak256(abi.encodePacked(ADD_ADMINS, accounts))) {
        // addAll(accounts);
    // }

    function changeMajorityRequirement() external onlyAdmin multisigTx(CHANGE_REQUIREMENT, address(0)) {
        qualifiedMajority = !qualifiedMajority;
    }

    function isMajorityAchieved(uint _votes) private view returns (bool){
        if (qualifiedMajority) {
            if (_votes > ((size() * 2)/3)) {
                return true;
            }
        } else if (_votes > (size() / 2)) {
            return true;
        }
        return false;
    }

    // Every time this method is called there will be a check if the majority has been reached,
    // as the majority can be reached after removing an administrator.
    // desta forma o usuario ao realizar uma chamada extra o usuário executa a ação pendente
    function voteAndVerify(string memory opName, address payload, address sender) onlyAdmin public returns (bool) { // TODO: colocar internal
        bytes32 hash = getHash(opName, payload);
        if (hasVoted[hash][sender] == 0) { // 1-based index
            if(getAddressListLength(hash) == 0) {
                indexOfHashesList[hash] = hashesList.length;
                hashesList.push(hash);
            }
            addressList[hash].push(sender);
            hasVoted[hash][sender] = getAddressListLength(hash);
            emit Voted(hash, true);
        } 
        else {
            emit Voted(hash, false);
        }
        return isMajorityAchieved(getAddressListLength(hash));
    }

    function cancelVote(bytes32 hash) onlyAdmin external {
        address sender = msg.sender;
        uint index = hasVoted[hash][sender];

        if (index > 0 && index <= getAddressListLength(hash)) {
            // move last item into index being vacated (unless we are dealing with last index)
            if (index != getAddressListLength(hash)) {
                address lastAddress = addressList[hash][getAddressListLength(hash) - 1];
                addressList[hash][index - 1] = lastAddress;
                hasVoted[hash][lastAddress] = index;
            }

            // shrink array
            addressList[hash].pop();
            hasVoted[hash][sender] = 0;
            emit VoteCanceled(hash, true);
            if(getAddressListLength(hash) == 0){
                deleteHash(hash);
            }
        }
        emit VoteCanceled(hash, false);
    }

    function deleteHash(bytes32 hash) private {
        for(uint i = 0; i < getAddressListLength(hash); i++){
            hasVoted[hash][addressList[hash][i]] = 0;
        }
        delete addressList[hash];

        uint index = indexOfHashesList[hash];
        uint lastPosition = hashesList.length - 1;
        if(index != lastPosition) {
            bytes32 lastHash = hashesList[lastPosition];
            hashesList[index] = lastHash;
            indexOfHashesList[lastHash] = index;
        }
        hashesList.pop();
        indexOfHashesList[hash] = 0;
    }

    function finish(string memory opName, address payload, address lastSender) onlyAdmin private {
        bytes32 hash = getHash(opName, payload);
        deleteHash(hash);
        emit Executed(opName, payload, lastSender, hash);
    }
}



// Multisig para:
// - Admin (ADD e REMOVE) // remove hash 
    // Para adicionar um admin eu devo verificar se já n existe, 
    // para poder não usar as constantes e evitar processamento desnecessário
    // análogo à remoção.
// - Node (ADD e REMOVE) // remove hash
// - ChangeMajority // remove hash
// - Ingress // remove hash


// implementar remoção, enum de operação me incomoda, resolver constantes do node e account_contract
// DUVIDA: haverá votação pra zerar (address(0)) o votedForStructuralChanges?
// alterar nome do hasvoted

// fazer a explicação, exemplificar

// separar código multisig em outro contrato?

// ALTERAR MIGRATION PARA DEFINIR AS CONSTANTES NODE_CONTRACT E ACCOUNT_CONTRACT NO CONSTRUTOR

// Tirar dúvida
// Hash collision
// Alterar nomes de métodos e variáveis
// Adicionar getters
// Explicar voteAndVerify
// Unir com o node
// Testes manuais e ajustes
// Testes automáticos e ajustes