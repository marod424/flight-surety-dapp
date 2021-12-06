const Config = require('../config/testConfig.js');

contract('Oracles', async (accounts) => {
    const TEST_ORACLES_COUNT = 2;

    let config;

    before('setup contract', async () => {
        config = await Config(accounts);

        const STATUS_CODE_UNKNOWN = 0;
        const STATUS_CODE_ON_TIME = 10;
        const STATUS_CODE_LATE_AIRLINE = 20;
        const STATUS_CODE_LATE_WEATHER = 30;
        const STATUS_CODE_LATE_TECHNICAL = 40;
        const STATUS_CODE_LATE_OTHER = 50;
    });

    it('can register oracles', async () => {
        const fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

        for(let a = 1; a <= TEST_ORACLES_COUNT; a++) {      
            await config.flightSuretyApp.registerOracle({from: accounts[a], value: fee});

            const result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
            console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
        }
    });

    it('can request flight status', async () => {
        let flight = 'ND1309';
        let timestamp = Math.floor(Date.now() / 1000);

        await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);

        // Since the Index assigned to each test account is opaque by design
        // loop through all the accounts and for each account, all its indices,
        // and submit a response. The contract will reject a submission if it was
        // not requested so while sub-optimal, it's a good test of that feature
        for(let a = 1; a <= TEST_ORACLES_COUNT; a++) {
            let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});

            for (let i = 0; i < 3; i++) {
                try {
                    // Submit a response...it will only be accepted if there is an Index match
                    await config.flightSuretyApp.submitOracleResponse(
                        oracleIndexes[i], 
                        config.firstAirline, 
                        flight, 
                        timestamp, 
                        STATUS_CODE_ON_TIME, 
                        { from: accounts[a] }
                    );
                }
                catch(e) {
                    console.log('\nError', i, oracleIndexes[i].toNumber(), flight, timestamp);
                }
            }
        }
    });
});
