// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Random {
    uint randomState;

    function random() internal returns (uint) {
        return uint(keccak256(abi.encodePacked(randomState++)));
    }
}
