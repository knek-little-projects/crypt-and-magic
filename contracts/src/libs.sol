// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library BitMap {
    function isSet(uint8[] storage a, uint p) internal view returns (bool) {
        uint i = p / 8;
        uint j = 7 - (p % 8);
        return ((a[i] >> j) & 1) == 1;
    }

    function set(uint8[] storage a, uint p) internal {
        uint i = p / 8;
        uint j = 7 - (p % 8);
        uint x = 1 << j;
        a[i] = a[i] | uint8(x);
    }

    function unset(uint8[] storage a, uint p) internal {
        uint i = p / 8;
        uint j = 7 - (p % 8);
        uint x = 1 << j;
        a[i] = a[i] & uint8(~x);
    }
}

library MemoryBitMap {
    function isSet(uint8[] memory a, uint p) internal pure returns (bool) {
        uint i = p / 8;
        uint j = 7 - (p % 8);
        return ((a[i] >> j) & 1) == 1;
    }

    function set(uint8[] memory a, uint p) internal pure {
        uint i = p / 8;
        uint j = 7 - (p % 8);
        uint x = 1 << j;
        a[i] = a[i] | uint8(x);
    }

    function unset(uint8[] memory a, uint p) internal pure {
        uint i = p / 8;
        uint j = 7 - (p % 8);
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
