/* GeekDeal — first-party, cookie-free analytics.
   Sends two events to our own /collect endpoint: pageview and deal_click.
   No cookies, no IP stored, no third-party script. Do Not Track is honoured. */
(function () {
  'use strict';

  var cfg = window.GD_CONFIG || {};
  var endpoint = cfg.analyticsEndpoint ||
    (cfg.newsletterEndpoint ? cfg.newsletterEndpoint.replace(/\/subscribe\/?$/, '/collect') : '');

  // Local preview: fall back to the dev server, but never break the page.
  if (!endpoint && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    endpoint = 'http://localhost:8787/collect';
  }
  if (!endpoint) return;

  function optedOut() {
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') return true;
    if (navigator.globalPrivacyControl === true) return true;
    try { return localStorage.getItem('gd_analytics_optout') === '1'; } catch (e) { return false; }
  }
  if (optedOut()) return;

  function sid() {
    try {
      var s = sessionStorage.getItem('gd_sid');
      if (!s) {
        s = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        sessionStorage.setItem('gd_sid', s);
      }
      return s;
    } catch (e) { return ''; }
  }

  function uaClass() {
    var w = window.innerWidth || 0;
    return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  }

  var queue = [];
  var timer = null;

  function flush() {
    timer = null;
    if (!queue.length) return;
    var batch = queue.splice(0, 20);
    var body = JSON.stringify({ events: batch });
    // fetch first: a JSON Blob through sendBeacon is not CORS-safelisted and
    // fails silently, so beacon is only the last-resort fallback (text/plain).
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
        credentials: 'omit'
      }).catch(function () {
        try {
          if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }));
          }
        } catch (e) { /* never break the page for analytics */ }
      });
    } catch (e) { /* never break the page for analytics */ }
  }

  function push(event) {
    queue.push(event);
    if (!timer) timer = setTimeout(flush, 800);
  }

  function baseEvent(type) {
    return {
      type: type,
      path: location.pathname + location.search,
      ref: document.referrer || '',
      sid: sid(),
      ua_class: uaClass()
    };
  }

  // Pageview
  push(baseEvent('pageview'));

  // Deal clicks: any anchor tagged with data-deal-id, or any outbound store link.
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
    if (!a) return;
    var deal = a.getAttribute('data-deal-id');
    var href = a.getAttribute('href') || '';
    var outbound = /^https?:\/\//i.test(href) && href.indexOf(location.host) === -1;
    if (!deal && !outbound) return;
    var e = baseEvent(deal ? 'deal_click' : 'outbound');
    e.deal = deal || '';
    e.store = a.getAttribute('data-store') || '';
    push(e);
  }, true);

  // Flush on the way out.
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });

  // Expose a tiny opt-out hook for the privacy page.
  window.gdAnalyticsOptOut = function () {
    try { localStorage.setItem('gd_analytics_optout', '1'); } catch (e) {}
  };
})();
