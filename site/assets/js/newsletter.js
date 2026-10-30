/* GeekDeal newsletter client.
 *
 * Replaces the old fake handler in main.js, which showed "You are subscribed"
 * without sending anything anywhere.
 *
 * Configuration lives in assets/data/site-config.js:
 *   window.GD_CONFIG = { newsletterEndpoint: "https://host/subscribe" }
 *
 * Behaviour:
 *   - validates the email and the consent checkbox before sending
 *   - POSTs JSON to the endpoint, with a honeypot field bots love to fill
 *   - shows real states: sending / subscribed / already / error / not configured
 *   - remembers success in localStorage so the form does not nag on reload
 */
(function () {
  'use strict';

  var cfg = window.GD_CONFIG || {};
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var endpoint = cfg.newsletterEndpoint || (isLocal ? cfg.localEndpoint : '') || '';
  var STORAGE_KEY = 'gd_subscribed';

  function setMsg(form, text, tone) {
    var msg = form.querySelector('.nl-msg');
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = tone === 'error' ? 'var(--warn)'
      : tone === 'info' ? 'var(--muted)'
      : 'var(--ok)';
    msg.classList.add('show');
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type=submit]');
    if (!btn) return;
    if (!btn.dataset.label) btn.dataset.label = btn.textContent;
    btn.disabled = busy;
    btn.textContent = busy ? 'Sending…' : btn.dataset.label;
    btn.style.opacity = busy ? '.7' : '';
  }

  function alreadySubscribed() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }

  function remember() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* private mode */ }
  }

  function send(form, payload) {
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { status: res.status, body: body };
      });
    });
  }

  function handle(form) {
    var email = form.querySelector('input[type=email]');
    var consent = form.querySelector('input[type=checkbox]');
    var honey = form.querySelector('input[name=website]');

    var isAlert = form.getAttribute('data-source') === 'alert';
    if (!isAlert && alreadySubscribed()) {
      setMsg(form, '✓ You are already on the list.', 'ok');
      return;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var value = (email && email.value || '').trim();
      if (!value || !email.checkValidity()) {
        setMsg(form, 'Please enter a valid email address.', 'error');
        if (email) email.focus();
        return;
      }
      if (consent && !consent.checked) {
        setMsg(form, 'Please confirm consent to receive emails.', 'error');
        consent.focus();
        return;
      }
      if (!endpoint) {
        setMsg(form, 'Newsletter signup is not connected yet — please check back shortly.', 'info');
        if (window.console) console.warn('[GeekDeal] Set GD_CONFIG.newsletterEndpoint in assets/data/site-config.js');
        return;
      }

      setBusy(form, true);
      send(form, {
        email: value,
        consent: true,
        source: form.getAttribute('data-source') || 'site',
        dealId: form.getAttribute('data-deal') || undefined,
        targetPrice: form.getAttribute('data-target') ? Number(form.getAttribute('data-target')) : undefined,
        website: honey ? honey.value : ''
      }).then(function (r) {
        setBusy(form, false);
        if (r.status === 200 && r.body && r.body.ok) {
          if (isAlert) {
            setMsg(form, '\u2713 Alert set. We will email you if the price drops.', 'ok');
            remember(); form.reset(); return;
          }
          setMsg(form, r.body.status === 'already'
            ? '✓ You are already on the list.'
            : '✓ You are subscribed. Check your inbox to confirm.', 'ok');
          remember();
          form.reset();
          return;
        }
        if (r.status === 429) {
          setMsg(form, 'Too many attempts. Please try again in a minute.', 'error');
          return;
        }
        if (r.body && r.body.error === 'invalid_email') {
          setMsg(form, 'That email address does not look right.', 'error');
          return;
        }
        if (r.body && r.body.error === 'consent_required') {
          setMsg(form, 'Please confirm consent to receive emails.', 'error');
          return;
        }
        setMsg(form, 'Something went wrong. Please try again.', 'error');
      }).catch(function () {
        setBusy(form, false);
        setMsg(form, 'Network error — please try again.', 'error');
      });
    });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.nl-form'), handle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
