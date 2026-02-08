const { FlightRadar24API } = require('flightradarapi');

class FlightDataService {
    constructor() {
        this.fr24 = new FlightRadar24API();
    }

    /**
     * Get real flights for a route
     * @param {string} originIATA - Origin airport code (JFK)
     * @param {string} destIATA - Destination airport code (MXP)
     * @returns {Promise<Array>} List of flights
     */
    async getFlightsForRoute(originIATA, destIATA) {
        try {
            // Get all flights globally
            const allFlights = await this.fr24.getFlights();
            
            // Filter by origin and destination
            const routeFlights = allFlights.filter(flight => 
                flight.originAirportIata === originIATA &&
                flight.destinationAirportIata === destIATA
            );
            
            return routeFlights;
        } catch (error) {
            console.error('Error fetching flights:', error);
            return [];
        }
    }

    /**
     * Get flights in a specific region
     * @param {object} zone - Zone bounds
     * @returns {Promise<Array>} Flights in region
     */
    async getFlightsByRegion(zone) {
        try {
            const bounds = this.fr24.getBounds(zone);
            const flights = await this.fr24.getFlights(null, bounds);
            return flights;
        } catch (error) {
            console.error('Error fetching regional flights:', error);
            return [];
        }
    }

    /**
     * Get detailed flight information
     * @param {object} flight - Flight object
     * @returns {Promise<object>} Detailed flight data
     */
    async getFlightDetails(flight) {
        try {
            const details = await this.fr24.getFlightDetails(flight);
            flight.setFlightDetails(details);
            return flight;
        } catch (error) {
            console.error('Error fetching flight details:', error);
            return null;
        }
    }

    /**
     * Search for airport by code
     * @param {string} code - IATA or ICAO code
     * @returns {Promise<object>} Airport data
     */
    async getAirport(code) {
        try {
            const airport = await this.fr24.getAirport(code, true);
            return airport;
        } catch (error) {
            console.error('Error fetching airport:', error);
            return null;
        }
    }

    /**
     * Get all airlines
     * @returns {Promise<Array>} List of airlines
     */
    async getAirlines() {
        try {
            return await this.fr24.getAirlines();
        } catch (error) {
            console.error('Error fetching airlines:', error);
            return [];
        }
    }

    /**
     * Format flight data for Award Flights display
     * @param {object} flight - FlightRadar24 flight object
     * @returns {object} Formatted for your website
     */
    formatFlightForDisplay(flight) {
        return {
            airline: flight.airlineIcao || 'Unknown',
            code: flight.number || 'N/A',
            aircraft: flight.aircraftCode || 'N/A',
            registration: flight.registration || 'N/A',
            origin: flight.originAirportIata || 'N/A',
            destination: flight.destinationAirportIata || 'N/A',
            altitude: flight.altitude || 0,
            speed: flight.groundSpeed || 0,
            heading: flight.heading || 0,
            latitude: flight.latitude,
            longitude: flight.longitude,
            onGround: flight.onGround === 1,
            callsign: flight.callsign || 'N/A'
        };
    }

    /**
     * Get flights and combine with award miles data
     * @param {string} from - Origin
     * @param {string} to - Destination
     * @param {object} awardMilesDB - Your award miles database
     * @returns {Promise<Array>} Combined flight + award data
     */
    async getFlightsWithAwardData(from, to, awardMilesDB) {
        const realFlights = await this.getFlightsForRoute(from, to);
        
        return realFlights.map(flight => {
            const formatted = this.formatFlightForDisplay(flight);
            
            // Add award miles info from your database
            const awardInfo = awardMilesDB[flight.airlineIcao] || {
                program: 'Unknown',
                businessClass: 50000,
                economyClass: 25000
            };
            
            return {
                ...formatted,
                awardMiles: awardInfo,
                // Calculate estimated price (you'd have real data here)
                price: Math.floor(1000 + Math.random() * 1000)
            };
        });
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlightDataService;
}

// For browser use
if (typeof window !== 'undefined') {
    window.FlightDataService = FlightDataService;
}
