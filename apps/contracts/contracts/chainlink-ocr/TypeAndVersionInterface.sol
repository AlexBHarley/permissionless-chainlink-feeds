// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

abstract contract TypeAndVersionInterface {
    function typeAndVersion() external pure virtual returns (string memory);
}
