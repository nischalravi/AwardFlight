/* public/script.js
   Shared logic: airport autocomplete, scroll animations, toast system
   Design system: TravelNexus dark theme
*/

(function () {
  'use strict';

  // ── Airport Autocomplete ──
  function getDB() {
    return Array.isArray(window.AIRPORTS_DB) ? window.AIRPORTS_DB : [];
  }

  function scoreAirport(a, q) {
    const code = (a.code || '').toUpperCase();
    const city = (a.city || '').toLowerCase();
    const airport = (a.airport || '').toLowerCase();
    const ql = q.toLowerCase();
    const qu = q.toUpperCase();

    if (code === qu) return 300;
    if (code.startsWith(qu)) return 200;
    if (city.startsWith(ql)) return 150;
    if (airport.startsWith(ql)) return 120;
    if (code.includes(qu)) return 80;
    if (city.includes(ql)) return 60;
    if (airport.includes(ql)) return 40;
    return 0;
  }

  function searchAirports(q, limit) {
    if (!q || q.length < 1) return [];
    const db = getDB();
    return db
      .map(a => ({ a, s: scoreAirport(a, q) }))
      .filter(x => x.s > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, limit || 8)
      .map(x => x.a);
  }

  function createAutocomplete(input) {
    if (!input) return;
    const parent = input.parentElement;
    parent.style.position = 'relative';

    let dd = parent.querySelector('.airport-dd');
    if (!dd) {
      dd = document.createElement('div');
      dd.className = 'airport-dd';
      parent.appendChild(dd);
    }

    function hide() { dd.classList.remove('open'); dd.innerHTML = ''; }

    function show(matches) {
      if (!matches.length) { hide(); return; }
      dd.innerHTML = matches.map(a => {
        const code = (a.code || '').toUpperCase();
        const city = a.city || '';
        const country = a.country || '';
        const name = a.airport || '';
        return `<div class="airport-dd-item" data-value="${code} — ${city}">
          <span style="font-family:var(--font-mono);font-weight:700;color:var(--accent);">${code}</span>
          <span style="font-size:13px;">${city}${country ? ', ' + country : ''}</span>
        </div>`;
      }).join('');
      dd.classList.add('open');

      dd.querySelectorAll('.airport-dd-item').forEach(item => {
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          input.value = item.getAttribute('data-value');
          hide();
        });
      });
    }

    input.addEventListener('input', () => {
      const q = (input.value || '').trim();
      if (q.length < 1) { hide(); return; }
      // extract query: if "BOS — Boston" typed, search on first part
      const searchQ = q.split(/[—\-]/)[0].trim();
      show(searchAirports(searchQ, 8));
    });

    input.addEventListener('focus', () => {
      const q = (input.value || '').trim();
      if (q.length >= 2) {
        const searchQ = q.split(/[—\-]/)[0].trim();
        show(searchAirports(searchQ, 8));
      }
    });

    input.addEventListener('blur', () => setTimeout(hide, 160));
    input.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  }

  // Init autocomplete on all .input-airport elements
  function initAutocomplete() {
    document.querySelectorAll('.input-airport, .input').forEach(input => {
      if (input.classList.contains('input-airport') || input.id === 'input-from' || input.id === 'input-to') {
        createAutocomplete(input);
      }
    });
  }

  // Run on DOM ready + when airports DB loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutocomplete);
  } else {
    initAutocomplete();
  }
  window.addEventListener('airportsdb:ready', initAutocomplete);

  // ── Toast system ──
  window.showToast = function (msg, type) {
    type = type || 'success';
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position:fixed;bottom:2rem;right:2rem;padding:14px 24px;border-radius:var(--radius-sm);
      font-weight:700;z-index:9999;animation:fadeInUp .3s;box-shadow:var(--shadow-lg);
      background:${type === 'error' ? 'var(--red)' : 'var(--accent)'};color:var(--bg);`;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3000);
  };

  // ── Recent searches ──
  window.saveRecentSearch = function (s) {
    try {
      const arr = JSON.parse(localStorage.getItem('af_recent') || '[]');
      arr.unshift(s);
      if (arr.length > 5) arr.pop();
      localStorage.setItem('af_recent', JSON.stringify(arr));
    } catch (_) {}
  };

  // ── Expose ──
  window.AwardFlightsApp = { searchAirports, createAutocomplete, initAutocomplete };
})();
