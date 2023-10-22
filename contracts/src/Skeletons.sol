// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libs.sol";
import "./consts.sol";
import "./Obstacles.sol";
import "./RandomPosition.sol";
import "./Life.sol";
import "./Movement.sol";

struct Skeleton {
    uint position;
    uint step;
}

abstract contract Skeletons is Obstacles, RandomPosition, Life {
    event SkeletonAdded(address skeleton, uint p);
    event SkeletonRemoved(address skeleton, uint p);
    event SkeletonMoved(address skeleton, uint p);

    mapping(address => Skeleton) public skeletonAddressToState;
    address[] public skeletonAddresses;
    uint256 public maxSkeletons;

    uint256 internal skeletonRespawnTime;
    uint256 internal startRespawnCountdown;

    uint160 lastSkeletonId;

    using Set for address[];

    function getSkeletonAddresses() public view returns (address[] memory) {
        return skeletonAddresses;
    }

    function isSkeletonAddress(address potentialSkeletonAddress) internal view returns (bool) {
        return uint160(potentialSkeletonAddress) <= lastSkeletonId;
    }

    // function _getSkeletonNextPosition(int currentPosition, uint stepToDo) internal view returns (int nextPosition, uint stepDone) {
    //     for (uint i=0; i<4; i++) {
    //         stepDone = (stepToDo + i) % 4;
    //         nextPosition = getNextPositionAfterStep(currentPosition, stepDone);
    //         if (nextPosition != currentPosition) {
    //             break;
    //         }
    //     }
    // }

    // function _moveSkeleton(address skeletonAddress) internal {
    //     Skeleton storage skeleton = skeletonAddressToState[skeletonAddress];

    //     int currentPosition = int(skeleton.position);
    //     (int nextPosition, uint step) = _getSkeletonNextPosition(currentPosition, skeleton.step);
    // }

    function _addSkeleton(uint p) internal {
        require(!hasObstacle(p));

        address skeletonAddress = address(++lastSkeletonId);

        skeletonAddressToState[skeletonAddress] = Skeleton({position: p, step: STEP_RIGHT});
        skeletonAddresses.push(skeletonAddress);
        setObstacle(p);

        emit SkeletonAdded(skeletonAddress, p);
    }

    function spawnSkeletons() public {
        startRespawnCountdown = 0;
        while (skeletonAddresses.length < maxSkeletons) {
            _addSkeleton(nextRandomPositionWithoutObstacle());
        }
    }

    function isTimeToSkeletonRespawn() internal view returns (bool) {
        return startRespawnCountdown != 0 && startRespawnCountdown + skeletonRespawnTime < block.timestamp;
    }

    function killSkeleton(address skeletonAddress) internal runLifeAfterwards {
        skeletonAddresses.remove(skeletonAddress);
        uint p = skeletonAddressToState[skeletonAddress].position;
        unsetObstacle(p);
        delete skeletonAddressToState[skeletonAddress];

        if (startRespawnCountdown == 0) {
            startRespawnCountdown = block.timestamp;
        }

        emit SkeletonRemoved(skeletonAddress, p);
    }
}
