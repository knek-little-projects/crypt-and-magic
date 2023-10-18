// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Map {
    uint256 public immutable N;
    bytes public obstacles;

    struct Player {
        uint8 damage;
        uint8 direction;
    }

    mapping(address => Player) public players;
    address[] public skeletons;

    uint160 private lastSkeletonId;

    event CastedSpell(address player, address target, uint spellId);
    event Movement(address player, uint steps);
    event SkeletonAdded(address skeleton, uint i);
    event PlayerAdded(address player, uint i);

    constructor(uint256 _N, bytes memory _obstacles) {
        require((_N * _N) / 8 == _obstacles.length, "Data does not match expected NxN size");

        N = _N;
        obstacles = _obstacles;
    }

    function castSpell(uint spellId, address target) public {
        emit CastedSpell(msg.sender, target, spellId);
    }

    function move(uint steps) public {
        emit Movement(msg.sender, steps);
    }

    function addSkeleton(address skeleton, uint i) public {
        require(skeleton != address(0), "Invalid skeleton address");
        require(players[skeleton].damage == 0, "Skeleton already added");

        lastSkeletonId++;
        address skeletonAddress = address(uint160(skeleton) + lastSkeletonId);

        players[skeletonAddress] = Player({
            damage: 0,   // Assuming initial damage is 0. You can change it.
            direction: 0 // Assuming initial direction is 0. You can change it.
        });
        skeletons.push(skeletonAddress);

        emit SkeletonAdded(skeletonAddress, i);
    }

    function addPlayer(uint i) public {
        require(players[msg.sender].damage == 0, "Player already added");

        players[msg.sender] = Player({
            damage: 0,   // Assuming initial damage is 0. You can change it.
            direction: 0 // Assuming initial direction is 0. You can change it.
        });

        emit PlayerAdded(msg.sender, i);
    }
}
