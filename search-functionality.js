
window.renderFlights = renderFlights;
document.addEventListener('DOMContentLoaded', () => setTimeout(() => renderFlights(), 500));
console.log('✅ Render ready');

window.renderFlights = renderFlights;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('Rendering...');
        if (window.flightDatabase) renderFlights();
    }, 500);
});
