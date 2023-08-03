pragma solidity 0.5.9;

import "./AdminProxy.sol";


contract Ingress {
    // Contract keys
    bytes32 public RULES_CONTRACT = 0x72756c6573000000000000000000000000000000000000000000000000000000; // "rules"
    bytes32 public ADMIN_CONTRACT = 0x61646d696e697374726174696f6e000000000000000000000000000000000000; // "administration"

    // Registry mapping indexing
    mapping(bytes32 => address) internal registry;

    bytes32[] internal contractKeys;
    mapping (bytes32 => uint256) internal indexOf; //1 based indexing. 0 means non-existent

    struct Vote {
        uint256 lastVoteTimeStamp;
        mapping(address => bool) voters;
        uint256 count;
    }

    // Voting system mapping
    mapping(bytes32 => mapping(address => Vote)) private votes;
    event RegistryUpdated(
        address contractAddress,
        bytes32 contractName
    );

    function getContractAddress(bytes32 name) public view returns(address) {
        require(name > 0, "Contract name must not be empty.");
        return registry[name];
    }

    function getSize() public view returns (uint256) {
        return contractKeys.length;
    }

    function isAuthorized(address account) public view returns(bool) {
        if (registry[ADMIN_CONTRACT] == address(0)) {
            return true;
        } else {
            return AdminProxy(registry[ADMIN_CONTRACT]).isAuthorized(account);
        }
    }

    function setPrivateContractAddress(bytes32 name, address addr) private{
        if (indexOf[name] == 0) {
            indexOf[name] = contractKeys.push(name);
        }
        registry[name] = addr;
        emit RegistryUpdated(addr, name);

    }

    function setContractAddress(bytes32 name, address addr) public returns (bool) {
        //possui sistema de votação que se assemelha a uma eleição, no sentido de que existe um prazo para
        //uma votação. Se, em uma semana, a proposta não obtiver 3 votos, ela é excluída.
        require(name > 0, "Contract name must not be empty.");
        require(addr != address(0), "Contract address must not be zero.");
        require(isAuthorized(msg.sender), "Not authorized to update contract registry.");

        if (registry[ADMIN_CONTRACT] == address(0)) {
            setPrivateContractAddress(name, addr);
        }

        if (AdminProxy(registry[ADMIN_CONTRACT]).getAdminSize() < 3) {
            // Less than 3 admins, setting the address directly
            setPrivateContractAddress(name, addr);
        } else {
            if (votes[name][addr].lastVoteTimeStamp == 0) {
                votes[name][addr].lastVoteTimeStamp = block.timestamp;
            } else {
                if (block.timestamp > votes[name][addr].lastVoteTimeStamp + 7 days) {
                    delete votes[name][addr];
                    votes[name][addr].lastVoteTimeStamp = block.timestamp;
                } else {
                    votes[name][addr].lastVoteTimeStamp = block.timestamp;
                }
            }

            // Three or more admins exist, need voting mechanism
            require(!votes[name][addr].voters[msg.sender], "Already voted for this proposal");

            votes[name][addr].voters[msg.sender] = true; // record the vote
            votes[name][addr].count++;

            if(votes[name][addr].count >= 3) {
                setPrivateContractAddress(name, addr);

                // Reset the votes
                delete votes[name][addr];
            }
        }

        return true;
    }

    function getTotalVotes(bytes32 name, address addr) public view returns (uint256){
        uint256 totalVotes = votes[name][addr].count;
        return totalVotes;
    }
    function getAllContractKeys() public view returns(bytes32[] memory) {
        return contractKeys;
    }
}
