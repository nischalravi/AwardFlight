// SIMPLE AIRPORT DATA FETCHER
// Copy this into your browser console or run with Node.js

// ==== OPTION 1: Fetch from OpenFlights (10,000+ airports) ====
async function downloadAirports() {
    const url = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.split('\n');
        const airports = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            // Parse CSV (simplified)
            const parts = line.split(',').map(s => s.replace(/"/g, ''));
            
            const iata = parts[4];
            if (iata && iata !== '\\N' && iata.length === 3) {
                airports.push({
                    code: iata,
                    name: parts[2],        // City
                    country: parts[3],     // Country
                    airport: parts[1]      // Airport name
                });
            }
        }
        
        console.log(`✅ Loaded ${airports.length} airports`);
        
        // Convert to JavaScript code you can copy
        const jsCode = `const airports = ${JSON.stringify(airports, null, 2)};`;
        
        // Download as file
        const blob = new Blob([jsCode], { type: 'text/javascript' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'airports-database.js';
        link.click();
        
        console.log('📥 airports-database.js downloaded!');
        
        return airports;
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run it!
downloadAirports();


// ==== OPTION 2: Using Aviation Edge API ====
async function getAirportsFromAPI() {
    // Get free API key from: https://aviation-edge.com/
    const API_KEY = 'YOUR_API_KEY_HERE';
    const url = `https://aviation-edge.com/v2/public/airportDatabase?key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Format for your needs
    const formatted = data.map(airport => ({
        code: airport.codeIataAirport,
        name: airport.nameAirport,
        city: airport.nameCity,
        country: airport.nameCountry
    }));
    
    console.log(formatted);
    return formatted;
}


// ==== OPTION 3: Direct JSON from OpenFlights ====
// This is the easiest - just fetch the JSON version
async function getAirportsJSON() {
    const response = await fetch('https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.json');
    const airports = await response.json();
    
    // Filter to only those with IATA codes
    const withIATA = airports.filter(a => a.iata && a.iata !== 'null');
    
    console.log(`Found ${withIATA.length} airports with IATA codes`);
    return withIATA;
}


// ==== READY TO USE: Major Airports Only (Faster) ====
// If you want just the top 200 most popular airports, use this:

const TOP_200_AIRPORTS = [
    { code: 'ATL', name: 'Atlanta', country: 'United States' },
    { code: 'PEK', name: 'Beijing', country: 'China' },
    { code: 'LAX', name: 'Los Angeles', country: 'United States' },
    { code: 'DXB', name: 'Dubai', country: 'United Arab Emirates' },
    { code: 'HND', name: 'Tokyo', country: 'Japan' },
    { code: 'ORD', name: 'Chicago', country: 'United States' },
    { code: 'LHR', name: 'London', country: 'United Kingdom' },
    { code: 'HKG', name: 'Hong Kong', country: 'Hong Kong' },
    { code: 'PVG', name: 'Shanghai', country: 'China' },
    { code: 'CDG', name: 'Paris', country: 'France' },
    { code: 'DFW', name: 'Dallas', country: 'United States' },
    { code: 'AMS', name: 'Amsterdam', country: 'Netherlands' },
    { code: 'FRA', name: 'Frankfurt', country: 'Germany' },
    { code: 'IST', name: 'Istanbul', country: 'Turkey' },
    { code: 'CAN', name: 'Guangzhou', country: 'China' },
    { code: 'JFK', name: 'New York', country: 'United States' },
    { code: 'SIN', name: 'Singapore', country: 'Singapore' },
    { code: 'ICN', name: 'Seoul', country: 'South Korea' },
    { code: 'DEN', name: 'Denver', country: 'United States' },
    { code: 'BKK', name: 'Bangkok', country: 'Thailand' },
    { code: 'SFO', name: 'San Francisco', country: 'United States' },
    { code: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia' },
    { code: 'MAD', name: 'Madrid', country: 'Spain' },
    { code: 'SEA', name: 'Seattle', country: 'United States' },
    { code: 'BCN', name: 'Barcelona', country: 'Spain' },
    { code: 'MIA', name: 'Miami', country: 'United States' },
    { code: 'FCO', name: 'Rome', country: 'Italy' },
    { code: 'LAS', name: 'Las Vegas', country: 'United States' },
    { code: 'MUC', name: 'Munich', country: 'Germany' },
    { code: 'SYD', name: 'Sydney', country: 'Australia' },
    // Add more as needed...
];


// ==== HOW TO USE IN YOUR WEBSITE ====

// 1. Save airport data to a separate file: airports-data.js
// 2. Include it in your HTML:
//    <script src="airports-data.js"></script>
//    <script src="script.js"></script>

// 3. Or fetch dynamically:
let airportDatabase = [];

async function initAirports() {
    const response = await fetch('https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat');
    const text = await response.text();
    
    // Parse and cache
    airportDatabase = parseAirportData(text);
    localStorage.setItem('airports', JSON.stringify(airportDatabase));
    localStorage.setItem('airports-timestamp', Date.now());
}

function loadCachedAirports() {
    const cached = localStorage.getItem('airports');
    const timestamp = localStorage.getItem('airports-timestamp');
    
    // Refresh if older than 30 days
    if (cached && timestamp && (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000)) {
        return JSON.parse(cached);
    }
    
    return null;
}

// On page load
(async () => {
    airportDatabase = loadCachedAirports();
    
    if (!airportDatabase) {
        await initAirports();
    }
    
    console.log(`✅ ${airportDatabase.length} airports ready`);
})();
