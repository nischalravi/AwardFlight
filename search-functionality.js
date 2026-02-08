// ============================================
// SEARCH PAGE FUNCTIONALITY
// ============================================

let currentFilters = {
    priceMax: 2000,
    stops: { 0: true, 1: true, 2: false },
    airlines: {
        'Air France': true,
        'British Airways': true,
        'Lufthansa': true,
        'Emirates': false
    },
    departTime: {
        'morning': true,
        'afternoon': true,
        'evening': false
    }
};

let currentView = 'price'; // or 'points'

// ============================================
// RENDER FLIGHT CARDS
// ============================================

function renderFlights() {
    const filteredFlights = flightDatabase.filter(flight => {
        if (flight.price > currentFilters.priceMax) return false;
        if (!currentFilters.stops[flight.stops]) return false;
        if (!currentFilters.airlines[flight.airline]) return false;
        if (!currentFilters.departTime[flight.departTimeCategory]) return false;
        return true;
    });

    const container = document.getElementById('flights-container');
    document.getElementById('results-count').textContent = filteredFlights.length;

    container.innerHTML = filteredFlights.map(flight => createFlightCard(flight)).join('');
    
    // Add event listeners to award toggles
    document.querySelectorAll('.award-toggle').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const details = this.closest('.award-info').querySelector('.award-details-expanded');
            details.classList.toggle('show');
            this.textContent = details.classList.contains('show') ? 'Hide Details ▲' : 'Show Details ▼';
        });
    });

    // Add click handler to select buttons
    document.querySelectorAll('.btn-select').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            window.location.href = 'dashboard.html';
        });
    });

    updateFilterCounts();
}

function createFlightCard(flight) {
    const cabinClass = 'business'; // Would come from search params
    const milesNeeded = flight.awardMiles.businessClass;
    
    return `
        <div class="flight-card">
            <div class="flight-header">
                <div class="airline-info">
                    <div class="airline-logo" style="background: ${flight.logoColor};">${flight.logo}</div>
                    <div class="airline-details">
                        <div class="airline-name">${flight.airline}</div>
                        <div class="flight-code">${flight.code} • ${flight.aircraft}</div>
                    </div>
                </div>
                <div class="price-info">
                    <div class="price-badge">$${flight.price.toLocaleString()}</div>
                    <div class="points-info">
                        or <span class="points-value">${milesNeeded.toLocaleString()} miles</span>
                    </div>
                </div>
            </div>

            <!-- Award Information -->
            <div class="award-info">
                <div class="award-header">
                    <div class="award-title">💎 Award Availability via ${flight.awardMiles.program}</div>
                    <button class="award-toggle">Show Details ▼</button>
                </div>
                
                <div class="award-details-expanded">
                    <div class="award-options">
                        <div class="award-option">
                            <span class="award-airline">Economy</span>
                            <span><span class="award-points">${flight.awardMiles.economyClass.toLocaleString()}</span><span class="award-miles-label">miles</span></span>
                        </div>
                        <div class="award-option">
                            <span class="award-airline">Business</span>
                            <span><span class="award-points">${flight.awardMiles.businessClass.toLocaleString()}</span><span class="award-miles-label">miles</span></span>
                        </div>
                        ${flight.awardMiles.firstClass ? `
                        <div class="award-option">
                            <span class="award-airline">First Class</span>
                            <span><span class="award-points">${flight.awardMiles.firstClass.toLocaleString()}</span><span class="award-miles-label">miles</span></span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="transfer-partners">
                        <div class="transfer-label">✨ Transfer from these credit cards:</div>
                        <div class="credit-cards">
                            ${flight.transferPartners.map(partner => `
                                <div class="credit-card-badge ${partner.class}" title="Transfer ratio: ${partner.ratio}">
                                    ${partner.name}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="flight-route">
                <div class="route-point">
                    <div class="route-time">${flight.departTime}</div>
                    <div class="route-airport">${flight.departAirport}</div>
                </div>

                <div class="route-visual">
                    <div class="route-duration">${flight.duration}</div>
                    <div class="route-line"></div>
                    <div class="route-stops">${flight.stopInfo}</div>
                </div>

                <div class="route-point">
                    <div class="route-time">${flight.arriveTime}</div>
                    <div class="route-airport">${flight.arriveAirport}</div>
                </div>
            </div>

            <div class="flight-details">
                <div class="detail-item">
                    <span>⚡</span>
                    <span>${flight.legroom}</span>
                </div>
                <div class="detail-item">
                    <span>📺</span>
                    <span>${flight.entertainment ? 'In-flight entertainment' : 'No entertainment'}</span>
                </div>
                <div class="detail-item">
                    <span>🍽️</span>
                    <span>${flight.meal}</span>
                </div>
                <button class="btn-select">Select Flight</button>
            </div>
        </div>
    `;
}

// ============================================
// FILTER HANDLERS
// ============================================

function updateFilterCounts() {
    const counts = {
        stops: { 0: 0, 1: 0, 2: 0 },
        airlines: {},
        departTime: { morning: 0, afternoon: 0, evening: 0 }
    };

    flightDatabase.forEach(flight => {
        if (flight.price <= currentFilters.priceMax) {
            counts.stops[flight.stops]++;
            counts.airlines[flight.airline] = (counts.airlines[flight.airline] || 0) + 1;
            counts.departTime[flight.departTimeCategory]++;
        }
    });

    document.querySelectorAll('.filter-option').forEach(option => {
        const label = option.querySelector('label span:first-child').textContent;
        const countSpan = option.querySelector('.filter-count');
        
        if (label === 'Non-stop') countSpan.textContent = counts.stops[0];
        if (label === '1 Stop') countSpan.textContent = counts.stops[1];
        if (label === '2+ Stops') countSpan.textContent = counts.stops[2];
        
        if (counts.airlines[label]) countSpan.textContent = counts.airlines[label];
        
        if (label.includes('Morning')) countSpan.textContent = counts.departTime.morning;
        if (label.includes('Afternoon')) countSpan.textContent = counts.departTime.afternoon;
        if (label.includes('Evening')) countSpan.textContent = counts.departTime.evening;
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || 'JFK';
    const to = params.get('to') || 'MXP';
    const departure = params.get('departure');
    const returnDate = params.get('return');
    const passengers = params.get('passengers') || '2';
    const cabinClass = params.get('class') || 'business';

    // Update header
    document.getElementById('header-from').textContent = from;
    document.getElementById('header-to').textContent = to;
    if (departure && returnDate) {
        const deptDate = new Date(departure).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const retDate = new Date(returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        document.getElementById('header-dates').textContent = `${deptDate} - ${retDate}`;
    }
    document.getElementById('header-class').textContent = `${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)} • ${passengers} Passenger${passengers > 1 ? 's' : ''}`;

    // Initial render
    renderFlights();

    // Filter checkboxes
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', function() {
            const checkbox = this.querySelector('.checkbox');
            checkbox.classList.toggle('checked');
            
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;
            const isChecked = checkbox.classList.contains('checked');
            
            if (filterType === 'stops') {
                currentFilters.stops[filterValue] = isChecked;
            } else if (filterType === 'airline') {
                currentFilters.airlines[filterValue] = isChecked;
            } else if (filterType === 'time') {
                currentFilters.departTime[filterValue] = isChecked;
            }
            
            renderFlights();
        });
    });

    // Price slider
    const priceSlider = document.querySelector('.price-slider');
    priceSlider.addEventListener('input', function() {
        currentFilters.priceMax = parseInt(this.value);
        const priceRange = document.querySelector('.price-range span:last-child');
        priceRange.textContent = currentFilters.priceMax >= 2000 ? '$2,000+' : `$${currentFilters.priceMax.toLocaleString()}`;
        renderFlights();
    });

    // Sort dropdown
    document.getElementById('sort-select').addEventListener('change', function() {
        const sortBy = this.value;
        
        if (sortBy === 'Lowest Price') {
            flightDatabase.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'Fewest Miles') {
            flightDatabase.sort((a, b) => a.awardMiles.businessClass - b.awardMiles.businessClass);
        } else if (sortBy === 'Shortest Duration') {
            flightDatabase.sort((a, b) => {
                const getDuration = (d) => {
                    const parts = d.match(/(\d+)h\s*(\d+)m/);
                    return parseInt(parts[1]) * 60 + parseInt(parts[2]);
                };
                return getDuration(a.duration) - getDuration(b.duration);
            });
        } else if (sortBy === 'Earliest Departure') {
            flightDatabase.sort((a, b) => {
                const getMinutes = (t) => {
                    const [time, period] = t.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                };
                return getMinutes(a.departTime) - getMinutes(b.departTime);
            });
        }
        
        renderFlights();
    });

    // View toggle (Price vs Points)
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (this.textContent.includes('Points')) {
                currentView = 'points';
                // Could update display to show miles-based sorting
            } else {
                currentView = 'price';
            }
        });
    });
});

console.log('✅ Search page initialized with award miles data');
