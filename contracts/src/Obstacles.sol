// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libs.sol";

abstract contract Obstacles {
    uint public N;
    uint8[] public obstacles;
    using BitMap for uint8[];

    function hasObstacle(uint p) internal view returns (bool) {
        return obstacles.isSet(p);
    }

    function setObstacle(uint p) internal {
        obstacles.set(p);
    }

    function unsetObstacle(uint p) internal {
        obstacles.unset(p);
    }

    function getObstacles() external view returns (uint8[] memory) {
        return obstacles;
    }
}
