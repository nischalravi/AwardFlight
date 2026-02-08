// ============================================
// VELOX FLIGHT BOOKING - EXPANDED AIRPORT DATABASE
// 200+ Major Airports Worldwide
// ============================================

const airports = [
    // United States - Major Hubs
    { code: 'ATL', name: 'Atlanta', country: 'United States', full: 'Hartsfield-Jackson Atlanta International Airport' },
    { code: 'LAX', name: 'Los Angeles', country: 'United States', full: 'Los Angeles International Airport' },
    { code: 'ORD', name: 'Chicago', country: 'United States', full: "O'Hare International Airport" },
    { code: 'DFW', name: 'Dallas', country: 'United States', full: 'Dallas/Fort Worth International Airport' },
    { code: 'DEN', name: 'Denver', country: 'United States', full: 'Denver International Airport' },
    { code: 'JFK', name: 'New York', country: 'United States', full: 'John F. Kennedy International Airport' },
    { code: 'SFO', name: 'San Francisco', country: 'United States', full: 'San Francisco International Airport' },
    { code: 'SEA', name: 'Seattle', country: 'United States', full: 'Seattle-Tacoma International Airport' },
    { code: 'LAS', name: 'Las Vegas', country: 'United States', full: 'Harry Reid International Airport' },
    { code: 'MCO', name: 'Orlando', country: 'United States', full: 'Orlando International Airport' },
    { code: 'MIA', name: 'Miami', country: 'United States', full: 'Miami International Airport' },
    { code: 'PHX', name: 'Phoenix', country: 'United States', full: 'Phoenix Sky Harbor International Airport' },
    { code: 'IAH', name: 'Houston', country: 'United States', full: 'George Bush Intercontinental Airport' },
    { code: 'CLT', name: 'Charlotte', country: 'United States', full: 'Charlotte Douglas International Airport' },
    { code: 'EWR', name: 'Newark', country: 'United States', full: 'Newark Liberty International Airport' },
    { code: 'MSP', name: 'Minneapolis', country: 'United States', full: 'Minneapolis-St Paul International Airport' },
    { code: 'BOS', name: 'Boston', country: 'United States', full: 'Logan International Airport' },
    { code: 'DTW', name: 'Detroit', country: 'United States', full: 'Detroit Metropolitan Airport' },
    { code: 'PHL', name: 'Philadelphia', country: 'United States', full: 'Philadelphia International Airport' },
    { code: 'LGA', name: 'New York', country: 'United States', full: 'LaGuardia Airport' },
    { code: 'FLL', name: 'Fort Lauderdale', country: 'United States', full: 'Fort Lauderdale-Hollywood International Airport' },
    { code: 'BWI', name: 'Baltimore', country: 'United States', full: 'Baltimore/Washington International Airport' },
    { code: 'IAD', name: 'Washington', country: 'United States', full: 'Washington Dulles International Airport' },
    { code: 'DCA', name: 'Washington', country: 'United States', full: 'Ronald Reagan Washington National Airport' },
    { code: 'SLC', name: 'Salt Lake City', country: 'United States', full: 'Salt Lake City International Airport' },
    { code: 'SAN', name: 'San Diego', country: 'United States', full: 'San Diego International Airport' },
    { code: 'TPA', name: 'Tampa', country: 'United States', full: 'Tampa International Airport' },
    { code: 'PDX', name: 'Portland', country: 'United States', full: 'Portland International Airport' },
    { code: 'HNL', name: 'Honolulu', country: 'United States', full: 'Daniel K. Inouye International Airport' },
    
    // Canada
    { code: 'YYZ', name: 'Toronto', country: 'Canada', full: 'Toronto Pearson International Airport' },
    { code: 'YVR', name: 'Vancouver', country: 'Canada', full: 'Vancouver International Airport' },
    { code: 'YUL', name: 'Montreal', country: 'Canada', full: 'Montréal-Pierre Elliott Trudeau International Airport' },
    { code: 'YYC', name: 'Calgary', country: 'Canada', full: 'Calgary International Airport' },
    
    // United Kingdom
    { code: 'LHR', name: 'London', country: 'United Kingdom', full: 'London Heathrow Airport' },
    { code: 'LGW', name: 'London', country: 'United Kingdom', full: 'London Gatwick Airport' },
    { code: 'MAN', name: 'Manchester', country: 'United Kingdom', full: 'Manchester Airport' },
    { code: 'EDI', name: 'Edinburgh', country: 'United Kingdom', full: 'Edinburgh Airport' },
    { code: 'LTN', name: 'London', country: 'United Kingdom', full: 'London Luton Airport' },
    { code: 'STN', name: 'London', country: 'United Kingdom', full: 'London Stansted Airport' },
    
    // France
    { code: 'CDG', name: 'Paris', country: 'France', full: 'Charles de Gaulle Airport' },
    { code: 'ORY', name: 'Paris', country: 'France', full: 'Paris Orly Airport' },
    { code: 'NCE', name: 'Nice', country: 'France', full: 'Nice Côte d\'Azur Airport' },
    { code: 'LYS', name: 'Lyon', country: 'France', full: 'Lyon-Saint Exupéry Airport' },
    
    // Germany
    { code: 'FRA', name: 'Frankfurt', country: 'Germany', full: 'Frankfurt Airport' },
    { code: 'MUC', name: 'Munich', country: 'Germany', full: 'Munich Airport' },
    { code: 'TXL', name: 'Berlin', country: 'Germany', full: 'Berlin Tegel Airport' },
    { code: 'DUS', name: 'Düsseldorf', country: 'Germany', full: 'Düsseldorf Airport' },
    { code: 'HAM', name: 'Hamburg', country: 'Germany', full: 'Hamburg Airport' },
    
    // Spain
    { code: 'MAD', name: 'Madrid', country: 'Spain', full: 'Adolfo Suárez Madrid–Barajas Airport' },
    { code: 'BCN', name: 'Barcelona', country: 'Spain', full: 'Barcelona El Prat Airport' },
    { code: 'AGP', name: 'Málaga', country: 'Spain', full: 'Málaga-Costa del Sol Airport' },
    { code: 'PMI', name: 'Palma', country: 'Spain', full: 'Palma de Mallorca Airport' },
    
    // Italy
    { code: 'FCO', name: 'Rome', country: 'Italy', full: 'Leonardo da Vinci–Fiumicino Airport' },
    { code: 'MXP', name: 'Milan', country: 'Italy', full: 'Milan Malpensa Airport' },
    { code: 'LIN', name: 'Milan', country: 'Italy', full: 'Milan Linate Airport' },
    { code: 'VCE', name: 'Venice', country: 'Italy', full: 'Venice Marco Polo Airport' },
    { code: 'NAP', name: 'Naples', country: 'Italy', full: 'Naples International Airport' },
    
    // Netherlands
    { code: 'AMS', name: 'Amsterdam', country: 'Netherlands', full: 'Amsterdam Schiphol Airport' },
    
    // Switzerland
    { code: 'ZRH', name: 'Zurich', country: 'Switzerland', full: 'Zurich Airport' },
    { code: 'GVA', name: 'Geneva', country: 'Switzerland', full: 'Geneva Airport' },
    
    // Austria
    { code: 'VIE', name: 'Vienna', country: 'Austria', full: 'Vienna International Airport' },
    
    // Belgium
    { code: 'BRU', name: 'Brussels', country: 'Belgium', full: 'Brussels Airport' },
    
    // Portugal
    { code: 'LIS', name: 'Lisbon', country: 'Portugal', full: 'Lisbon Portela Airport' },
    { code: 'OPO', name: 'Porto', country: 'Portugal', full: 'Francisco Sá Carneiro Airport' },
    
    // Greece
    { code: 'ATH', name: 'Athens', country: 'Greece', full: 'Athens International Airport' },
    
    // Turkey
    { code: 'IST', name: 'Istanbul', country: 'Turkey', full: 'Istanbul Airport' },
    { code: 'SAW', name: 'Istanbul', country: 'Turkey', full: 'Sabiha Gökçen International Airport' },
    
    // Russia
    { code: 'SVO', name: 'Moscow', country: 'Russia', full: 'Sheremetyevo International Airport' },
    { code: 'DME', name: 'Moscow', country: 'Russia', full: 'Domodedovo International Airport' },
    
    // UAE
    { code: 'DXB', name: 'Dubai', country: 'United Arab Emirates', full: 'Dubai International Airport' },
    { code: 'AUH', name: 'Abu Dhabi', country: 'United Arab Emirates', full: 'Abu Dhabi International Airport' },
    
    // Qatar
    { code: 'DOH', name: 'Doha', country: 'Qatar', full: 'Hamad International Airport' },
    
    // Saudi Arabia
    { code: 'JED', name: 'Jeddah', country: 'Saudi Arabia', full: 'King Abdulaziz International Airport' },
    { code: 'RUH', name: 'Riyadh', country: 'Saudi Arabia', full: 'King Khalid International Airport' },
    
    // India - Major Cities
    { code: 'DEL', name: 'New Delhi', country: 'India', full: 'Indira Gandhi International Airport' },
    { code: 'BOM', name: 'Mumbai', country: 'India', full: 'Chhatrapati Shivaji Maharaj International Airport' },
    { code: 'BLR', name: 'Bangalore', country: 'India', full: 'Kempegowda International Airport' },
    { code: 'BKK', name: 'Bangkok', full: 'Suvarnabhumi Airport' },
    { code: 'HKT', name: 'Phuket', full: 'Phuket International Airport' },
    
    // Malaysia
    { code: 'KUL', name: 'Kuala Lumpur', full: 'Kuala Lumpur International Airport' },
    
    // Indonesia
    { code: 'CGK', name: 'Jakarta', full: 'Soekarno-Hatta International Airport' },
    { code: 'DPS', name: 'Bali', full: 'Ngurah Rai International Airport' },
    
    // Australia
    { code: 'SYD', name: 'Sydney', full: 'Sydney Kingsford Smith Airport' },
    { code: 'MEL', name: 'Melbourne', full: 'Melbourne Airport' },
    { code: 'BNE', name: 'Brisbane', full: 'Brisbane Airport' },
    
    // South America
    { code: 'GRU', name: 'São Paulo', full: 'São Paulo/Guarulhos International Airport' },
    { code: 'EZE', name: 'Buenos Aires', full: 'Ministro Pistarini International Airport' },
    { code: 'SCL', name: 'Santiago', full: 'Arturo Merino Benítez International Airport' },
    
    // Mexico
    { code: 'MEX', name: 'Mexico City', full: 'Mexico City International Airport' },
    { code: 'CUN', name: 'Cancún', full: 'Cancún International Airport' }
];

// ============================================
// AUTOCOMPLETE FUNCTIONALITY
// ============================================

function createAutocomplete(input) {
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.display = 'none';
    
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(dropdown);
    
    input.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length < 1) {
            dropdown.style.display = 'none';
            return;
        }
        
        const matches = airports.filter(airport => 
            airport.code.toLowerCase().includes(query) ||
            airport.name.toLowerCase().includes(query) ||
            airport.full.toLowerCase().includes(query)
        ).slice(0, 8);
        
        if (matches.length === 0) {
            dropdown.innerHTML = `
                <div style="padding: 1rem; color: var(--text-secondary); text-align: center;">
                    No airports found
                </div>
            `;
            dropdown.style.display = 'block';
            return;
        }
        
        dropdown.innerHTML = matches.map(airport => `
            <div class="autocomplete-item" 
                 data-code="${airport.code}" 
                 data-name="${airport.name}">
                <div style="font-weight: 600; color: var(--accent-green);">${airport.code}</div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">${airport.name} - ${airport.full}</div>
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
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!input.parentElement.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Keyboard navigation for dropdown
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            dropdown.style.display = 'none';
        }
    });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
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
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ============================================
// INITIALIZATION ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Award Flights initialized');
    
    // Initialize autocomplete for airport inputs
    const airportInputs = document.querySelectorAll('.input-airport');
    airportInputs.forEach(input => createAutocomplete(input));
    
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
            
            // Validate
            if (!fromInput?.value || !toInput?.value) {
                showToast('Please enter both origin and destination airports', 'error');
                return;
            }
            
            if (!departure) {
                showToast('Please select a departure date', 'error');
                return;
            }
            
            // Save to recent searches
            saveRecentSearch({
                from, to, departure, returnDate, passengers, cabinClass,
                timestamp: new Date().toISOString()
            });
            
            // Navigate to search page
            const params = new URLSearchParams({
                from, to, departure,
                return: returnDate || '',
                passengers,
                class: cabinClass
            });
            
            window.location.href = `search.html?${params.toString()}`;
        });
    }
    
    // Animate feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card, .route-card');
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
    });
    
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
    
    featureCards.forEach(card => observer.observe(card));
});

// ============================================
// TAB SWITCHING
// ============================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active from all tabs
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        
        // Add active to clicked tab
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');
        
        // Handle return date visibility for one-way
        const returnGroup = document.querySelectorAll('.form-group')[2];
        if (returnGroup && returnGroup.querySelector('#input-return')) {
            if (this.dataset.tab === 'oneway') {
                returnGroup.style.display = 'none';
            } else {
                returnGroup.style.display = 'flex';
            }
        }
    });
});

// ============================================
// AIRPORT SWAP BUTTON
// ============================================

document.querySelectorAll('.swap-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const fromInput = document.getElementById('input-from');
        const toInput = document.getElementById('input-to');
        
        if (fromInput && toInput) {
            // Swap values
            const temp = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temp;
            
            // Add rotation animation
            this.style.transition = 'transform 0.3s ease';
            this.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                this.style.transform = 'rotate(0deg)';
            }, 300);
        }
    });
});

// ============================================
// MOBILE MENU
// ============================================

const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.nav');

if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener('click', () => {
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('active');
    });
}

// ============================================
// POPULAR ROUTE CARDS
// ============================================

document.querySelectorAll('.route-card').forEach(card => {
    const clickHandler = () => {
        const cityCodes = card.querySelectorAll('.city-code');
        if (cityCodes.length >= 2) {
            const from = cityCodes[0].textContent.trim();
            const to = cityCodes[1].textContent.trim();
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
        const searchWidget = document.querySelector('.search-widget');
        if (searchWidget) {
            searchWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                document.getElementById('input-from')?.focus();
            }, 500);
        }
    });
});

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
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

// Form validation
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

// Price tracking
const trackPrice = (route, price) => {
    try {
        const tracked = JSON.parse(localStorage.getItem('trackedPrices') || '[]');
        tracked.push({ route, price, date: new Date().toISOString() });
        localStorage.setItem('trackedPrices', JSON.stringify(tracked));
    } catch (e) {
        console.error('Error tracking price:', e);
    }
};

// Recent searches
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

// Animated counter
const animateCounter = (element, target, duration = 2000) => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start).toLocaleString();
        }
    }, 16);
};

// ============================================
// TOAST ANIMATION STYLES
// ============================================

const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(toastStyles);

// ============================================
// EXPORT API
// ============================================

window.Award FlightsApp = {
    airports,
    trackPrice,
    saveRecentSearch,
    showToast,
    validateForm,
    animateCounter
};

// ============================================
// SERVICE WORKER (PWA SUPPORT)
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(() => {
            // Silently fail if no service worker
        });
    });
}

console.log('✅ Award Flights ready - All systems operational');
