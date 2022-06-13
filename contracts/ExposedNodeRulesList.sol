pragma solidity 0.5.9;

import "./NodeRulesList.sol";


contract ExposedNodeRulesList is NodeRulesList {

    function _calculateKey(bytes32 _enodeHigh, bytes32 _enodeLow, bytes16 _ip, uint16 _port) external pure returns(uint256) {
        return calculateKey(_enodeHigh, _enodeLow, _ip, _port);
    }

    function _size() external view returns (uint256) {
        return size();
    }

    function _exists(bytes32 _enodeHigh, bytes32 _enodeLow, bytes16 _ip, uint16 _port) external view returns (bool) {
        return exists(_enodeHigh, _enodeLow, _ip, _port);
    }

    function _add(bytes32 _enodeHigh, bytes32 _enodeLow, bytes16 _ip, uint16 _port, NodeType _nodeType, bytes6 _geoHash, string calldata _name, string calldata _organization ) external returns (bool) {
        return add(_enodeHigh, _enodeLow, _ip, _port, _nodeType, _geoHash, _name, _organization);
    }

    function _remove(bytes32 _enodeHigh, bytes32 _enodeLow, bytes16 _ip, uint16 _port) external returns (bool) {
        return remove(_enodeHigh, _enodeLow, _ip, _port);
    }
}
