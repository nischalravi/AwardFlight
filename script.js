// ============================================
// VELOX FLIGHT BOOKING - MAIN JAVASCRIPT
// Version: 3.0 - With Live Airport API (10,000+ Airports)
// ============================================

// Global airport database
let airports = [];

// ============================================
// AIRPORT DATA LOADER FROM API
// ============================================

async function loadAirportsFromAPI() {
    const CACHE_KEY = 'velox_airports';
    const CACHE_TIMESTAMP_KEY = 'velox_airports_timestamp';
    const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    try {
        // Check if we have cached data
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cached && timestamp && (Date.now() - parseInt(timestamp)) < CACHE_DURATION) {
            console.log('📦 Loading airports from cache...');
            airports = JSON.parse(cached);
            console.log(`✅ Loaded ${airports.length} airports from cache`);
            return airports;
        }
        
        // Fetch fresh data from OpenFlights
        console.log('🌐 Fetching airport data from OpenFlights API...');
        const response = await fetch('https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat');
        const csvData = await response.text();
        
        // Parse CSV data
        const lines = csvData.split('\n');
        const parsedAirports = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            // CSV format: ID,"Name","City","Country","IATA","ICAO",Lat,Lon,Alt,Timezone,DST,Tz
            // Split carefully to handle quoted commas
            const parts = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    parts.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            parts.push(current.trim()); // Add last part
            
            if (parts.length < 6) continue;
            
            const iataCode = parts[4].replace(/"/g, '').trim();
            
            // Only include airports with valid 3-letter IATA codes
            if (iataCode && iataCode !== '\\N' && iataCode.length === 3) {
                parsedAirports.push({
                    code: iataCode,
                    name: parts[2].replace(/"/g, '').trim(),
                    country: parts[3].replace(/"/g, '').trim(),
                    full: parts[1].replace(/"/g, '').trim()
                });
            }
        }
        
        airports = parsedAirports;
        
        // Cache the data
        localStorage.setItem(CACHE_KEY, JSON.stringify(airports));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        
        console.log(`✅ Loaded and cached ${airports.length} airports from API`);
        return airports;
        
    } catch (error) {
        console.error('❌ Error loading airports from API:', error);
        
        // Fallback to cached data if available
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            console.log('⚠️ Using cached data as fallback');
            airports = JSON.parse(cached);
            return airports;
        }
        
        // Ultimate fallback to minimal airport list
        console.log('⚠️ Using minimal fallback airport list');
        airports = getFallbackAirports();
        return airports;
    }
}

// Minimal fallback airports (top 20) in case API fails
function getFallbackAirports() {
    return [
        { code: 'JFK', name: 'New York', full: 'John F. Kennedy International' },
        { code: 'LAX', name: 'Los Angeles', full: 'Los Angeles International' },
        { code: 'LHR', name: 'London', full: 'London Heathrow' },
        { code: 'CDG', name: 'Paris', full: 'Charles de Gaulle' },
        { code: 'DXB', name: 'Dubai', full: 'Dubai International' },
        { code: 'SIN', name: 'Singapore', full: 'Singapore Changi' },
        { code: 'HKG', name: 'Hong Kong', full: 'Hong Kong International' },
        { code: 'NRT', name: 'Tokyo', full: 'Narita International' },
        { code: 'DEL', name: 'Delhi', full: 'Indira Gandhi International' },
        { code: 'BOM', name: 'Mumbai', full: 'Chhatrapati Shivaji Maharaj International' },
        { code: 'BLR', name: 'Bangalore', full: 'Kempegowda International' },
        { code: 'SFO', name: 'San Francisco', full: 'San Francisco International' },
        { code: 'ORD', name: 'Chicago', full: "O'Hare International" },
        { code: 'FRA', name: 'Frankfurt', full: 'Frankfurt Airport' },
        { code: 'AMS', name: 'Amsterdam', full: 'Amsterdam Schiphol' },
        { code: 'MAD', name: 'Madrid', full: 'Madrid-Barajas' },
        { code: 'BCN', name: 'Barcelona', full: 'Barcelona El Prat' },
        { code: 'FCO', name: 'Rome', full: 'Leonardo da Vinci-Fiumicino' },
        { code: 'MXP', name: 'Milan', full: 'Milan Malpensa' },
        { code: 'SYD', name: 'Sydney', full: 'Sydney Kingsford Smith' }
    ];
}

// ============================================
// AUTOCOMPLETE FUNCTIONALITY
// ============================================

function createAutocomplete(input) {
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.display = 'none';
    
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(dropdown);
    
    let searchTimeout;
    
    input.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        if (query.length < 1) {
            dropdown.style.display = 'none';
            return;
        }
        
        // Debounce search for better performance
        searchTimeout = setTimeout(() => {
            // Search through airport database
            const matches = airports.filter(airport => 
                airport.code.toLowerCase().includes(query) ||
                airport.name.toLowerCase().includes(query) ||
                airport.full.toLowerCase().includes(query) ||
                airport.country.toLowerCase().includes(query)
            ).slice(0, 10); // Show top 10 matches
            
            if (matches.length === 0) {
                dropdown.innerHTML = `
                    <div style="padding: 1rem; color: #8a99b3; text-align: center;">
                        No airports found for "${query}"
                    </div>
                `;
                dropdown.style.display = 'block';
                return;
            }
            
            dropdown.innerHTML = matches.map(airport => `
                <div class="autocomplete-item" 
                     data-code="${airport.code}" 
                     data-name="${airport.name}"
                     role="option"
                     tabindex="0">
                    <div style="font-weight: 600; color: #c5ff68;">${airport.code} - ${airport.name}</div>
                    <div style="font-size: 0.85rem; color: #8a99b3;">${airport.full}, ${airport.country}</div>
                </div>
            `).join('');
            
            dropdown.style.display = 'block';
            
            // Add click handlers
            dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
                item.addEventListener('click', function() {
                    const code = this.dataset.code;
                    const name = this.dataset.name;
                    input.value = `${code} - ${name}`;
                    dropdown.style.display = 'none';
                });
                
                // Keyboard navigation within dropdown
                item.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        this.click();
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const next = this.nextElementSibling;
                        if (next) next.focus();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prev = this.previousElementSibling;
                        if (prev) prev.focus();
                        else input.focus();
                    }
                });
            });
        }, 200); // 200ms debounce
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!input.parentElement.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Keyboard controls
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            dropdown.style.display = 'none';
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const firstItem = dropdown.querySelector('.autocomplete-item');
            if (firstItem) firstItem.focus();
        }
    });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#c5ff68' : '#e74c3c'};
        color: #0a0f1e;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        font-family: 'Outfit', sans-serif;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Create enhanced scroll progress indicator
    const progressContainer = document.createElement('div');
    progressContainer.className = 'scroll-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    
    // Create SVG plane
    const plane = document.createElement('div');
    plane.className = 'scroll-plane';
    plane.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
                  fill="#c5ff68" 
                  stroke="#a8e050" 
                  stroke-width="0.5"/>
        </svg>
    `;
    
    // Create cloud SVG elements (3 clouds)
    const createCloud = () => {
        const cloud = document.createElement('div');
        cloud.className = 'scroll-cloud';
        cloud.innerHTML = `
            <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="15" cy="25" rx="10" ry="8" fill="#4a9cff" opacity="0.15"/>
                <ellipse cx="25" cy="20" rx="12" ry="10" fill="#4a9cff" opacity="0.2"/>
                <ellipse cx="35" cy="22" rx="10" ry="8" fill="#4a9cff" opacity="0.15"/>
                <ellipse cx="45" cy="26" rx="8" ry="7" fill="#4a9cff" opacity="0.12"/>
                <rect x="12" y="24" width="38" height="8" rx="4" fill="#4a9cff" opacity="0.18"/>
            </svg>
        `;
        return cloud;
    };
    
    const cloud1 = createCloud();
    const cloud2 = createCloud();
    const cloud3 = createCloud();
    
    progressContainer.appendChild(cloud1);
    progressContainer.appendChild(cloud2);
    progressContainer.appendChild(cloud3);
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(plane);
    document.body.appendChild(progressContainer);
    
    let scrollTimeout;
    
    // Update progress on scroll
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        
        // Update bar width
        progressBar.style.width = scrolled + '%';
        
        // Move plane with progress (centered on the bar end)
        plane.style.left = scrolled + '%';
        
        // Show progress bar while scrolling
        progressContainer.classList.add('visible');
        
        // Hide after scrolling stops (1.5 second delay)
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            progressContainer.classList.remove('visible');
        }, 1500);
    });
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'airport-loading';
    loadingIndicator.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: #1e2836;
        color: #8a99b3;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        z-index: 9999;
        border: 1px solid #2a3644;
    `;
    loadingIndicator.textContent = '⏳ Loading airport database...';
    document.body.appendChild(loadingIndicator);
    
    // Load airports from API
    await loadAirportsFromAPI();
    
    // Remove loading indicator
    loadingIndicator.textContent = `✅ ${airports.length} airports ready`;
    setTimeout(() => loadingIndicator.remove(), 2000);
    
    // Initialize autocomplete
    document.querySelectorAll('.input-airport').forEach(input => createAutocomplete(input));
    
    // Set default dates
    const dateInputs = document.querySelectorAll('.input-date');
    if (dateInputs.length >= 2) {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + 10);
        
        const formatDate = (date) => date.toISOString().split('T')[0];
        
        dateInputs[0].value = formatDate(today);
        dateInputs[0].min = formatDate(today);
        dateInputs[1].value = formatDate(futureDate);
        dateInputs[1].min = formatDate(today);
    }
    
    // Search form submission
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fromInput = document.getElementById('input-from');
            const toInput = document.getElementById('input-to');
            const from = fromInput?.value.split(' - ')[0] || fromInput?.value || 'JFK';
            const to = toInput?.value.split(' - ')[0] || toInput?.value || 'MXP';
            const departure = document.getElementById('input-departure')?.value;
            const returnDate = document.getElementById('input-return')?.value;
            const passengers = document.getElementById('input-passengers')?.value || '2';
            const cabinClass = document.getElementById('input-class')?.value || 'business';
            
            if (!fromInput?.value || !toInput?.value) {
                showToast('Please enter both origin and destination airports', 'error');
                return;
            }
            
            if (!departure) {
                showToast('Please select a departure date', 'error');
                return;
            }
            
            saveRecentSearch({ from, to, departure, returnDate, passengers, cabinClass });
            
            const params = new URLSearchParams({
                from, to, departure,
                return: returnDate || '',
                passengers,
                class: cabinClass
            });
            
            window.location.href = `search.html?${params.toString()}`;
        });
    }
    
    // Animate elements on scroll
    const elements = document.querySelectorAll('.feature-card, .route-card');
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
    });
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => observer.observe(el));
});

// ============================================
// TAB SWITCHING
// ============================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');
        
        const returnGroup = document.querySelectorAll('.form-group')[2];
        if (returnGroup && this.dataset.tab === 'oneway') {
            returnGroup.style.display = 'none';
        } else if (returnGroup) {
            returnGroup.style.display = 'flex';
        }
    });
});

// ============================================
// AIRPORT SWAP
// ============================================

document.querySelectorAll('.swap-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const fromInput = document.getElementById('input-from');
        const toInput = document.getElementById('input-to');
        
        if (fromInput && toInput) {
            const temp = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temp;
            
            this.style.transition = 'transform 0.3s ease';
            this.style.transform = 'rotate(180deg)';
            setTimeout(() => this.style.transform = 'rotate(0deg)', 300);
        }
    });
});

// ============================================
// MOBILE MENU
// ============================================

const mobileToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.nav');

if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('active');
    });
}

// ============================================
// POPULAR ROUTE CARDS
// ============================================

document.querySelectorAll('.route-card').forEach(card => {
    const clickHandler = () => {
        const codes = card.querySelectorAll('.city-code');
        if (codes.length >= 2) {
            const from = codes[0].textContent.trim();
            const to = codes[1].textContent.trim();
            window.location.href = `search.html?from=${from}&to=${to}`;
        }
    };
    
    card.addEventListener('click', clickHandler);
    card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            clickHandler();
        }
    });
});

// ============================================
// CTA BUTTONS
// ============================================

document.querySelectorAll('.btn-cta').forEach(btn => {
    btn.addEventListener('click', () => {
        const widget = document.querySelector('.search-widget');
        if (widget) {
            widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => document.getElementById('input-from')?.focus(), 500);
        }
    });
});

// ============================================
// SMOOTH SCROLL
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target.setAttribute('tabindex', '-1');
                target.focus();
            }
        }
    });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

const validateForm = (form) => {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.style.borderColor = '#e74c3c';
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.style.borderColor = '';
            input.setAttribute('aria-invalid', 'false');
        }
    });
    return isValid;
};

const trackPrice = (route, price) => {
    try {
        const tracked = JSON.parse(localStorage.getItem('trackedPrices') || '[]');
        tracked.push({ route, price, date: new Date().toISOString() });
        localStorage.setItem('trackedPrices', JSON.stringify(tracked));
    } catch (e) {
        console.error('Error tracking price:', e);
    }
};

const saveRecentSearch = (search) => {
    try {
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        recent.unshift(search);
        if (recent.length > 5) recent.pop();
        localStorage.setItem('recentSearches', JSON.stringify(recent));
    } catch (e) {
        console.error('Error saving search:', e);
    }
};

// Clear airport cache (useful for debugging/updates)
const clearAirportCache = () => {
    localStorage.removeItem('velox_airports');
    localStorage.removeItem('velox_airports_timestamp');
    console.log('✅ Airport cache cleared. Reload page to fetch fresh data.');
};

// ============================================
// TOAST ANIMATIONS
// ============================================

const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(toastStyles);

// ============================================
// EXPORT API
// ============================================

window.VeloxApp = {
    airports: () => airports, // Function to get current airport list
    trackPrice,
    saveRecentSearch,
    showToast,
    validateForm,
    clearAirportCache,
    reloadAirports: loadAirportsFromAPI
};

console.log('✅ Velox script loaded - Airport database will load on page ready');
