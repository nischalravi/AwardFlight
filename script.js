// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

// Airport swap
document.querySelectorAll('.swap-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const inputs = this.parentElement.querySelectorAll('.input-airport');
        if (inputs.length === 2) {
            const temp = inputs[0].value;
            inputs[0].value = inputs[1].value;
            inputs[1].value = temp;
        }
    });
});

// Search button
document.querySelectorAll('.btn-search').forEach(btn => {
    btn.addEventListener('click', function() {
        window.location.href = 'search.html';
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
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

// Observe elements for animation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
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

// Mobile menu toggle
const createMobileMenu = () => {
    const header = document.querySelector('.header');
    if (window.innerWidth <= 900 && !document.querySelector('.mobile-menu-btn')) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = '☰';
        menuBtn.style.cssText = `
            display: block;
            background: none;
            border: none;
            color: var(--text-primary);
            font-size: 1.5rem;
            cursor: pointer;
        `;
        header.querySelector('.container-header').appendChild(menuBtn);
        
        menuBtn.addEventListener('click', () => {
            const nav = document.querySelector('.nav');
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
            nav.style.position = 'absolute';
            nav.style.top = '100%';
            nav.style.left = '0';
            nav.style.right = '0';
            nav.style.background = 'var(--bg-card)';
            nav.style.flexDirection = 'column';
            nav.style.padding = '1rem';
        });
    }
};

window.addEventListener('resize', createMobileMenu);
createMobileMenu();

// Form validation
const validateForm = (form) => {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.style.borderColor = '#e74c3c';
        } else {
            input.style.borderColor = '';
        }
    });
    
    return isValid;
};

// Date input defaults
document.addEventListener('DOMContentLoaded', () => {
    const dateInputs = document.querySelectorAll('.input-date');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateInputs[0]) {
        dateInputs[0].valueAsDate = today;
        dateInputs[0].min = today.toISOString().split('T')[0];
    }
    if (dateInputs[1]) {
        dateInputs[1].valueAsDate = tomorrow;
        dateInputs[1].min = tomorrow.toISOString().split('T')[0];
    }
});

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

// Loading animation
const showLoading = (element) => {
    element.innerHTML = '<div class="loading-skeleton"></div>';
};

const hideLoading = (element, content) => {
    element.innerHTML = content;
};

// Toast notifications
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
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
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Export functionality
window.VeloxApp = {
    trackPrice,
    saveRecentSearch,
    showLoading,
    hideLoading,
    showToast,
    validateForm
};
