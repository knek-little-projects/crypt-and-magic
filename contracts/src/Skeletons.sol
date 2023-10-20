// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libs.sol";
import "./consts.sol";
import "./Obstacles.sol";
import "./RandomPosition.sol";

struct Skeleton {
    uint position;
    uint step;
}

abstract contract Skeletons is Obstacles, RandomPosition {
    event SkeletonAdded(address skeleton, uint p);
    event SkeletonRemoved(address skeleton, uint p);

    mapping(address => Skeleton) public skeletonAddressToState;
    address[] public skeletonAddresses;
    uint256 public maxSkeletons;
    uint160 lastSkeletonId;

    using Set for address[];

    function getSkeletonAddresses() public view returns (address[] memory) {
        return skeletonAddresses;
    }

    function _addSkeleton(uint p) internal {
        require(!hasObstacle(p));

        address skeletonAddress = address(++lastSkeletonId);

        skeletonAddressToState[skeletonAddress] = Skeleton({position: p, step: STEP_RIGHT});
        skeletonAddresses.push(skeletonAddress);
        setObstacle(p);

        emit SkeletonAdded(skeletonAddress, p);
    }

    function spawnSkeletons() public {
        while (skeletonAddresses.length < maxSkeletons) {
            _addSkeleton(nextRandomPositionWithoutObstacle());
        }
    }

    function killSkeleton(address skeletonAddress) internal {
        skeletonAddresses.remove(skeletonAddress);
        uint p = skeletonAddressToState[skeletonAddress].position;
        unsetObstacle(p);
        delete skeletonAddressToState[skeletonAddress];
        emit SkeletonRemoved(skeletonAddress, p);
    }
}