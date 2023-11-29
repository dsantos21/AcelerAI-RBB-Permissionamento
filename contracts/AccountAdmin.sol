pragma solidity 0.5.9;

import "./AdminProxy.sol";
import "./Admin.sol";


contract AccountAdmin is Admin 
{
    address public superAdmin;

    struct Vote 
    {
        mapping(address => bool) voters;
        uint256 count;
        uint256 lastVoteTimestamp;
    }

    uint256 public voteDuration;

    enum QuorumType { MAJORITY, TWO_THIRDS, TWO_THIRDS_PLUS_ONE, FIXED };
    QuorumType public quorumType;
    uint256 public quorum;
    uint256 public fixedQuorum;
    
    mapping(address => Vote) public votesFor;
    address[] public votedForSuperAdmin;

    mapping(address => Vote) public votesAgainst;

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
        super();
        setSuperAdmin(msg.sender);
        quorumType = QuorumType.FIXED;
        fixedQuorum = 1; 
        voteDuration = 3 days;
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
    function isAuthorized(address _address) public view override returns (bool) 
    {
        return isSuperAdmin(_address);
    }

    function isAuthorizedForAccountPermissioning(address _address) public view returns (bool) 
    {
        return exists(_address);
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
        require(_fixedQuorum <= size(), "Quorum must be less than or equal to the number of admins.")

        fixedQuorum = _fixedQuorum;
        adjustQuorum();
    }

    function adjustQuorum() private 
    {
        if (quorumType == QuorumType.MAJORITY) {
            quorum = (size() / 2) + 1;
        } else if (quorumType == QuorumType.TWO_THIRDS) {
            quorum = (size() * 2 / 3);
        } else if (quorumType == QuorumType.TWO_THIRDS_PLUS_ONE) {
            quorum = (size() * 2 / 3) + 1;
        } else if (quorumType == QuorumType.FIXED) {
            if (size() > fixedQuorum)
                quorum = fixedQuorum;
            else
                quorum = size();
        }
    }

    function addAdmin(address _address) public override onlySuperAdmin returns (bool) 
    {
        bool added = super(_address);
        if (added)
            adjustQuorum();
        return added;
    }

    function addAdmins(address[] memory accounts) public override onlySuperAdmin returns (bool) {
        allAdded = super(accounts);
        adjustQuorum();
        return allAdded;
    }

    function removeAdmin(address _address) public override onlySuperAdmin returns (bool) 
    {
        removed = super(_address);
        if (removed)
            adjustQuorum();
        return removed;
    }

    function setVoteDuration(uint256 duration) public onlySuperAdmin 
    {
        require(duration >= 1 days, "Vote duration must be at least 1 day.");
        voteDuration = duration;
    }

    function voteForSuperAdmin (address superAddr) public onlyAdmin returns (bool) {
        require(superAdmin == address(0), "There is already a super admin.");
        require(exists(superAddr), "This address is not an admin, so cannot be a super admin.")

        bool elected = vote(votesFor, superAddr);
        if (elected)
            setSuperAdmin(superAddr);
        return elected;
    }

    function revertVoteForSuperAdmin (address superAddr) public onlyAdmin  {
        require(superAdmin == address(0), "There is already a super admin, so there is not currently a voting process.")
        require(exists(super), "This address is not an admin, so it was not voted.");
        require(votes[super].voters[msg.sender], "There is no vote to be reverted.");

        revertVote(votesFor, superAddr);
    }

    function voteForRemovingSuperAdmin (address superAddr) public onlyAdmin {
        require(superAdmin != address(0), "There is no a super admin to be removed.");
        require(superAdmin == superAddr, "It is only possible to remove an address which is super admin.");

        bool removed = vote(votesFor, superAddr);
        if (removed)
            setSuperAdmin(address(0));
        return removed;
    }

    function revertVoteForRemovingSuperAdmin (address superAddr) public onlyAdmin {
        require(superAdmin != address(0), "There is no a super admin to be removed.");
        require(superAdmin == superAddr, "It is only possible to remove an address which is super admin.");

        revertVote(votesAgainst, superAddr);
    }

    function vote(mapping(address => Vote) votes, address superAddr) private returns(bool) {        
        require(!votes[superAddr].voters[msg.sender], "You've already voted for this proposal.");

        if (block.timestamp == 0) || (block.timestamp > votes[superAddr].lastVoteTimestamp + voteDuration) {
            delete votes[superAddr];
            votes[superAddr].lastVoteTimestamp = block.timestamp;
        }

        if (block.timestamp <= votes[superAddr].lastVoteTimestamp + voteDuration) {
            votes[superAddr].voters[msg.sender] = true;
            votes[superAddr].count++;
            votedForSuperAdmin.push(superAddr);

            if (votes[superAddr].count >= quorum) {
                resetAllVotings(votes);
                return true;
            }
        }
        return false;
    }

    function resetAllVotings(mapping(address => Vote) votes) private {
        for (uint i = 0; i < votedForSuperAdmin.length; i++) {
            delete votes[votedForSuperAdmin[i]];
        }
        delete votedForSuperAdmin;
    }

    function revertVote(mapping(address => Vote) votes, address superAddr) private {
        require(votes[superAddr].count > 0, "There is no current voting process.");
        require(!votes[superAddr].voters[msg.sender], "You do not have a active vote for this proposal.");

        votes[superAddr].voters[msg.sender] = false;
        voters[superAddr].count--;
    }
}
