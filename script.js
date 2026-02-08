// ============================================
// VELOX FLIGHT BOOKING - MAIN JAVASCRIPT
// Version: 2.0 - Production Ready
// ============================================

// Airport database for autocomplete (40 major airports)
const airports = [
    { code: 'JFK', name: 'New York', full: 'John F. Kennedy International Airport' },
    { code: 'LAX', name: 'Los Angeles', full: 'Los Angeles International Airport' },
    { code: 'LHR', name: 'London', full: 'London Heathrow Airport' },
    { code: 'CDG', name: 'Paris', full: 'Charles de Gaulle Airport' },
    { code: 'NRT', name: 'Tokyo', full: 'Narita International Airport' },
    { code: 'HND', name: 'Tokyo', full: 'Haneda Airport' },
    { code: 'SFO', name: 'San Francisco', full: 'San Francisco International Airport' },
    { code: 'MIA', name: 'Miami', full: 'Miami International Airport' },
    { code: 'BCN', name: 'Barcelona', full: 'Barcelona El Prat Airport' },
    { code: 'MXP', name: 'Milan', full: 'Milan Malpensa Airport' },
    { code: 'ORD', name: 'Chicago', full: "O'Hare International Airport" },
    { code: 'DXB', name: 'Dubai', full: 'Dubai International Airport' },
    { code: 'SYD', name: 'Sydney', full: 'Sydney Kingsford Smith Airport' },
    { code: 'SIN', name: 'Singapore', full: 'Singapore Changi Airport' },
    { code: 'FRA', name: 'Frankfurt', full: 'Frankfurt Airport' },
    { code: 'AMS', name: 'Amsterdam', full: 'Amsterdam Schiphol Airport' },
    { code: 'MAD', name: 'Madrid', full: 'Adolfo Suárez Madrid–Barajas Airport' },
    { code: 'FCO', name: 'Rome', full: 'Leonardo da Vinci–Fiumicino Airport' },
    { code: 'IST', name: 'Istanbul', full: 'Istanbul Airport' },
    { code: 'DEL', name: 'New Delhi', full: 'Indira Gandhi International Airport' },
    { code: 'BOM', name: 'Mumbai', full: 'Chhatrapati Shivaji Maharaj International Airport' },
    { code: 'PEK', name: 'Beijing', full: 'Beijing Capital International Airport' },
    { code: 'PVG', name: 'Shanghai', full: 'Shanghai Pudong International Airport' },
    { code: 'ICN', name: 'Seoul', full: 'Incheon International Airport' },
    { code: 'BKK', name: 'Bangkok', full: 'Suvarnabhumi Airport' },
    { code: 'HKG', name: 'Hong Kong', full: 'Hong Kong International Airport' },
    { code: 'SVO', name: 'Moscow', full: 'Sheremetyevo International Airport' },
    { code: 'GRU', name: 'São Paulo', full: 'São Paulo/Guarulhos International Airport' },
    { code: 'MEX', name: 'Mexico City', full: 'Mexico City International Airport' },
    { code: 'YYZ', name: 'Toronto', full: 'Toronto Pearson International Airport' },
    { code: 'ATL', name: 'Atlanta', full: 'Hartsfield-Jackson Atlanta International Airport' },
    { code: 'DFW', name: 'Dallas', full: 'Dallas/Fort Worth International Airport' },
    { code: 'DEN', name: 'Denver', full: 'Denver International Airport' },
    { code: 'SEA', name: 'Seattle', full: 'Seattle-Tacoma International Airport' },
    { code: 'LAS', name: 'Las Vegas', full: 'Harry Reid International Airport' },
    { code: 'BOS', name: 'Boston', full: 'Logan International Airport' },
    { code: 'EWR', name: 'Newark', full: 'Newark Liberty International Airport' },
    { code: 'IAD', name: 'Washington', full: 'Washington Dulles International Airport' },
    { code: 'CLT', name: 'Charlotte', full: 'Charlotte Douglas International Airport' },
    { code: 'PHX', name: 'Phoenix', full: 'Phoenix Sky Harbor International Airport' }
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
    console.log('🚀 Velox initialized');
    
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

window.VeloxApp = {
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

console.log('✅ Velox ready - All systems operational');
