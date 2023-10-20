// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libs.sol";
import "./consts.sol";
import "./Obstacles.sol";
import "./RandomPosition.sol";
import "./Skeletons.sol";
import "./Players.sol";


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
