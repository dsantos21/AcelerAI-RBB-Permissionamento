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

    mapping (bytes32 => mapping (address => uint128)) private hasVoted; // 1-based indexing. 0 means non-existent
    mapping (bytes32 => address[]) private addressList;
    //mapping (bytes32 => uint128) private votes;

    NodeIngress private nodeIngressContract;
    AccountIngress private accountIngressContract;

    //enum TransactionStatus { NONEXISTENT, OPENTOVOTE, CLOSEDTOVOTE }
    //uint private transactionCount;

    enum Operation { ADD_ADMIN, REMOVE_ADMIN, CHANGE_REQUIREMENT, VOTE_FOR_STRUCTURAL_CHANGES }
    // string private constant ADD_ADMIN = "ADD_ADMIN";
    // string private constant REMOVE_ADMIN = "REMOVE_ADMIN";

    // string private constant ADD_ADMINS = "ADD_ADMINS"; //é o caso?

    // string private constant CHANGE_REQUIREMENT = "CHANGE_REQUIREMENT";

    address private votedForStructuralChanges;

    bool private qualifiedMajority; // true: qualified majority, greater than 2/3; false: simple majority, greater than 50%;
    // uint128 private countRequirementChanges;

    event Voted(
        bytes32 hash,
        bool voted
    );

    event VoteCanceled(
        bytes32 hash,
        bool voteCanceled
    );

    modifier multisigTx(bytes32 hash) {
        if(voteAndVerify(hash, msg.sender)){
            _;
            deleteHash(hash);
        }
    }

    modifier onlyAdmin() {
        require(isAuthorized(msg.sender), "Sender not authorized");
        _;
    }

    modifier atLeastOneAdmin() {
        require(size() == 1, "There must be at least 1 administrator");
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
        nodeIngressContract = _nodeIngressContract; //5 end migration?
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
    
    function isVotedForStructuralChanges (address _address) public view returns (bool) {
        return _address == votedForStructuralChanges;
    }

    function voteForStructuralChanges (address _address) external onlyAdmin isAdmin(_address) multisigTx(keccak256(abi.encodePacked(Operation.VOTE_FOR_STRUCTURAL_CHANGES, _address))) {
        votedForStructuralChanges = _address;
    }

    function addAdmin(address _address) external onlyAdmin multisigTx(keccak256(abi.encodePacked(Operation.ADD_ADMIN, _address))) {
        if (msg.sender == _address) {
            emit AdminAdded(false, _address, "Adding own account as Admin is not permitted");
        } else {
            bool result = add(_address);
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            emit AdminAdded(result, _address, message);
        }
    }

    function removeAdmin(address _address) external onlyAdmin atLeastOneAdmin multisigTx(keccak256(abi.encodePacked(Operation.REMOVE_ADMIN, _address))) {
        if (isVotedForStructuralChanges(_address)){
            votedForStructuralChanges = address(0);
        }
        bool removed = remove(_address);
        emit AdminRemoved(removed, _address);
    }

    function getAdmins() external view returns (address[] memory){
        return allowlist; // mythx-disable-line SWC-128
    }

    function getAddressListLength(bytes32 hash) public view returns (uint128){
        return uint128(addressList[hash].length);
    }

    // Remover?
    // function addAdmins(address[] calldata accounts) external onlyAdmin multisigTx(keccak256(abi.encodePacked(ADD_ADMINS, accounts))) {
        // addAll(accounts);
    // }

    function changeMajorityRequirement() external onlyAdmin multisigTx(keccak256(abi.encodePacked(Operation.CHANGE_REQUIREMENT, qualifiedMajority))) {
        qualifiedMajority = !qualifiedMajority;
    }

    function isMajorityAchieved(uint128 _votes) private view returns (bool){
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
    function voteAndVerify(bytes32 hash, address sender) onlyAdmin public returns (bool) {
        if (hasVoted[hash][sender] == 0) { // 1-based index
            addressList[hash].push(sender);
            hasVoted[hash][sender] = uint128(addressList[hash].length);
            //votes[hash]++;
            emit Voted(hash, true);
        } 
        else {
            emit Voted(hash, false);
        }//                       votes[hash]
        return isMajorityAchieved(uint128(addressList[hash].length));
    }

    function cancelVote(bytes32 hash) onlyAdmin external {
        address sender = msg.sender;
        uint128 index = hasVoted[hash][sender];

        if (index > 0 && index <= addressList[hash].length) {
            // move last item into index being vacated (unless we are dealing with last index)
            if (index != addressList[hash].length) {
                address lastAddress = addressList[hash][addressList[hash].length - 1];
                addressList[hash][index - 1] = lastAddress;
                hasVoted[hash][lastAddress] = index;
            }

            // shrink array
            addressList[hash].pop();
            hasVoted[hash][sender] = 0;            
            //votes[hash]--;
            emit VoteCanceled(hash, true);
        }
        emit VoteCanceled(hash, false);
    }

    function deleteHash(bytes32 hash) onlyAdmin private {
        //votes[hash] = 0;
        for(uint256 i = 0; i < addressList[hash].length; i++){
            hasVoted[hash][addressList[hash][i]] = 0;
        }
        delete addressList[hash];
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