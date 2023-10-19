// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Map {
    event CastedSpell(address player, address target, uint spellId);
    event Movement(address player, uint steps);
    event SkeletonAdded(address skeleton, uint p);
    event PlayerAdded(address player, uint p);
    event PlayerRemoved(address player);

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
    mapping(address => CharState) public home;
    mapping(uint => address) public characterPositionToCharacterAddress;
    address[] public skeletonAddresses;
    address[] public characterAddresses;

    uint160 lastSkeletonId;

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
            _addSkeleton(nextRandomPositionWithoutObstacle());
        }
    }

    uint randomState;

    function _random() internal returns (uint) {
        return uint(keccak256(abi.encodePacked(randomState++)));
    }

    function nextRandomPositionWithoutObstacle() public returns (uint) {
        uint r = _random();
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

    function hasObstacle(uint p) public view returns (bool) {
        if (getObstacleBit(p)) {
            return true;
        }
        if (characterPositionToCharacterAddress[p] != address(0)) {
            return true;
        }
        return false;
    }

    function _addSkeleton(uint p) public {
        address skeletonAddress = address(++lastSkeletonId);

        characterAddressToCharacterState[skeletonAddress] = CharState({
            damage: 0,
            direction: 0,
            position: p,
            asset: 0
        });
        skeletonAddresses.push(skeletonAddress);
        characterAddresses.push(skeletonAddress);
        characterPositionToCharacterAddress[p] = skeletonAddress;

        emit SkeletonAdded(skeletonAddress, p);
    }

    function castSpell(uint spellId, address target) public {
        emit CastedSpell(msg.sender, target, spellId);
    }

    function move(uint steps) public {
        emit Movement(msg.sender, steps);
    }

    function isHome() internal view returns (bool) {
        return home[msg.sender].asset != 0;
    }

    function isOnMap() internal view returns (bool) {
        return characterAddressToCharacterState[msg.sender].asset != 0;
    }

    function teleportIn() external {
        uint p = nextRandomPositionWithoutObstacle();

        if (isHome()) {
            characterAddressToCharacterState[msg.sender] = home[msg.sender];
            characterAddressToCharacterState[msg.sender].position = p;
            delete home[msg.sender];
        } else {
            require(!isOnMap());
            characterAddressToCharacterState[msg.sender] = CharState({
                damage: 0,
                direction: 0,
                position: p,
                asset: 1
            });
        }

        characterAddresses.push(msg.sender);
        characterPositionToCharacterAddress[p] = msg.sender;
        emit PlayerAdded(msg.sender, p);
    }

    function teleportOut() external {
        require(!isHome() && isOnMap());
        CharState memory state = characterAddressToCharacterState[msg.sender];
        delete characterPositionToCharacterAddress[state.position];
        delete characterAddressToCharacterState[msg.sender];
        home[msg.sender] = state;
        for (uint i = 0; i < characterAddresses.length; i++) {
            if (characterAddresses[i] == msg.sender) {
                characterAddresses[i] = characterAddresses[characterAddresses.length - 1];
                characterAddresses.pop();
                break;
            }
        }
        emit PlayerRemoved(msg.sender);
    }
}
