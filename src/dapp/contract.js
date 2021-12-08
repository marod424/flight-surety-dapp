import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {

    constructor(network, callback) {
        let config = Config[network];

        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            let counter = 1;

            this.owner = accts[0];

            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            this.flights = [
                { 
                    status: 0,
                    number: 'A10001', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'AirOne', address: this.airlines[1] }
                },
                { 
                    status: 0,
                    number: 'A10002', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'AirOne', address: this.airlines[1] }
                },
                { 
                    status: 0,
                    number: 'A10003', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'AirOne', address: this.airlines[1] }
                },
                { 
                    status: 0,
                    number: 'dA0001', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'dAirline', address: this.airlines[2] }
                },
                { 
                    status: 0,
                    number: 'dA0020', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'dAirline', address: this.airlines[2] }
                },
                { 
                    status: 0,
                    number: 'dA0300', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'dAirline', address: this.airlines[2] }
                },
                { 
                    status: 0,
                    number: 'DAO001', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'DAirlineO', address: this.airlines[3] }
                },
                { 
                    status: 0,
                    number: 'DAO010', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'DAirlineO', address: this.airlines[3] }
                },
                { 
                    status: 0,
                    number: 'DAO011', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'DAirlineO', address: this.airlines[3] }
                },
            ];

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    purchaseFlightInsurance(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight,
            timestamp: Math.floor(Date.now() / 1000)
        };

        self.flightSuretyApp.methods
            .buyInsurance(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, error => callback(error, payload));
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight,
            timestamp: Math.floor(Date.now() / 1000)
        };

        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, error => callback(error, payload));
    }

    _randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    } 
}