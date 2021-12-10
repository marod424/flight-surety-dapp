import Web3 from 'web3';
import express from 'express';
import Config from './config.json';
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
let oracles = [];

web3.eth.handleRevert = true;

web3.eth.getAccounts()
  .then(accounts => {
    web3.eth.defaultAccount = web3.eth.accounts[0];

    flightSuretyData.methods.fund(accounts[0])
      .send({ from: accounts[0], value: 10000000000000000000, gas: 4712388, gasPrice: 100000000000 })
      .then(() => console.log('Account funded'))
      .catch(error => console.log('Error funding account', error));

    flightSuretyApp.methods.REGISTRATION_FEE().call()
      .then(fee => {
        accounts.forEach(account => {
          // Duplicating these calls to simulate 20+ oracles
          // since Truffle only provides 10 accounts as default
          for (let i = 0; i < 5; i++) {
            flightSuretyApp.methods.registerOracle()
              .send({ from: account, value: fee, gas: 4712388, gasPrice: 100000000000 })
              .then(() => {
                flightSuretyApp.methods.getMyIndexes()
                  .call({ from: account })
                  .then(result => {
                    console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
                    oracles.push({ account, indexes: result });
                  })
                  .catch(error => console.log('Get Indexes Error:', error));
              })
              .catch(error => console.log('Register Oracle Error:', error));
          }
        });
      })
      .catch(error => console.log('Call REGISTRATION_FEE Error:', error));
  })
  .catch(error => console.log('Get accounts Error:', error));


flightSuretyApp.events.OracleRequest({fromBlock: "latest"}, function (error, event) {
  if (error) console.log('error', error);

  if (event && event.returnValues) {
    const { index, flight } = event.returnValues;

    oracles.filter(o => o.indexes.includes(index)).forEach(oracle => {
      const { account } = oracle;
      const code = Math.floor(Math.random()*5 + 1)*10;
      // const code = 20; // good for force testing insurance payout

      flightSuretyApp.methods.submitOracleResponse(index, flight, code)
        .send({ from: account, gas: 4712388, gasPrice: 100000000000 })
        .then(() => {})
        .catch(error => console.log('Submit Oracle Response Error', error));
    });
  }
});

flightSuretyApp.events.OracleReport({fromBlock: "latest"}, function (error, event) {
  if (error) console.log('error', error);

  if (event && event.returnValues) {
    const { flight, status } = event.returnValues;
    const parsedFlight = JSON.parse(flight);

    console.log(`Oracle report for flight ${parsedFlight.flight}: status ${status}`);
  }
});

flightSuretyApp.events.FlightStatusInfo({fromBlock: "latest"}, function (error, event) {
  if (error) console.log('error', error);

  if (event && event.returnValues) {
    const { flight, status } = event.returnValues;
    const parsedFlight = JSON.parse(flight);
    const statusMap = {
      10: 'On Time',
      20: 'Late Airline',
      30: 'Late Weather',
      40: 'Late Technical',
      50: 'Late Other'
    };
    console.log(`Oracle consensus for flight ${parsedFlight.flight}: status ${status} - ${statusMap[status]}`);
  }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    });
});

export default app;