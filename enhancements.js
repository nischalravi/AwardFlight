// ============================================
// AWARD FLIGHTS ENHANCEMENTS
// Point.me Inspired Features
// ============================================

// Points Value Calculator
document.addEventListener('DOMContentLoaded', () => {
    const pointsInput = document.getElementById('calc-points');
    const programSelect = document.getElementById('calc-program');
    
    if (pointsInput && programSelect) {
        const calculateValue = () => {
            const points = parseInt(pointsInput.value) || 0;
            const centsPerPoint = parseFloat(programSelect.value);
            
            // Portal value (standard redemption)
            const portalValue = (points * centsPerPoint) / 100;
            
            // Smart booking value (2.5x multiplier for optimal transfers)
            const smartValue = (points * centsPerPoint * 2.5) / 100;
            
            // Update display
            document.querySelector('.result-value.portal').textContent = 
                '$' + portalValue.toLocaleString('en-US', { maximumFractionDigits: 0 });
            
            document.querySelector('.result-value.smart').textContent = 
                '$' + smartValue.toLocaleString('en-US', { maximumFractionDigits: 0 });
            
            const savings = smartValue - portalValue;
            const savingsPct = Math.round((savings / portalValue) * 100);
            
            document.querySelector('.calc-savings').textContent = 
                `💰 You could save $${savings.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${savingsPct}% more value!)`;
        };
        
        pointsInput.addEventListener('input', calculateValue);
        programSelect.addEventListener('change', calculateValue);
        
        // Initial calculation
        calculateValue();
    }
});

// FAQ Accordion
document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other FAQs
        document.querySelectorAll('.faq-item').forEach(otherItem => {
            otherItem.classList.remove('active');
        });
        
        // Toggle current FAQ
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Animated Number Counters
const animateCounters = () => {
    const counterElements = document.querySelectorAll('.value-number');
    
    counterElements.forEach(element => {
        const text = element.textContent;
        const hasPercent = text.includes('%');
        const hasMoney = text.includes('$');
        const hasPlus = text.includes('+');
        
        // Extract number
        let target = parseInt(text.replace(/[^0-9]/g, ''));
        if (isNaN(target)) return;
        
        let current = 0;
        const increment = target / 50; // 50 steps
        const duration = 2000; // 2 seconds
        const stepTime = duration / 50;
        
        const counter = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(counter);
            }
            
            let display = Math.floor(current).toLocaleString();
            if (hasMoney) display = '$' + display;
            if (hasPlus) display += '+';
            if (hasPercent) display = Math.floor(current) + '-' + (Math.floor(current) + 40) + '%';
            
            element.textContent = display;
        }, stepTime);
    });
};

// Trigger counter animation when scrolled into view
const observeCounters = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            observeCounters.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const valuePropsSection = document.querySelector('.value-props-section');
if (valuePropsSection) {
    observeCounters.observe(valuePropsSection);
}

// Deal Cards - Click to search
document.querySelectorAll('.deal-card').forEach(card => {
    card.addEventListener('click', () => {
        const route = card.querySelector('.deal-route')?.textContent;
        if (route) {
            const [from, to] = route.split('→').map(s => s.trim());
            window.location.href = `search.html?from=${from}&to=${to}`;
        }
    });
});

// Story Cards - Click for more info
document.querySelectorAll('.story-card').forEach(card => {
    card.addEventListener('click', () => {
        const title = card.querySelector('h3')?.textContent;
        const points = card.querySelector('.points-badge')?.textContent;
        
        // Could open a modal with full story details
        console.log(`Story clicked: ${title} - ${points}`);
    });
});

// Enhanced Search Button Text
const searchBtn = document.querySelector('.btn-search');
if (searchBtn) {
    const originalText = searchBtn.innerHTML;
    
    searchBtn.addEventListener('mouseenter', () => {
        searchBtn.querySelector('span').textContent = 'Find Deals Now';
    });
    
    searchBtn.addEventListener('mouseleave', () => {
        searchBtn.querySelector('span').textContent = 'Search 100+ Airlines';
    });
}

// Social Proof Animation
const socialProofBadge = document.querySelector('.social-proof-badge');
if (socialProofBadge) {
    // Subtle floating animation
    let direction = 1;
    setInterval(() => {
        const current = parseFloat(socialProofBadge.style.transform.replace(/[^0-9.-]/g, '')) || 0;
        const newPos = current + (direction * 0.5);
        
        if (newPos > 3 || newPos < -3) direction *= -1;
        
        socialProofBadge.style.transform = `translateY(${newPos}px)`;
    }, 50);
}

// Track user interactions for analytics
window.trackEvent = (category, action, label) => {
    console.log(`Event: ${category} - ${action} - ${label}`);
    // Add Google Analytics or other tracking here
};

// Export functions
window.AwardFlightsEnhanced = {
    animateCounters,
    trackEvent
};

console.log('✅ Enhancements loaded - Point.me inspired features active');
