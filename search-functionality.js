// ============================================
// SEARCH FUNCTIONALITY WITH PRICE/POINTS TOGGLE
// ============================================

let currentFilters = {
    priceMax: 2000,
    stops: { 0: true, 1: true, 2: true },
    airlines: {
        'Air France': true,
        'British Airways': true,
        'Lufthansa': true,
        'Emirates': true
    },
    departTime: {
        'morning': true,
        'afternoon': true,
        'evening': true
    }
};

let currentView = 'price'; // 'price' or 'points'

function renderFlights() {
    if (!window.flightDatabase) {
        console.error('Flight database not loaded');
        return;
    }
    
    const filteredFlights = window.flightDatabase.filter(flight => {
        if (flight.price > currentFilters.priceMax) return false;
        if (!currentFilters.stops[flight.stops]) return false;
        if (!currentFilters.airlines[flight.airline]) return false;
        if (!currentFilters.departTime[flight.departTimeCategory]) return false;
        return true;
    });

    const container = document.getElementById('flights-container');
    const countElement = document.getElementById('results-count');
    
    if (countElement) {
        countElement.textContent = filteredFlights.length;
    }

    if (container) {
        container.innerHTML = filteredFlights.map(flight => createFlightCard(flight)).join('');
        
        // Add event listeners
        document.querySelectorAll('.award-toggle').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const details = this.closest('.award-info').querySelector('.award-details-expanded');
                details.classList.toggle('show');
                this.textContent = details.classList.contains('show') ? 'Hide Details ▲' : 'Show Details ▼';
            });
        });

        document.querySelectorAll('.btn-select').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                window.location.href = 'dashboard.html';
            });
        });
    }

    updateFilterCounts();
}

function createFlightCard(flight) {
    const cabinClass = 'business';
    const milesNeeded = flight.awardMiles.businessClass;
    
    // Display based on current view
    const displayPrice = currentView === 'points' 
        ? `${milesNeeded.toLocaleString()} pts`
        : `$${flight.price.toLocaleString()}`;
    
    const priceBadgeColor = currentView === 'points'
        ? 'background: linear-gradient(135deg, #4a9cff, #357abd); color: #ffffff;'
        : 'background: #c5ff68; color: #0a0f1e;';
    
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
                    <div class="price-badge" style="${priceBadgeColor}">${displayPrice}</div>
                    <div class="points-info">
                        ${currentView === 'price' ? `or <span class="points-value">${milesNeeded.toLocaleString()} miles</span>` : `or <span class="points-value">$${flight.price.toLocaleString()}</span>`}
                    </div>
                </div>
            </div>

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
                <div class="detail-item"><span>⚡</span><span>${flight.legroom}</span></div>
                <div class="detail-item"><span>📺</span><span>${flight.entertainment ? 'Entertainment' : 'No entertainment'}</span></div>
                <div class="detail-item"><span>🍽️</span><span>${flight.meal}</span></div>
                <button class="btn-select">Select Flight</button>
            </div>
        </div>
    `;
}

function updateFilterCounts() {
    const counts = {
        stops: { 0: 0, 1: 0, 2: 0 },
        airlines: {},
        departTime: { morning: 0, afternoon: 0, evening: 0 }
    };

    window.flightDatabase.forEach(flight => {
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

document.addEventListener('DOMContentLoaded', () => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || 'JFK';
    const to = params.get('to') || 'MXP';
    
    // Update header
    if (document.getElementById('header-from')) {
        document.getElementById('header-from').textContent = from;
    }
    if (document.getElementById('header-to')) {
        document.getElementById('header-to').textContent = to;
    }

    // Initial render
    setTimeout(() => {
        if (window.flightDatabase) {
            renderFlights();
            console.log('✅ Rendered', window.flightDatabase.length, 'flights');
        }
    }, 500);

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
    if (priceSlider) {
        priceSlider.addEventListener('input', function() {
            currentFilters.priceMax = parseInt(this.value);
            const priceRange = document.querySelector('.price-range span:last-child');
            if (priceRange) {
                priceRange.textContent = currentFilters.priceMax >= 2000 ? '$2,000+' : `$${currentFilters.priceMax.toLocaleString()}`;
            }
            renderFlights();
        });
    }

    // Sort dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            
            if (sortBy === 'Lowest Price') {
                window.flightDatabase.sort((a, b) => a.price - b.price);
            } else if (sortBy === 'Fewest Miles') {
                window.flightDatabase.sort((a, b) => a.awardMiles.businessClass - b.awardMiles.businessClass);
            }
            
            renderFlights();
        });
    }

    // Price/Points Toggle - THE FIX!
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            currentView = this.textContent.includes('Points') ? 'points' : 'price';
            console.log('Switched to:', currentView);
            renderFlights(); // Re-render with new view
        });
    });
});

// Export
window.renderFlights = renderFlights;
console.log('✅ Search functionality ready');
