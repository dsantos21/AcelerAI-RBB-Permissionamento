pragma solidity 0.5.9;

import "./Admin.sol";

contract AccountAdmin is Admin 
{
    address public superAdmin;

    // Quarantine
    uint256 public quarantine;
    mapping(address => uint256) public adminQuarantine;

    // Voting
    struct Vote 
    {
        mapping(address => bool) voters;
        uint256 count;
        uint256 firstVoteTimestamp;
    }
    mapping(address => Vote) public votesFor;
    address[] public votedForSuperAdmin;

    mapping(address => Vote) public votesAgainst;

    enum QuorumType { MAJORITY, TWO_THIRDS, TWO_THIRDS_PLUS_ONE, FIXED }
    QuorumType public quorumType;
    uint256 public currentQuorum;
    uint256 public fixedQuorum;

    uint256 public electionDuration;
    

    modifier onlyAdmin() 
    {
        require(exists(msg.sender), "Sender is not an admin.");
        _;
    }

    modifier onlySuperAdmin()
    {
        require(isSuperAdmin(msg.sender), "Sender is not a super user.");
        _;
    }

    constructor() public 
    {
        super;
        setSuperAdmin(msg.sender);
        quorumType = QuorumType.MAJORITY;
//        fixedQuorum = 1;
        electionDuration = 3 days;
        quarantine = 2 days; 
    }

    function setSuperAdmin(address _address) private {
        superAdmin = _address;
    }

    function isSuperAdmin (address _address) public view returns (bool) 
    { 
        return _address == superAdmin;
    }

    function resignSuperAdmin() public onlySuperAdmin
    {
        setSuperAdmin(address(0));
    }

    /*
    * @dev: This function is used to add a new super user.
    * @param: _address: The address of the new super user.
    * @return: bool: Returns true if the super user was added successfully.
    * Essa função foi mantida com esse nome porque ela é usada pelo AccountIngress.sol
    * O AccountIngress é preloaded, logo não pode ser modificado. 
    * Note que essa função overrides a similar do Admin.sol. 
    */
    function isAuthorized(address _address) public view returns (bool) 
    {
        return isSuperAdmin(_address);
    }

    function isAuthorizedForAccountPermissioning(address _address) public view returns (bool) 
    {
        return exists(_address);
    }

    function addAdmin(address _address) public onlyAdmin returns (bool)
    {
        require(!isQuarantined(msg.sender), "Admin is still in quarantine.");
        require(!isQuarantined(_address), "Admin is still in quarantine.");

        bool added = super.addAdmin(_address);
        if (added){
            adminQuarantine[_address] = block.timestamp + quarantine;
            adminQuarantine[msg.sender] = block.timestamp + quarantine;
            adjustQuorum();
        }
        return added;
    }

    function removeAdmin(address _address) public onlyAdmin returns (bool) 
    {
        require(!isQuarantined(msg.sender), "Admin is still in quarantine.");
        require(!isQuarantined(_address), "Admin is still in quarantine.");

        bool removed = super.removeAdmin(_address);
        if (removed)
            adminQuarantine[_address] = block.timestamp + quarantine;
            adminQuarantine[msg.sender] = block.timestamp + quarantine;
            adjustQuorum();
        return removed;
    }

    function addAdmins(address[] memory accounts) public onlySuperAdmin returns (bool) {
        bool allAdded = super.addAdmins(accounts);
        adjustQuorum();
        return allAdded;
    }

    function setQuarantine(uint256 duration) public onlySuperAdmin {
        require(duration >= 1 days, "Quarantine duration must be at least 1 day.");
        quarantine = duration;
    }    

    function isQuarantined(address _address) public view returns (bool) {
        return adminQuarantine[_address] > block.timestamp;
    }    

    function setQuorumType(QuorumType _quorumType) public onlySuperAdmin 
    {
        quorumType = _quorumType;
        adjustQuorum();
    }

    function setFixedQuorumNumber(uint256 _fixedQuorum) public onlySuperAdmin 
    {
        require(quorumType == QuorumType.FIXED, "Quorum type is not fixed.");
        require(_fixedQuorum > 0, "Quorum must be greater than zero.");
        require(_fixedQuorum <= size(), "Quorum must be less than or equal to the number of admins.");

        fixedQuorum = _fixedQuorum;
        adjustQuorum();
    }

    function adjustQuorum() private 
    {
        if (quorumType == QuorumType.MAJORITY) {
            currentQuorum = (size() / 2) + 1;
        } else if (quorumType == QuorumType.TWO_THIRDS) {
            currentQuorum = (size() * 2 / 3);
        } else if (quorumType == QuorumType.TWO_THIRDS_PLUS_ONE) {
            currentQuorum = (size() * 2 / 3) + 1;
        } else if (quorumType == QuorumType.FIXED) {
            if (size() > fixedQuorum)
                currentQuorum = fixedQuorum;
            else
                currentQuorum = size();
        }
    }

    function setVoteDuration(uint256 duration) public onlySuperAdmin 
    {
        require(duration >= 1 days, "Vote duration must be at least 1 day.");
        electionDuration = duration;
    }

    function voteForSuperAdmin (address superAddr) public onlyAdmin returns (bool) {
        require(superAdmin == address(0), "There is already a super admin.");
        require(exists(superAddr), "This address is not an admin, so cannot be a super admin.");

        bool elected = vote(votesFor, superAddr);
        if (elected)
            setSuperAdmin(superAddr);
        return elected;
    }

    function revertVoteForSuperAdmin (address superAddr) public onlyAdmin  {
        require(superAdmin == address(0), "There is already a super admin, so there is not currently a voting process.");
        require(exists(superAddr), "This address is not an admin, so it was not voted.");

        revertVote(votesFor, superAddr);
    }

    function voteForRemovingSuperAdmin (address superAddr) public onlyAdmin {
        require(superAdmin != address(0), "There is no a super admin to be removed.");
        require(superAdmin == superAddr, "It is only possible to remove an address which is super admin.");

        bool removed = vote(votesAgainst, superAddr);
        if (removed)
            setSuperAdmin(address(0));
    }

    function revertVoteForRemovingSuperAdmin (address superAddr) public onlyAdmin {
        require(superAdmin != address(0), "There is no a super admin to be removed.");
        require(superAdmin == superAddr, "It is only possible to remove an address which is super admin.");

        revertVote(votesAgainst, superAddr);
    }

    function vote(mapping(address => Vote) storage votes, address superAddr) private returns(bool) {        
        require(!votes[superAddr].voters[msg.sender], "You've already voted for this proposal.");

        // If there is no current voting process or the voting process has expired, start a new one.
        if ((votes[superAddr].firstVoteTimestamp == 0) || (block.timestamp > votes[superAddr].firstVoteTimestamp + electionDuration)) {
            delete votes[superAddr];
            votes[superAddr].firstVoteTimestamp = block.timestamp;
        }

        if (block.timestamp <= votes[superAddr].firstVoteTimestamp + electionDuration) {
            votes[superAddr].voters[msg.sender] = true;
            votes[superAddr].count++;
            votedForSuperAdmin.push(superAddr);

            if (votes[superAddr].count >= currentQuorum) {
                resetAllVotings(votes);
                return true;
            }
        }
        return false;
    }

    function resetAllVotings(mapping(address => Vote) storage votes) private {
        for (uint i = 0; i < votedForSuperAdmin.length; i++) {
            delete votes[votedForSuperAdmin[i]];
        }
        delete votedForSuperAdmin;
    }

    function revertVote(mapping(address => Vote) storage votes, address superAddr) private {
        require(votes[superAddr].count > 0, "There is no current voting process.");
        require(votes[superAddr].voters[msg.sender], "You do not have a active vote for this proposal.");

        votes[superAddr].voters[msg.sender] = false;
        votes[superAddr].count--;
    }
}
