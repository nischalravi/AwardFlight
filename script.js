// Form submission handler
document.addEventListener('DOMContentLoaded', () => {
    // Set default dates
    const dateInputs = document.querySelectorAll('.input-date');
    if (dateInputs.length >= 2) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 10);
        
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };
        
        dateInputs[0].value = formatDate(today);
        dateInputs[0].min = formatDate(today);
        dateInputs[1].value = formatDate(tomorrow);
        dateInputs[1].min = formatDate(today);
    }

    // Search form submission
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form values
            const from = document.getElementById('input-from')?.value || 'JFK';
            const to = document.getElementById('input-to')?.value || 'MXP';
            const departure = document.getElementById('input-departure')?.value;
            const returnDate = document.getElementById('input-return')?.value;
            const passengers = document.getElementById('input-passengers')?.value || '2';
            const cabinClass = document.getElementById('input-class')?.value || 'business';
            
            // Validate
            if (!from || !to) {
                alert('Please enter both origin and destination airports');
                return;
            }
            
            // Navigate to search page
            window.location.href = `search.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&departure=${departure}&return=${returnDate}&passengers=${passengers}&class=${cabinClass}`;
        });
    }
});

// Tab switching
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
        const returnGroup = document.querySelector('.form-group:has(#input-return)');
        if (returnGroup) {
            if (this.dataset.tab === 'oneway') {
                returnGroup.style.display = 'none';
            } else {
                returnGroup.style.display = 'flex';
            }
        }
    });
});

// Airport swap with animation
document.querySelectorAll('.swap-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const fromInput = document.getElementById('input-from');
        const toInput = document.getElementById('input-to');
        
        if (fromInput && toInput) {
            const temp = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temp;
            
            // Add animation class
            this.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                this.style.transform = '';
            }, 300);
        }
    });
});

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.nav');

if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener('click', () => {
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('active');
    });
}

// Popular route cards click handler
document.querySelectorAll('.route-card').forEach(card => {
    const clickHandler = () => {
        const cityCode = card.querySelectorAll('.city-code');
        if (cityCode.length >= 2) {
            const from = cityCode[0].textContent;
            const to = cityCode[1].textContent;
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

// CTA buttons
document.querySelectorAll('.btn-cta').forEach(btn => {
    btn.addEventListener('click', () => {
        // Scroll to search widget
        const searchWidget = document.querySelector('.search-widget');
        if (searchWidget) {
            searchWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus first input
            setTimeout(() => {
                document.getElementById('input-from')?.focus();
            }, 500);
        }
    });
});

// Search button on other pages
document.querySelectorAll('.btn-search').forEach(btn => {
// Search button on other pages
document.querySelectorAll('.btn-search').forEach(btn => {
    if (!btn.closest('.search-form')) {
        btn.addEventListener('click', function() {
            window.location.href = 'search.html';
        });
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Update focus for accessibility
                target.setAttribute('tabindex', '-1');
                target.focus();
            }
        }
    });
});

// Animated counters for stats
function animateCounter(element, target, duration = 2000) {
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
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all feature cards and route cards
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.feature-card, .route-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
});

// Form validation helper
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
    const tracked = JSON.parse(localStorage.getItem('trackedPrices') || '[]');
    tracked.push({ route, price, date: new Date().toISOString() });
    localStorage.setItem('trackedPrices', JSON.stringify(tracked));
};

// Recent searches
const saveRecentSearch = (search) => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    recent.unshift(search);
    if (recent.length > 5) recent.pop();
    localStorage.setItem('recentSearches', JSON.stringify(recent));
};

// Toast notifications
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
        background: ${type === 'success' ? 'var(--accent-green)' : '#e74c3c'};
        color: var(--bg-primary);
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);

// Export functionality
window.VeloxApp = {
    trackPrice,
    saveRecentSearch,
    showToast,
    validateForm
};

// Service Worker Registration (for PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Only register if service-worker.js exists
        navigator.serviceWorker.register('/service-worker.js').catch(() => {
            // Silently fail if no service worker
        });
    });
}
    
