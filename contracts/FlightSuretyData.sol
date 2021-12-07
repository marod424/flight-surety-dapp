// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    address private contractOwner;
    bool private operational = true;
    mapping(address => bool) private registeredAirlines;
    mapping(address => uint256) private authorizedContracts;

    constructor(address firstAirline) {
        contractOwner = msg.sender;
        registeredAirlines[firstAirline] = true;
    }

    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }
    
    function isOperational() public view returns(bool) {
        return operational;
    }

    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /**
    * @dev Sets contractAddress as an authorized calling contract
    */
    function authorizeContract(address contractAddress) external requireContractOwner {
        authorizedContracts[contractAddress] = 1;
    }

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that indicates if an airline is registered
    */      
    function isAirline(address airline) public view returns(bool) {
        return registeredAirlines[airline];
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    */   
    function registerAirline(address airline) external requireContractOwner {
        registeredAirlines[airline] = true;
    }

   /**
    * @dev Buy insurance for a flight
    */   
    function buy(address airline, string calldata flight, uint256 timestamp) external payable {
        // registeredAirlines[airline];
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees() external pure {
        // TODO
    }
    
    /**
     *  @dev Transfers eligible payout funds to insuree
    */
    function pay() external pure {
        // TODO
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    */   
    function fund() public payable {
        // TODO
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp)
        pure
        internal
        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    */
    fallback() external payable {
        fund();
    }

    /**
    * @dev Receive function for funding smart contract.
    */
    receive() external payable {
        fund();
    }
}

