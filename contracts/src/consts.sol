// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

uint constant STEP_RIGHT = 0; // 0b00
uint constant STEP_DOWN = 1; // 0b01
uint constant STEP_LEFT = 2; // 0b10
uint constant STEP_UP = 3; // 0b11
uint constant STEP_VERTICAL = 1;

uint constant STEP_RIGHT_UP = 4; //   100
uint constant STEP_RIGHT_DOWN = 5; // 101
uint constant STEP_LEFT_UP = 6; //    110
uint constant STEP_LEFT_DOWN = 7; //  111
uint constant STEP_DIAGONAL = 4;