// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Life {
    modifier life {
        _;
        runLife();
    }

    function runLife() public virtual;
}