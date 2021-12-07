// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IFlightSuretyData {
    function isOperational() external view returns(bool);
    function setOperatingStatus(bool) external;
    function registerAirline(address airline) external;
}