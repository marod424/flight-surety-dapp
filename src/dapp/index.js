
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

(async() => {
    let contract = new Contract('localhost', () => {
        
        contract.isOperational((error, result) => {
            display(
                result ? 'Welcome Passenger' : 'Gracious Patron,', 
                result ? 'Feel free to move about the cabin!' : 'Under maintenance', 
                [{ 
                    label: 'Status', 
                    error, 
                    value: result ? 'Live' : 'Offline'
                }]
            );

            if (error || !result) {
                DOM.elid('airline-wrapper').remove();
                DOM.elid('flight-select').remove();
                DOM.elid('flight-insure').remove();
                DOM.elid('history-wrapper').remove();
            } else {
                const flightSelector = DOM.elid('flight-number');
                const orderedFlights = contract.flights.sort((a, b) => a.timestamp - b.timestamp);

                orderedFlights.forEach(flight => {
                    const option = DOM.option({ 
                        text: `${flight.flight} - ${flight.timestamp}`,
                        value: JSON.stringify(flight)
                    });
    
                    flightSelector.appendChild(option);
                });

                displayAirline('Airline Details', [
                    { label: 'Name', value: orderedFlights[0].airline.name },
                    { label: 'Address', value: orderedFlights[0].airline.address },
                ]);

                contract.listenForFlightStatusInfo((error, event) => {
                    if (event && event.returnValues) {
                        const { status, flight } = event.returnValues;
                        const { flight: number, timestamp, airline } = JSON.parse(flight);
                        const { name, address } = airline;
                        
                        const flightDetails = `${name} - ${address.slice(0, 5)}...${address.slice(-5)}`;
        
                        displayHistory('Flight Status Info', new Date(Date.now()), [
                            { label: 'Airline', value: flightDetails },
                            { label: 'Flight', value: number },
                            { label: 'Status', value: mapStatus(+status) },
                            { label: 'Time', value: timestamp },
                        ], error);
                    }
                });
            }
        });

        DOM.elid('flight-number').addEventListener('change', () => {
            const flight = DOM.elid('flight-number').value;
            const { airline } = JSON.parse(flight);
            
            displayAirline('Airline Details', [
                { label: 'Name', value: airline.name },
                { label: 'Address', value: airline.address },
            ]);

            DOM.elid('flight-insurance').value = '';
        });
    
        DOM.elid('purchase-insurance').addEventListener('submit', (event) => {
            event.preventDefault();

            const flight = DOM.elid('flight-number').value;
            const insurance = DOM.elid('flight-insurance').value;

            const payload = {
                flight: JSON.parse(flight),
                amount: insurance
            };

            contract.purchaseFlightInsurance(payload, (error, result) => {
                const { amount, flight: flightObj } = result;
                const { airline, flight: number, timestamp } = flightObj;
                const { name, address } = airline;

                const flightDetails = `${name} - ${address.slice(0, 5)}...${address.slice(-5)}`;

                displayHistory('Purchase Flight Insurance', new Date(Date.now()), [
                    { label: 'Airline', value: flightDetails },
                    { label: 'Flight', value: number },
                    { label: 'Amount', value: `${amount} ETH` },
                    { label: 'Time', value: timestamp },
                ], error);
            });
        });

        DOM.elid('fetch-status').addEventListener('click', () => {
            const flight = DOM.elid('flight-number').value;
            
            contract.fetchFlightStatus(flight, (error, result) => {
                const { flight, airline, timestamp } = JSON.parse(result);
                const { name, address } = airline;
                
                const flightDetails = `${name} - ${address.slice(0, 5)}...${address.slice(-5)}`;

                displayHistory('Fetch Flight Status', new Date(Date.now()), [
                    { label: 'Airline', value: flightDetails },
                    { label: 'Flight', value: flight },
                    { label: 'Status', value: 'Pending' },
                    { label: 'Time', value: timestamp },
                ], error);
            });
        });
    });
})();

function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();

    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));

    results.map(result => {
        let row = section.appendChild(DOM.div({ className:'row' }));

        row.appendChild(DOM.div({className: 'col-sm-3 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-9 field-value'}, 
            result.error ? String(result.error) : String(result.value)
        ));
        section.appendChild(row);
    });

    displayDiv.append(section);
}

function displayAirline(title, results) {
    let airlineWrapperDiv = DOM.elid("airline-wrapper");
    let section = DOM.section();

    if (airlineWrapperDiv.childElementCount > 0) {
        const fieldValues = airlineWrapperDiv.getElementsByClassName('field-value');
        fieldValues[0].innerHTML = results[0].value;
        fieldValues[1].innerHTML = results[1].value;
    } else {
        section.appendChild(DOM.h5(title));

        results.map(result => {
            let row = section.appendChild(DOM.div({ className:'row' }));
            row.appendChild(DOM.div({className: 'col-sm-3 field'}, result.label));
            row.appendChild(DOM.div({className: 'col-sm-9 field-value'}, String(result.value)));
            section.appendChild(row);
        });
    
        airlineWrapperDiv.append(section);
    }
}

function displayHistory(action, timestamp, results, error) {
    let historyWrapperDiv = DOM.elid("history-wrapper");
    let section = DOM.section();

    section.appendChild(DOM.h4(action));
    section.appendChild(DOM.h5(`${timestamp}`));

    if (error) {
        let row = section.appendChild(DOM.div({ className:'row' }));
        row.appendChild(DOM.div({className: 'col-sm-9 field-value'}, String(error)));
    }

    results.map(result => {
        let row = section.appendChild(DOM.div({ className:'row' }));
        row.appendChild(DOM.div({className: 'col-sm-3 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-9 field-value'}, String(result.value)));
        section.appendChild(row);
    });

    if (historyWrapperDiv.childElementCount > 2) {
        historyWrapperDiv.insertBefore(section, historyWrapperDiv.children[2]);
    } else {
        historyWrapperDiv.append(section);
    }
}

function mapStatus(code) {
    const statuses = [
        { label: "STATUS_CODE_UNKNOWN", code: 0, message: 'Unknown'}, 
        { label: "STATUS_CODE_ON_TIME", code: 10, message: 'On Time'}, 
        { label: "STATUS_CODE_LATE_AIRLINE", code: 20, message: 'Late (airline)'}, 
        { label: "STATUS_CODE_LATE_WEATHER", code: 30, message: 'Late (weather)'}, 
        { label: "STATUS_CODE_LATE_TECHNICAL", code: 40, message: 'Late (technical)'}, 
        { label: "STATUS_CODE_LATE_OTHER", code: 50, message: 'Late (other)' }
    ];

    const foundCodes = statuses.filter(status => code === status.code);
    return foundCodes.length > 0 ? foundCodes[0].message : 'Invalid Status Code';
}