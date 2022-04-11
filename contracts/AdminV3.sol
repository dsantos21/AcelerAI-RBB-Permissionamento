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
import "./Multisig.sol";


contract Adminv3 is AdminProxy, AdminList { //Trocar para Admin

    NodeIngress private nodeIngressContract;
    AccountIngress private accountIngressContract;
    
    address private votedForStructuralChanges;

    string private constant ADD_ADMIN = "ADD_ADMIN";
    string private constant REMOVE_ADMIN = "REMOVE_ADMIN";
    string private constant VOTE_FOR_STRUCTURAL_CHANGES = "VOTE_FOR_STRUCTURAL_CHANGES";

    
    event Executed( // criar para o node e criar um gethash para o node também
        string opName,
        address payload,
        address lastSender,
        bytes32 hash
    );


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

    modifier multisig(string opName, address payload) {
        bytes32 hash = getHash(opName, payload);
        if(voteAndVerify(hash)){ // do multisig
            _;
            deleteHash(hash); // do multisig
            emit Executed(opName, payload, msg.sender, hash);
        }
    }

    constructor () {
        add(msg.sender);
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

    function isAuthorized (address _address) public override view returns (bool) {
        if (msg.sender == address(accountIngressContract) || msg.sender == address(nodeIngressContract)){
            return isVotedForStructuralChanges(_address);
        }
        return exists(_address);
    }
    
    function isVotedForStructuralChanges (address _address) public view returns (bool) { //haverá método com votação para zerar esse endereço?
        return _address == votedForStructuralChanges;
    }

    function voteForStructuralChanges (address _address) external onlyAdmin isAdmin(_address) multisig(VOTE_FOR_STRUCTURAL_CHANGES, _address) {
        votedForStructuralChanges = _address;
    }
    
    function revokeAccessToStructuralChanges() public {
        require(isVotedForStructuralChanges(msg.sender), "Not permitted");
        votedForStructuralChanges = address(0);
    }

    function getHash(string memory opName, address payload) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(opName, payload));
    }

    function addAdmin(address _address) external onlyAdmin multisig(ADD_ADMIN, _address) {
        if (msg.sender == _address) {
            emit AdminAdded(false, _address, "Adding own account as Admin is not permitted");
        } else {
            bool result = add(_address);
            string memory message = result ? "Admin account added successfully" : "Account is already an Admin";
            emit AdminAdded(result, _address, message);
        }
    }

    function removeAdmin(address _address) external onlyAdmin atLeastOneAdmin multisig(REMOVE_ADMIN, _address) {
        if (isVotedForStructuralChanges(_address)){
            votedForStructuralChanges = address(0);
        }
        bool removed = remove(_address);
        emit AdminRemoved(removed, _address);
    }

    function getAdmins() external view returns (address[] memory){
        return allowlist; // mythx-disable-line SWC-128
    }

    // Remover?
    // function addAdmins(address[] calldata accounts) external onlyAdmin multisigTx(keccak256(abi.encodePacked(ADD_ADMINS, accounts))) {
        // addAll(accounts);
    // }
}