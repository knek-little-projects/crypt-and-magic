// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library BitMap {
    function isSet(uint8[] storage a, uint p) internal view returns (bool) {
        uint i = p / 8;
        uint j = 7 - p % 8;
        return ((a[i] >> j) & 1) == 1;
    }

    function set(uint8[] storage a, uint p) internal {
        uint i = p / 8;
        uint j = 7 - p % 8;
        uint x = 1 << j;
        a[i] = a[i] | uint8(x);
    }

    function unset(uint8[] storage a, uint p) internal {
        uint i = p / 8;
        uint j = 7 - p % 8;
        uint x = 1 << j;
        a[i] = a[i] & uint8(~x);
    }
}

library MemoryBitMap {
    function unset(uint8[] memory a, uint p) internal pure {
        uint i = p / 8;
        uint j = 7 - p % 8;
        uint x = 1 << j;
        a[i] = a[i] & uint8(~x);
    }
}

library Set {
    function remove(address[] storage a, address item) internal {
        for (uint i = 0; i < a.length; i++) {
            if (a[i] == item) {
                a[i] = a[a.length - 1];
                a.pop();
                return;
            }
        }
        revert("R");
    }
}

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

uint constant STEP_RIGHT = 0; // 0b00
uint constant STEP_DOWN = 1; // 0b01
uint constant STEP_LEFT = 2; // 0b10
uint constant STEP_UP = 3; // 0b11
uint constant STEP_VERTICAL = 1;

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

        if (hasObstacle(uint(startPosition))) {
            return startPosition;
        }
    }
}

contract Random {
    uint randomState;

    function random() internal returns (uint) {
        return uint(keccak256(abi.encodePacked(randomState++)));
    }
}

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

struct Player {
    uint position;
    uint nonce;
    uint damage;
    bool isActive;
}

abstract contract Players is Obstacles, RandomPosition {
    event PlayerAdded(address player, uint p);
    event PlayerRemoved(address player, uint p);
    event PlayerMoved(address player, uint steps);

    mapping(address => Player) public playerAddressToState;
    address[] public playerAddresses;

    using Set for address[];

    function getPlayerAddresses() public view returns (address[] memory) {
        return playerAddresses;
    }

    function teleportIn() external {
        Player storage player = playerAddressToState[msg.sender];

        require(!player.isActive);

        uint p = nextRandomPositionWithoutObstacle();
        player.isActive = true;
        player.position = p;
        playerAddresses.push(msg.sender);
        setObstacle(p);

        emit PlayerAdded(msg.sender, p);
    }

    function teleportOut() external {
        Player storage player = playerAddressToState[msg.sender];

        require(player.isActive);

        player.isActive = false;
        playerAddresses.remove(msg.sender);
        unsetObstacle(player.position);

        emit PlayerRemoved(msg.sender, player.position);
    }
}

contract Map is Obstacles, Skeletons, Players {
    uint public immutable version = 1;

    constructor(uint256 _N, uint8[] memory _obstacles, uint256 _maxSkeletons) {
        require((_N * _N) / 8 == _obstacles.length, "N");

        N = _N;
        obstacles = _obstacles;
        maxSkeletons = _maxSkeletons;

        spawnSkeletons();
    }

    function getFullState()
        external
        view
        returns (
            uint8[] memory obstacles_,
            address[] memory skeletonAddresses_,
            address[] memory playerAddresses_,
            Skeleton[] memory skeletons_,
            Player[] memory players_
        )
    {
        obstacles_ = obstacles;
        skeletonAddresses_ = skeletonAddresses;
        playerAddresses_ = playerAddresses;

        skeletons_ = new Skeleton[](skeletonAddresses_.length);
        for (uint256 i = 0; i < skeletonAddresses_.length; i++) {
            skeletons_[i] = skeletonAddressToState[skeletonAddresses_[i]];
        }

        players_ = new Player[](playerAddresses_.length);
        for (uint256 i = 0; i < playerAddresses_.length; i++) {
            players_[i] = playerAddressToState[playerAddresses_[i]];
        }

        // Unset obstacles based on skeletons and players
        for (uint256 i = 0; i < skeletons_.length; i++) {
            MemoryBitMap.unset(obstacles_, skeletons_[i].position);
        }

        for (uint256 i = 0; i < players_.length; i++) {
            MemoryBitMap.unset(obstacles_, players_[i].position);
        }
    }

    // function move(uint nonce, uint stepsToDo) public {
    //     require(nonce == characterAddressToNonce[msg.sender], "Nonce");

    //     CharState storage player = characterAddressToCharacterState[msg.sender];
    //     CharState memory skeletons = new CharState[](skeletonAddresses.length);
    //     int currentPosition = int(player.position);

    //     uint stepsDone = 0;
    //     for (uint i = 0; i < 128; i++) {
    //         uint step = stepsToDo & 3;

    //         int nextPosition = getPositionDelta(currentPosition, step);
    //         if (nextPosition == currentPosition) {
    //             break;
    //         }

    //         currentPosition = nextPosition;
    //         stepsToDo = stepsToDo >> 2;
    //         stepsDone = (stepsDone << 2) | step;

    //         // skeletons move
    //         for (uint j = 0; j < skeletonPositions.length; j++) {}
    //     }

    //     player.position = uint(currentPosition);

    //     emit Movement(msg.sender, stepsDone);
    // }
}
