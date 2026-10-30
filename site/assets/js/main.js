/* ==========================================================================
   GeekDeal — main.js
   Vanilla JS. No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '✕' : '☰';
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.textContent = '☰';
      }
    });
  }

  /* ---------- Deal rendering + filters ---------- */
  var state = { category: 'all', store: 'all', condition: 'all', sort: 'recent' };

  function money(amount, currency) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: currency
      }).format(amount);
    } catch (e) {
      return (currency === 'USD' ? '$' : currency + ' ') + Number(amount).toFixed(2);
    }
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        timeZone: 'America/New_York'
      });
    } catch (e) { return iso; }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function dealCard(d) {
    var pct = d.referencePrice && d.referencePrice > d.price
      ? Math.round((1 - d.price / d.referencePrice) * 100) : 0;

    var media =
      '<div class="deal-media">' +
        '<img src="' + esc(d.image) + '" alt="' + esc(d.title) + '" loading="lazy">' +
        '<span class="verified">Verified ' + esc(fmtDate(d.verifiedAt)) + '</span>' +
        (pct > 0 ? '<span class="discount">-' + pct + '%</span>' : '') +
      '</div>';

    var price =
      '<div class="price-row">' +
        '<span class="price-now">' + esc(money(d.price, d.currency)) + '</span>' +
        (d.referencePrice
          ? '<span class="price-was">Was ' + esc(money(d.referencePrice, d.currency)) + '</span>' +
            '<span class="price-note">Reference logged ' + esc(fmtDate(d.referenceLoggedAt)) + '</span>'
          : '') +
      '</div>';

    var coupon = d.coupon
      ? '<span class="coupon">🏷 ' + esc(d.coupon) + '</span>' : '';

    return '<article class="deal" data-id="' + esc(d.id) + '">' +
      media +
      '<div class="deal-body">' +
        '<span class="deal-store">' + esc(d.store) + ' · ' + esc(d.condition) + '</span>' +
        '<h3 class="deal-title"><a href="' + esc(d.url) + '" rel="nofollow sponsored noopener" target="_blank">' +
          esc(d.title) + '</a></h3>' +
        price + coupon +
        '<a class="deal-cta" href="' + esc(d.url) + '" rel="nofollow sponsored noopener" target="_blank" data-deal-id="' + esc(d.id) + '" data-store="' + esc(d.store) + '">' +
          'View deal at ' + esc(d.store) + ' →</a>' +
        '<div class="deal-foot">' +
          '<span class="disclosure-inline">Affiliate link — we may earn a commission.</span>' +
          '<button class="report" data-report="' + esc(d.id) + '">Report outdated</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderDeals(grid) {
    if (!grid) grid = document.getElementById('deal-grid');
    if (!grid) return;
    var srcName = grid.getAttribute('data-source') || 'GD_DEALS';
    var source = window[srcName];
    if (!source) return;

    var items = source.slice();

    if (state.category !== 'all') {
      items = items.filter(function (d) { return d.category === state.category; });
    }
    if (state.store !== 'all') {
      items = items.filter(function (d) { return d.store === state.store; });
    }
    if (state.condition !== 'all') {
      items = items.filter(function (d) { return d.condition === state.condition; });
    }

    if (state.sort === 'recent') {
      items.sort(function (a, b) { return new Date(b.verifiedAt) - new Date(a.verifiedAt); });
    } else if (state.sort === 'price-asc') {
      items.sort(function (a, b) { return a.price - b.price; });
    } else if (state.sort === 'price-desc') {
      items.sort(function (a, b) { return b.price - a.price; });
    } else if (state.sort === 'discount') {
      items.sort(function (a, b) {
        var da = a.referencePrice ? 1 - a.price / a.referencePrice : 0;
        var db = b.referencePrice ? 1 - b.price / b.referencePrice : 0;
        return db - da;
      });
    }

    var limit = parseInt(grid.getAttribute('data-limit') || '0', 10);
    if (limit > 0) items = items.slice(0, limit);

    grid.innerHTML = items.length
      ? items.map(dealCard).join('')
      : '<div class="empty">No deals match these filters. Try clearing one.</div>';

    var count = document.getElementById('filter-count');
    if (count && grid.id === 'deal-grid') {
      count.innerHTML = 'Showing <b>' + items.length + '</b> of ' +
        source.length + ' deals';
    }
  }

  function initFilters() {
    var grid = document.getElementById('deal-grid');
    if (grid) {
      ['category', 'store', 'condition', 'sort'].forEach(function (key) {
        var el = document.getElementById('f-' + key);
        if (!el) return;
        el.addEventListener('change', function () {
          state[key] = el.value;
          renderDeals(grid);
        });
      });
      renderDeals(grid);
    }

    /* secondary grids (home previews) */
    document.querySelectorAll('[data-deal-grid]').forEach(function (g) {
      renderDeals(g);
    });
  }

  /* ---------- Report outdated deal ---------- */
  function initReport() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-report]');
      if (!btn) return;
      var id = btn.getAttribute('data-report');
      var card = btn.closest('.deal');
      btn.textContent = 'Reported ✓';
      btn.style.color = 'var(--ok)';
      btn.disabled = true;
      if (card) card.style.opacity = '0.6';
      try {
        var log = JSON.parse(localStorage.getItem('gd_reports') || '[]');
        log.push({ id: id, at: new Date().toISOString() });
        localStorage.setItem('gd_reports', JSON.stringify(log));
      } catch (err) { /* storage unavailable */ }
      setTimeout(function () {
        btn.textContent = 'Report outdated';
        btn.style.color = '';
        btn.disabled = false;
        if (card) card.style.opacity = '1';
      }, 4000);
    });
  }


  /* ---------- Year ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initFilters();
    initReport();
    initYear();
  });
})();
