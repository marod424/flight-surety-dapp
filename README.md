# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Rubric

### Separation of Concerns, Operational Control, and Fail Fast

* ``FlightSuretyData`` for data persistence
* ``FlightSuretyApp`` for app logic and oracles code
* Dapp client for triggering contract calls
  * Launched with ``npm run dapp``
  * Available at http://localhost:8000
  * Contract calls:
    * passenger can purchase insurance for flight
    * passenger can request flight status
* Oracle server
  * Launched with ``npm run server``
* Operation status control
  * pause smart contracts
  * multi-party consensus to pause
* Fail fast
  * majority of require calls before function body

### Airlines

* First airline is registered when contract is deployed
* Multiparty consensus
  * Only existing airline may register a new airline until at least four airlines are registered
  * Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines
* Airline can be registered, but does not participate in contract until it submits funding of 10 ether

### Passengers

* Passengers airline choice
  * Passengers can choose from a fixed list of flight numbers and departures that are defined in the Dapp
  * Fields for airline address and airline name
  * Amount of funds to send/which airline to send to
  * Ability to purchase flight insurance for no more than 1 ether
* If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount paid
* Passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout
* Insurance payouts are not sent directly to passenger's wallet

### Oracles

* Oracle functionality is implemented in the server
* Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory
* Update flight status requests from client Dapp result in OracleRequest event emitted by smart contract that is captured by server (displays in console and handled in code)
* Server Functionality
  * Loop through all registered oracles 
  * Identify oracles for which the ``OracleRequest`` event applies
  * Respond by calling into ``FlightSuretyApp`` contract with random status code
    * Unknown (0)
    * On Time (10)
    * Late Airline (20)
    * Late Weather (30)
    * Late Technical (40)
    * Late Other (50)