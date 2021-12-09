import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {

    constructor(network, callback) {
        let config = Config[network];

        // this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
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
                    flight: 'A10001', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'AirOne', address: this.airlines[0] }
                },
                {
                    flight: 'A10002', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'AirOne', address: this.airlines[0] }
                },
                {
                    flight: 'A10003', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'AirOne', address: this.airlines[0] }
                },
                {
                    flight: 'dA0001', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'dAirline', address: this.airlines[1] }
                },
                {
                    flight: 'dA0020', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'dAirline', address: this.airlines[1] }
                },
                {
                    flight: 'dA0300', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'dAirline', address: this.airlines[1] }
                },
                {
                    flight: 'DAO001', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'DAirlineO', address: this.airlines[2] }
                },
                {
                    flight: 'DAO010', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'DAirlineO', address: this.airlines[2] }
                },
                {
                    flight: 'DAO011', 
                    timestamp: this._randomDate(new Date(2020, 0, 1), new Date()), 
                    airline: { name: 'DAirlineO', address: this.airlines[2] }
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

    purchaseFlightInsurance(payload, callback) {
        let self = this;

        const { amount, flight } = payload;
        const value = self.web3.utils.toWei(amount);
        const passenger = self.owner;

        self.flightSuretyApp.methods
            .buyInsurance(passenger, flight)
            .send({ from: passenger, value, gas: 4712388, gasPrice: 100000000000 }, error => callback(error, payload));
    }

    withdrawFlightInsurance(payload, callback) {
        let self = this;

        const { amount, flight } = payload;
        const value = self.web3.utils.toWei(amount);
        const passenger = self.owner;

        self.flightSuretyApp.methods
            .withdraw(passenger, flight, value)
            .send({ from: passenger, gas: 4712388, gasPrice: 100000000000 }, error => callback(error, payload));
    }

    fetchFlightStatus(flight, callback) {
        let self = this;

        self.flightSuretyApp.methods
            .fetchFlightStatus(flight)
            .send({ from: self.owner}, error => callback(error, flight));
    }

    listenForFlightStatusInfo(callback) {
        let self = this;

        self.flightSuretyApp.events
            .FlightStatusInfo({ fromBlock: "latest" }, (error, event) => callback(error, event));
    }

    _randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    } 
}