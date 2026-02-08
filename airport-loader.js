// Airport Data Loader
// Downloads and formats airport data from OpenFlights database

const AIRPORT_DATA_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';

async function loadAirportData() {
    try {
        console.log('Fetching airport data from OpenFlights...');
        
        const response = await fetch(AIRPORT_DATA_URL);
        const csvData = await response.text();
        
        // Parse CSV data
        const lines = csvData.split('\n');
        const airports = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            // Split by comma, handling quoted strings
            const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!parts || parts.length < 6) continue;
            
            const clean = (str) => str.replace(/^"|"$/g, '').trim();
            
            const airport = {
                id: clean(parts[0]),
                name: clean(parts[1]),
                city: clean(parts[2]),
                country: clean(parts[3]),
                iata: clean(parts[4]), // 3-letter code (JFK, LAX, etc.)
                icao: clean(parts[5]), // 4-letter code
            };
            
            // Only include airports with valid IATA codes
            if (airport.iata && airport.iata !== '\\N' && airport.iata.length === 3) {
                airports.push(airport);
            }
        }
        
        console.log(`✅ Loaded ${airports.length} airports`);
        return airports;
        
    } catch (error) {
        console.error('❌ Error loading airport data:', error);
        return [];
    }
}

// Format for your website
function formatForWebsite(airports) {
    // Sort by popularity (major airports first)
    const majorAirports = [
        'JFK', 'LAX', 'LHR', 'CDG', 'NRT', 'HND', 'DXB', 'SIN', 'HKG', 'ICN',
        'ORD', 'ATL', 'DFW', 'DEN', 'SFO', 'SEA', 'MIA', 'BOS', 'LAS', 'PHX',
        'FRA', 'AMS', 'MAD', 'BCN', 'FCO', 'MXP', 'IST', 'SVO', 'PEK', 'PVG',
        'DEL', 'BOM', 'SYD', 'MEL', 'BKK', 'GRU', 'MEX', 'YYZ', 'YVR'
    ];
    
    const sorted = airports.sort((a, b) => {
        const aIndex = majorAirports.indexOf(a.iata);
        const bIndex = majorAirports.indexOf(b.iata);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.city.localeCompare(b.city);
    });
    
    // Format as JavaScript array
    const formatted = sorted.map(airport => {
        return `    { code: '${airport.iata}', name: '${airport.city}', country: '${airport.country}', airport: '${airport.name}' }`;
    });
    
    return `const airports = [\n${formatted.join(',\n')}\n];`;
}

// Export formatted data
async function exportAirportData() {
    const airports = await loadAirportData();
    const jsCode = formatForWebsite(airports);
    
    console.log('\n📦 Copy this into your script.js:\n');
    console.log(jsCode);
    
    return airports;
}

// Run the loader
exportAirportData();

// ===== USAGE IN YOUR WEBSITE =====

// Option 1: Load on page load (recommended for small dataset)
document.addEventListener('DOMContentLoaded', async () => {
    const airports = await loadAirportData();
    window.airportDatabase = airports;
    console.log('Airport database ready!');
});

// Option 2: Load from local JSON file (better performance)
async function loadLocalAirports() {
    const response = await fetch('./airports.json');
    return await response.json();
}

// Enhanced autocomplete with full database
function createAutocompleteWithFullDB(input, airports) {
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.display = 'none';
    
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(dropdown);
    
    input.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }
        
        // Search through all airports
        const matches = airports.filter(airport => 
            airport.iata.toLowerCase().includes(query) ||
            airport.city.toLowerCase().includes(query) ||
            airport.country.toLowerCase().includes(query) ||
            airport.name.toLowerCase().includes(query)
        ).slice(0, 10); // Show top 10 matches
        
        if (matches.length === 0) {
            dropdown.innerHTML = `
                <div style="padding: 1rem; color: var(--text-secondary);">
                    No airports found for "${query}"
                </div>
            `;
            dropdown.style.display = 'block';
            return;
        }
        
        dropdown.innerHTML = matches.map(airport => `
            <div class="autocomplete-item" 
                 data-code="${airport.iata}" 
                 data-name="${airport.city}">
                <div style="font-weight: 600; color: var(--accent-green);">
                    ${airport.iata} - ${airport.city}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    ${airport.name}, ${airport.country}
                </div>
            </div>
        `).join('');
        
        dropdown.style.display = 'block';
        
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                const code = this.dataset.code;
                const name = this.dataset.name;
                input.value = `${code} - ${name}`;
                dropdown.style.display = 'none';
            });
        });
    });
}

// ===== ALTERNATIVE: Use IndexedDB for Large Dataset =====

class AirportDatabase {
    constructor() {
        this.dbName = 'VeloxAirports';
        this.storeName = 'airports';
        this.db = null;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'iata' });
                    store.createIndex('city', 'city', { unique: false });
                    store.createIndex('country', 'country', { unique: false });
                    store.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }
    
    async loadData(airports) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        for (const airport of airports) {
            store.put(airport);
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
    
    async search(query) {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const results = [];
        
        return new Promise((resolve) => {
            const request = store.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < 10) {
                    const airport = cursor.value;
                    const q = query.toLowerCase();
                    
                    if (airport.iata.toLowerCase().includes(q) ||
                        airport.city.toLowerCase().includes(q) ||
                        airport.country.toLowerCase().includes(q) ||
                        airport.name.toLowerCase().includes(q)) {
                        results.push(airport);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
        });
    }
}

// Initialize database
const airportDB = new AirportDatabase();

(async () => {
    await airportDB.init();
    
    // Check if data already loaded
    const transaction = airportDB.db.transaction(['airports'], 'readonly');
    const store = transaction.objectStore('airports');
    const count = await new Promise(resolve => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
    });
    
    if (count === 0) {
        console.log('Loading airport database...');
        const airports = await loadAirportData();
        await airportDB.loadData(airports);
        console.log('✅ Airport database cached!');
    } else {
        console.log(`✅ Airport database ready (${count} airports)`);
    }
})();
