const Config = require('../config/testConfig.js');

contract('FlightSuretyData Tests', async (accounts) => {
    let config;
    let contract;

    beforeEach('setup contract', async () => {
        config = await Config(accounts);
        contract = config.flightSuretyData;
        await contract.setTestingMode(true);
    });

    describe('Operation status control', async () => {
        it('is initially set to be operational', async () => {
            const status = await contract.isOperational();
            assert.equal(status, true, "Incorrect initial operating status value");
        });

        describe('setOperatingStatus()', async () => {
            it('requires registered airline caller', async () => {
                let reason = '';

                try {
                    await contract.setOperatingStatus(false);
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Caller is not a registered airline");
            });

            it('requires funded airline caller', async () => {
                let reason = '';

                try {
                    await contract.setOperatingStatus(false, {from: config.firstAirline});
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Caller is not a funded airline");
            });

            it('requires new status to be different from existing status', async () => {
                let reason = '';
                
                const status = await contract.isOperational();
                
                await contract.fundAirline(config.firstAirline, {
                    from: config.firstAirline, 
                    value: 10 * config.weiMultiple
                });

                try {
                    await contract.setOperatingStatus(status, {from: config.firstAirline});
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "New status must be different from existing status");
            });

            it('allows registered and funded airline to set status to non operational', async () => {
                await contract.fundAirline(config.firstAirline, {
                    from: config.firstAirline, 
                    value: 10 * config.weiMultiple
                });

                await contract.setOperatingStatus(false, {from: config.firstAirline});

                const status = await contract.isOperational();
                assert.equal(status, false, "Incorrect operating status value");
            });
        });
    });

    describe('Airline functionality', async () => {
        describe('registerAirline()', async () => {
            it('requires contract is operational', async () => {
                let reason = '';

                await contract.fundAirline(config.firstAirline, {
                    from: config.firstAirline, 
                    value: 10 * config.weiMultiple
                });

                await contract.setOperatingStatus(false, {from: config.firstAirline});

                try {
                    await contract.registerAirline(accounts[2], 'dAirline');
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Contract is currently not operational");
            });

            it('requires registered airline caller', async () => {
                let reason = '';

                try {
                    await contract.registerAirline(accounts[2], 'dAirline');
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Caller is not a registered airline");
            });

            it('requires funded airline caller', async () => {
                let reason = '';

                try {
                    await contract.registerAirline(accounts[2], 'dAirline', {from: config.firstAirline});
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Caller is not a funded airline");
            });

            it('requires target airline is not already registered', async () => {
                let reason = '';

                await contract.fundAirline(config.firstAirline, {
                    from: config.firstAirline, 
                    value: 10 * config.weiMultiple
                });

                try {

                    await contract.registerAirline(config.firstAirline, 'dAirline', {from: config.firstAirline});
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Airline is already registered");
            });

            it('allows registered and funded airline to register another airline', async () => {
                const anotherAirline = accounts[2];

                await contract.fundAirline(config.firstAirline, {
                    from: config.firstAirline, 
                    value: 10 * config.weiMultiple
                });

                await contract.registerAirline(anotherAirline, 'dAirline', {from: config.firstAirline});

                const isRegistered = await contract.isRegisteredAirline(anotherAirline);
                assert.equal(isRegistered, true, "Incorrect isRegistered airline value");
            });
        });

        describe('fundAirline()', async () => {
            it('requires contract is operational', async () => {
                let reason = '';

                await contract.fundAirline(config.firstAirline, {
                    from: config.firstAirline, 
                    value: 10 * config.weiMultiple
                });

                await contract.setOperatingStatus(false, {from: config.firstAirline});

                try {
                    await contract.fundAirline(config.firstAirline, {from: config.firstAirline});
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Contract is currently not operational");
            });

            it('requires registered airline caller', async () => {
                let reason = '';

                try {
                    await contract.fundAirline(config.firstAirline);
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Caller is not a registered airline");
            });

            it('requires minimum value of 10 ETH', async () => {
                let reason = '';

                try {
                    await contract.fundAirline(config.firstAirline, {from: config.firstAirline});
                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Required minimum amount is 10 ETH");
            });

            it('requires target airline is not already funded', async () => {
                let reason = '';

                await contract.fundAirline(config.firstAirline, {
                    from: config.firstAirline, 
                    value: 10 * config.weiMultiple
                });

                try {
                    await contract.fundAirline(config.firstAirline, {
                        from: config.firstAirline, 
                        value: 10 * config.weiMultiple
                    });                } 
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Airline is already funded");
            });

            it('allows registered airline to fund an airline', async () => {
                await contract.fundAirline(config.firstAirline, {
                    from: config.firstAirline, 
                    value: 10 * config.weiMultiple
                });

                const isFunded = await contract.isFundedAirline(config.firstAirline);
                assert.equal(isFunded, true, "Incorrect isFunded airline value");
            });
        });
    });

    describe('Multiparty', async () => {
        beforeEach('Register and fund airlines', async () => {
            const M = await contract.MULTI_PARTY_AIRLINE_MIN.call();

            await contract.fundAirline(config.firstAirline, {
                from: config.firstAirline,
                value: 10 * config.weiMultiple
            });

            // M = 4
            // accounts[1] AirOne
            // i=1, accounts[2] Test Airline 2
            // i=2, accounts[3] Test Airline 3
            // i=3, accounts[4] Test Airline 4

            for (let i = 1; i < M; i++) {
                await contract.registerAirline(accounts[i+1], `Test Airline ${i+1}`, {
                    from: config.firstAirline
                });

                await contract.fundAirline(accounts[i+1], {
                    from: accounts[i+1],
                    value: 10 * config.weiMultiple
                });
            }
        });

        describe('setOperatingStatus()', async () => {
            it('blocks duplicate calls by same caller', async () => {
                let reason = '';

                await contract.setOperatingStatus(false, {from: accounts[2]});

                try {
                    await contract.setOperatingStatus(false, {from: accounts[2]});
                }
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason, "Caller already voted");
            });

            it('allows multiparty majority to set status to non operational', async () => {
                await contract.setOperatingStatus(false, {from: config.firstAirline});
                await contract.setOperatingStatus(false, {from: accounts[2]});

                const status = await contract.isOperational();
                assert.equal(status, false, "Incorrect operating status value");
            });
        });

        describe('registerAirline()', async () => {
            it('blocks duplicate calls by same caller', async () => {
                let reason = '';
                
                await contract.registerAirline(accounts[5], '', {from: accounts[2]});
                
                try {
                    await contract.registerAirline(accounts[5], '', {from: accounts[2]});
                }
                catch(error) {
                    reason = error.reason;
                }

                assert.equal(reason,"Caller already voted");
            });

            it('allows multiparty majority to register a new airline', async () => {
                const newAirline = accounts[5];

                await contract.registerAirline(newAirline, '', {from: config.firstAirline});
                await contract.registerAirline(newAirline, '', {from: accounts[2]});

                const isRegistered = await contract.isRegisteredAirline(newAirline);
                assert.equal(isRegistered, true, "Incorrect isRegistered value");
            });
        });
    });
});