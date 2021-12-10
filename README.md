# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.  


## Developer Quickstart

1. Clone repository: ``git clone https://github.com/marod424/flight-surety-dapp.git``
2. Install dependencies: ``cd flight-surety-dapp && npm install``
3. Run blockchain: ``truffle develop``
4. Compile contracts: ``truffle > compile``
5. Migrate contracts: ``truffle > migrate --reset``
6. Test contracts: ``truffle > test``
7. Launch the dapp (in separate terminal window): ``npm run dapp``
8. Start the server (in separate terminal window): ``npm run server``
9. View the dapp `http://localhost:8000`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## Versions

* ``Truffle v5.4.18 (core: 5.4.18)``
* ``Solidity - ^0.8.0 (solc-js)``
* ``Node v14.15.4``
* ``Web3.js v1.5.3``