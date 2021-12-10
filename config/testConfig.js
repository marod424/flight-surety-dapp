const BigNumber = require('bignumber.js');
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");

const Config = async function(accounts) {
    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new(firstAirline);
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    return {
        owner,
        firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        flightSuretyData,
        flightSuretyApp
    }
}

module.exports = Config;