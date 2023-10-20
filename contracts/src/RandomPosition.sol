// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Random.sol";
import "./Obstacles.sol";

abstract contract RandomPosition is Random, Obstacles {
    function nextRandomPositionWithoutObstacle() public returns (uint) {
        uint r = random();
        for (uint i = 0; i < N * N; i++) {
            uint p = (i + r) % (N * N);
            if (!hasObstacle(p)) {
                return p;
            }
        }
        revert();
    }
}
