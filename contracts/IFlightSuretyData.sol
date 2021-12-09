// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IFlightSuretyData {
    function isOperational() external view returns(bool);
    function registerAirline(address airline) external;
    function buy(address passenger, string calldata flight) external payable;
    function creditInsurees(string calldata flight) external;
    function pay(address passenger, string calldata flight, uint256 amount) external payable;
}