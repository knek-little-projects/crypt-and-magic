// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Obstacles.sol";
import "./consts.sol";

abstract contract Movement is Obstacles {
    function getStepDelta(uint step) internal view returns (int) {
        if (step == STEP_UP) {
            return -1;
        } else if (step == STEP_DOWN) {
            return 1;
        } else if (step == STEP_LEFT) {
            return -int(N);
        } else if (step == STEP_RIGHT) {
            return int(N);
        } else {
            revert();
        }
    }

    function isOutside(
        int startPosition,
        uint step,
        int nextPosition
    ) internal view returns (bool) {
        if (step & STEP_VERTICAL == 1) {
            if (startPosition / int(N) != nextPosition / int(N)) {
                return true;
            }
        } else {
            if (nextPosition < 0) {
                return true;
            }
            if (uint(nextPosition) >= N * N) {
                return true;
            }
        }
        return false;
    }

    function getNextPositionAfterStep(
        int startPosition,
        uint step
    ) internal view returns (int nextPosition) {
        nextPosition = startPosition + getStepDelta(step);

        if (isOutside(startPosition, step, nextPosition)) {
            return startPosition;
        }

        if (hasObstacle(uint(nextPosition))) {
            return startPosition;
        }
    }
}
