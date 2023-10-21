// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libs.sol";
import "./consts.sol";
import "./Obstacles.sol";
import "./RandomPosition.sol";
import "./Life.sol";

struct Player {
    uint position;
    uint nonce;
    uint damage;
    bool isActive;
}

abstract contract Players is Obstacles, RandomPosition, Life {
    event PlayerAdded(address player, uint p);
    event PlayerRemoved(address player, uint p);
    event PlayerMoved(address player, uint stepsDone, uint newPosition);
    event PlayerKilled(address player);
    event PlayerDamaged(address player, uint damage);

    mapping(address => Player) public playerAddressToState;
    address[] public playerAddresses;

    modifier onlyOnMap(address playerAddress) {
        require(playerAddressToState[playerAddress].isActive, "OA");
        _;
    }

    modifier onlyFromHome(address playerAddress) {
        require(!playerAddressToState[playerAddress].isActive, "OI");
        _;
    }

    using Set for address[];

    function getPlayerAddresses() public view returns (address[] memory) {
        return playerAddresses;
    }

    function teleportIn() public onlyFromHome(msg.sender) runLifeAfterwards {
        Player storage player = playerAddressToState[msg.sender];

        uint p = nextRandomPositionWithoutObstacle();
        player.isActive = true;
        player.position = p;
        playerAddresses.push(msg.sender);
        setObstacle(p);

        emit PlayerAdded(msg.sender, p);
    }

    function teleportOut() external onlyOnMap(msg.sender) runLifeAfterwards {
        Player storage player = playerAddressToState[msg.sender];

        require(player.isActive);

        player.isActive = false;
        playerAddresses.remove(msg.sender);
        unsetObstacle(player.position);

        emit PlayerRemoved(msg.sender, player.position);
    }

    function nonce() external view returns (uint) {
        return playerAddressToState[msg.sender].nonce;
    }

    function damagePlayer(
        address playerAddress,
        uint damage
    ) internal onlyOnMap(msg.sender) onlyOnMap(playerAddress) {
        Player storage player = playerAddressToState[playerAddress];
        require(player.isActive);

        emit PlayerDamaged(playerAddress, damage);

        damage += uint(player.damage);
        if (damage < 100) {
            player.damage = damage;
        } else {
            unsetObstacle(player.position);
            playerAddresses.remove(playerAddress);
            delete playerAddressToState[playerAddress];
            emit PlayerKilled(playerAddress);
        }
    }
}
