// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Map {
    uint256 public immutable N;
    uint256 public immutable maxSkeletons;
    bytes public obstacles;

    struct CharState {
        uint position;
        uint8 damage;
        uint8 asset;
        uint8 direction;
    }

    mapping(address => CharState) public characterAddressToCharacterState;
    mapping(uint => address) public characterPositionToCharacterAddress;
    address[] public skeletonAddresses;
    address[] public characterAddresses;

    uint160 lastSkeletonId;

    event CastedSpell(address player, address target, uint spellId);
    event Movement(address player, uint steps);
    event SkeletonAdded(address skeleton, uint i);
    event PlayerAdded(address player, uint i);

    constructor(uint256 _N, bytes memory _obstacles, uint256 _maxSkeletons) {
        require((_N * _N) / 8 == _obstacles.length, "Data does not match expected NxN size");

        N = _N;
        obstacles = _obstacles;
        maxSkeletons = _maxSkeletons;

        updateSkeletons();
    }

    function getSkeletonAddresses() public view returns (address[] memory) {
        return skeletonAddresses;
    }

    function getCharacterAddresses() public view returns (address[] memory) {
        return characterAddresses;
    }

    function updateSkeletons() public {
        while (skeletonAddresses.length < maxSkeletons) {
            _addSkeleton(getCurrentRandomPositionWithoutObstacle());
            randomState++;
        }
    }

    uint randomState;

    function getCurrentRandomNumber() public view returns (uint) {
        return uint(keccak256(abi.encodePacked(randomState)));
    }

    function getCurrentRandomPositionWithoutObstacle() public view returns (uint) {
        uint r = getCurrentRandomNumber();
        for (uint i = 0; i < N * N; i++) {
            uint p = (i + r) % (N * N);
            if (!hasObstacle(p)) {
                return p;
            }
        }
        revert();
    }

    function getObstacleBit(uint p) internal view returns (bool) {
        uint i = p / 8;
        uint j = p % 8;
        return ((uint8(obstacles[i]) >> (7 - j)) & 1) == uint8(1);
    }

    function hasObstacle(uint i) public view returns (bool) {
        if (getObstacleBit(i)) {
            return true;
        }
        if (characterPositionToCharacterAddress[i] != address(0)) {
            return true;
        }
        return false;
    }

    function _addSkeleton(uint i) public {
        address skeletonAddress = address(++lastSkeletonId);

        characterAddressToCharacterState[skeletonAddress] = CharState({
            damage: 0,
            direction: 0,
            position: i,
            asset: 0
        });
        skeletonAddresses.push(skeletonAddress);
        characterAddresses.push(skeletonAddress);
        characterPositionToCharacterAddress[i] = skeletonAddress;

        emit SkeletonAdded(skeletonAddress, i);
    }

    function castSpell(uint spellId, address target) public {
        emit CastedSpell(msg.sender, target, spellId);
    }

    function move(uint steps) public {
        emit Movement(msg.sender, steps);
    }

    function addPlayer(uint i) public {
        // require(characterAddressToCharacterState[msg.sender].damage == 0, "Player already added");
        // characterAddressToCharacterState[msg.sender] = CharState({damage: 0, direction: 0, position: i});
        // emit PlayerAdded(msg.sender, i);
    }
}
