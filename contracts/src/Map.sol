// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libs.sol";
import "./consts.sol";
import "./Obstacles.sol";
import "./RandomPosition.sol";
import "./Skeletons.sol";
import "./Players.sol";
import "./Movement.sol";

contract Map is Obstacles, Skeletons, Players, Movement {
    event SpellCasted(uint asset, address target);

    uint public immutable version = 1;

    constructor(
        uint256 _N,
        uint8[] memory _obstacles,
        uint256 _maxSkeletons,
        uint _skeletonRespawnTime
    ) {
        require((_N * _N) / 8 == _obstacles.length, "N");

        N = _N;
        obstacles = _obstacles;
        maxSkeletons = _maxSkeletons;
        skeletonRespawnTime = _skeletonRespawnTime;

        spawnSkeletons();
        teleportIn();
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

    event log();
    event logInt(int x);
    event logUint(uint x);

    function _findPlayerAt(uint p) internal view returns (address) {
        for (uint i = 0; i < playerAddresses.length; i++) {
            if (playerAddressToState[playerAddresses[i]].position == p) {
                return playerAddresses[i];
            }
        }
        return address(0);
    }

    function _skeletonAttack(address skeletonAddress) internal returns (bool) {
        Skeleton storage skeleton = skeletonAddressToState[skeletonAddress];

        int startPosition = int(skeleton.position);
        for (uint step = 0; step < 8; step++) {
            int nextPosition = startPosition + getStepDelta(step);

            if (isOutside(startPosition, step, nextPosition)) {
                continue;
            }

            if (!hasObstacle(uint(nextPosition))) {
                continue;
            }

            address player = _findPlayerAt(uint(nextPosition));
            if (player == address(0)) {
                continue;
            }

            emit SpellCasted(1, player);
            return true;
        }
        return false;
    }

    function _skeletonMove(address skeletonAddress) internal {
        Skeleton storage skeleton = skeletonAddressToState[skeletonAddress];

        int startPosition = int(skeleton.position);
        int nextPosition;
        uint step = skeleton.step;
        for (uint i = 0; i < 4; i++) {
            step = (step + i) % 4;
            nextPosition = getNextPositionAfterStep(startPosition, step);
            if (nextPosition != startPosition) {
                break;
            }
        }
        if (nextPosition != startPosition) {
            unsetObstacle(skeleton.position);
            skeleton.position = uint(nextPosition);
            setObstacle(skeleton.position);
            skeleton.step = step;
            emit SkeletonMoved(skeletonAddress, uint(nextPosition));
        }
    }

    function _moveSkeletons() internal {
        for (uint j = 0; j < skeletonAddresses.length; j++) {
            if (!_skeletonAttack(skeletonAddresses[j])) {
                _skeletonMove(skeletonAddresses[j]);
            }
        }
    }

    function move(uint nonce, uint stepsToDo) public onlyOnMap(msg.sender) runLifeAfterwards {
        Player storage player = playerAddressToState[msg.sender];
        require(player.isActive);
        require(nonce == player.nonce, "Nonce");

        int currentPosition = int(player.position);

        uint stepsDone = 0;
        uint maxSteps = stepsToDo >> 128;
        for (uint i = 0; i < maxSteps; i++) {
            uint step = stepsToDo & 3;

            int nextPosition = getNextPositionAfterStep(currentPosition, step);
            if (nextPosition == currentPosition) {
                break;
            }

            currentPosition = nextPosition;
            stepsToDo = stepsToDo >> 2;
            stepsDone = (stepsDone << 2) | step;

            unsetObstacle(player.position);
            player.position = uint(currentPosition);
            setObstacle(player.position);

            _moveSkeletons();
        }

        player.nonce++;
        emit PlayerMoved(msg.sender, stepsDone, player.position);
    }

    function castSpell(
        uint asset,
        address target
    ) external onlyOnMap(msg.sender) runLifeAfterwards {
        emit SpellCasted(asset, target);

        if (isSkeletonAddress(target)) {
            killSkeleton(target);
        } else {
            damagePlayer(target, 30);
        }
    }

    function runLife() public override {
        if (isTimeToSkeletonRespawn()) {
            spawnSkeletons();
        }
    }
}
