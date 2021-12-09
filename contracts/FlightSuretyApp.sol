// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IFlightSuretyData.sol";

contract FlightSuretyApp {
    using SafeMath for uint256;

    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;
    
    IFlightSuretyData flightSuretyDataProxy;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }

    mapping(bytes32 => Flight) private flights;

    constructor(address dataContract) {
        contractOwner = msg.sender;
        flightSuretyDataProxy = IFlightSuretyData(dataContract);
    }

    function isOperational() external view returns(bool) {
        return flightSuretyDataProxy.isOperational();
    }

    function setOperatingStatus(bool mode) external {
        flightSuretyDataProxy.setOperatingStatus(mode);
    }

    function buyInsurance(address passenger, string calldata flight) external payable {
        flightSuretyDataProxy.buy{value: msg.value}(passenger, flight);
    }

    function fetchFlightStatus(string calldata flight) external {
        uint8 index = getRandomIndex(msg.sender);
        bytes32 key = keccak256(abi.encodePacked(index, flight));

        ResponseInfo storage oracleResponseInfo = oracleResponses[key];
        oracleResponseInfo.requester = msg.sender;
        oracleResponseInfo.isOpen = true;

        emit OracleRequest(index, flight);
    } 
 
   /**
    * @dev Called after oracle has updated flight status
    */  
    function processFlightStatus(string memory flight, uint8 statusCode) internal pure {
        // TODO
    }

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(string flight, uint8 status);

    event OracleReport(string flight, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, string flight);

    // Register an oracle with the contract
    function registerOracle() external payable {
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() view external returns(uint8[3] memory) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(uint8 index, string calldata flight, uint8 statusCode)
        external
    {
        require(
            oracles[msg.sender].indexes[0] == index || 
            oracles[msg.sender].indexes[1] == index || 
            oracles[msg.sender].indexes[2] == index, 
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(abi.encodePacked(index, flight)); 
        require(oracleResponses[key].isOpen, "Flight does not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(flight, statusCode);

        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
            emit FlightStatusInfo(flight, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(flight, statusCode);
        }
    }


    function getFlightKey(address airline, string calldata flight, uint256 timestamp)
        pure
        internal
        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account) internal returns(uint8[3] memory) {
        uint8[3] memory indexes;

        indexes[0] = getRandomIndex(account);
        indexes[1] = indexes[0];

        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];

        while (indexes[2] == indexes[0] || indexes[2] == indexes[1]) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   
