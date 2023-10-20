// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libs.sol";
import "./consts.sol";
import "./Obstacles.sol";
import "./RandomPosition.sol";

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