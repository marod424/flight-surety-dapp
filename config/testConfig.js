const BigNumber = require('bignumber.js');
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");

const Config = async function(accounts) {
    
    let testAddresses = [
        "0xb2c6e05a37186df6aab0f30a24b07e5baf95691c",
        "0xad868d1c3e2081f91bc45324178ce2e2e44022df",
        "0x459fda0b1a10715ddbf1ddef526cf9ae1ecbfb9a",
        "0x9f58de4610d7ecc532cb6c20d96b2262560c8827",
        "0x3d3df654aa53b74c9224930fe19cd91d200bd61d",
        "0x0aa22a040046a484cce3c2f5147ec77a543223e0",
        "0xe3693df8613d29aee5c23fe7eb7faf15aaa8b04b",
        "0xe6b203ca67b1bee3cb4edd23b13182dbb3756ccc",
        "0x34d58b7d666b5a998fb30d73decaacf208a413cb",
        "0xbbbda1145d4efb3bd11b40d83335d84b5dbc6836",
    ];

    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new();

    return {
        owner,
        firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses,
        flightSuretyData,
        flightSuretyApp
    }
}

module.exports = Config;