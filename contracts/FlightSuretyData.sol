// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    uint256 constant public MULTI_PARTY_AIRLINE_MIN = 4;

    address private contractOwner;
    bool private operational = true;
    uint256 private isOperationalVoteCount = 0;
    mapping(address => uint256) private authorizedContracts;
    bool private testingMode = false;

    struct Airline {
        address addr;
        string name;
        bool isFunded;
        bool isRegistered;
        bool isOperationalDuplicateVote;
        bool registerAirlineDuplicateVote;
    }

    uint256 private registerAirlineVoteCount = 0;
    address[] private fundedAirlines = new address[](0);
    mapping(address => Airline) private airlines;
    mapping(address => uint256) private funds;
    mapping(bytes32 => uint256) private insurance;

    constructor(address _address) {
        contractOwner = msg.sender;
        _registerAirline(_address, "AirOne");
    }

    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireRegisteredAirline() {
        require(airlines[msg.sender].isRegistered, "Caller is not a registered airline");
        _;
    }

    modifier requireFundedAirline() {
        require(airlines[msg.sender].isFunded, "Caller is not a funded airline");
        _;
    }

    function authorizeContract(address contractAddress) external requireContractOwner {
        authorizedContracts[contractAddress] = 1;
    }
    
    function isOperational() external view returns(bool) {
        return operational;
    }

    function isRegisteredAirline(address _address) external view returns(bool) {
        return airlines[_address].isRegistered;
    }

    function isFundedAirline(address _address) external view returns(bool) {
        return airlines[_address].isFunded;
    }

    function setTestingMode(bool mode) external requireContractOwner {
        require(mode != testingMode, "New mode must be different from existing mode");
        testingMode = mode;
    }

    function setOperatingStatus(bool status) 
        external 
        requireRegisteredAirline 
        requireFundedAirline 
    {
        require(status != operational, "New status must be different from existing status");
        require(!airlines[msg.sender].isOperationalDuplicateVote, "Caller already voted");

        airlines[msg.sender].isOperationalDuplicateVote = true;
        isOperationalVoteCount = isOperationalVoteCount.add(1);

        if (isOperationalVoteCount >= fundedAirlines.length.div(2)) {
            operational = status;
            isOperationalVoteCount = 0;
            _resetIsOperationalDuplicateVotes();
        }
    }

    function _resetIsOperationalDuplicateVotes() private {
        for (uint8 i = 0; i < fundedAirlines.length; i++) {
            airlines[fundedAirlines[i]].isOperationalDuplicateVote = false;
        }
    }

    function registerAirline(address _address, string calldata _name) 
        external 
        requireIsOperational
        requireRegisteredAirline
        requireFundedAirline
    {
        require(!airlines[_address].isRegistered, "Airline is already registered");
        require(!airlines[msg.sender].registerAirlineDuplicateVote, "Caller already voted");

        if (fundedAirlines.length < MULTI_PARTY_AIRLINE_MIN) {
            _registerAirline(_address, _name);
        } else {
            airlines[msg.sender].registerAirlineDuplicateVote = true;
            registerAirlineVoteCount = registerAirlineVoteCount.add(1);

            if (registerAirlineVoteCount >= fundedAirlines.length.div(2)) {
                _registerAirline(_address, _name);
                _resetRegisterAirlineDuplicateVotes();
                registerAirlineVoteCount = 0;
            }
        }
    }

    function _registerAirline(address _address, string memory _name) private {
        airlines[_address] = Airline({
            addr: _address,
            name: _name,
            isFunded: false,
            isRegistered: true,
            isOperationalDuplicateVote: false,
            registerAirlineDuplicateVote: false
        });
    }

    function _resetRegisterAirlineDuplicateVotes() private {
        for (uint8 i = 0; i < fundedAirlines.length; i++) {
            airlines[fundedAirlines[i]].registerAirlineDuplicateVote = false;
        }
    }

    function fundAirline(address _address) 
        external 
        payable 
        requireIsOperational   
        requireRegisteredAirline
    {
        require(msg.value >= 10 ether, "Required minimum amount is 10 ETH");
        require(!airlines[_address].isFunded, "Airline is already funded");

        if (!testingMode) {
            fund(_address);
        } else {
            payable(msg.sender).transfer(msg.value);
        }
    
        airlines[_address].isFunded = true;
        fundedAirlines.push(_address);
    }

    function buy(address passenger, string calldata flight) external payable {
        require(msg.value <= 1 ether, "Required maximum amount is 1 ETH");
        bytes32 key = getInsuranceKey(passenger, flight);
        require(insurance[key] <= 0, "Passenger already has insurance for this flight");
        // TODO check if insurance has already been paid out

        insurance[key] = msg.value;
    }

    function getInsuranceKey(address passenger, string calldata flight)
        pure
        internal
        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(passenger, flight));
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

    function fund(address owner) public payable {
        uint256 currentFunds = funds[owner];
        uint256 totalFunds = currentFunds.add(msg.value);

        funds[owner] = totalFunds;
    }

    fallback() external payable {
        fund(msg.sender);
    }


    receive() external payable {
        fund(msg.sender);
    }
}

