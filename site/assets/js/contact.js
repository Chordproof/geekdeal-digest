/* GeekDeal contact form client.
 *
 * The old inline script in contact.html showed a success banner without
 * sending anything. This posts to the same endpoint host as the newsletter
 * (GD_CONFIG.localEndpoint / newsletterEndpoint, with /contact instead of
 * /subscribe) and reports what actually happened.
 */
(function () {
  'use strict';

  var cfg = window.GD_CONFIG || {};
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var base = cfg.newsletterEndpoint || (isLocal ? cfg.localEndpoint : '') || '';
  var endpoint = base ? base.replace(/\/subscribe\/?$/, '/contact') : '';

  function msg(text, tone) {
    var el = document.getElementById('form-msg');
    if (!el) return;
    el.textContent = text;
    el.style.color = tone === 'error' ? 'var(--warn)' : 'var(--ok)';
    el.classList.add('show');
  }

  function init() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('c-name');
      var email = document.getElementById('c-email');
      var topic = document.getElementById('c-topic');
      var body = document.getElementById('c-msg');

      if (!name.value.trim()) { name.focus(); msg('Please add your name.', 'error'); return; }
      if (!email.value.trim() || !email.checkValidity()) {
        email.focus(); msg('Please enter a valid email address.', 'error'); return;
      }
      if (!body.value.trim() || body.value.trim().length < 10) {
        body.focus(); msg('Please describe the issue in a few more words.', 'error'); return;
      }
      if (!endpoint) {
        msg('The contact form is not connected yet. Email us directly in the meantime.', 'error');
        if (window.console) console.warn('[GeekDeal] Set GD_CONFIG.newsletterEndpoint to enable the contact form.');
        return;
      }

      var btn = form.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          topic: topic ? topic.value : 'other',
          message: body.value.trim(),
          website: ''
        })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          return { ok: r.ok, status: r.status, body: j };
        });
      }).then(function (r) {
        if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
        if (r.ok && r.body.ok) {
          msg('✓ Message received. We reply within two business days.', 'ok');
          form.reset();
          return;
        }
        if (r.status === 429) { msg('Too many messages. Please try again shortly.', 'error'); return; }
        msg('Something went wrong. Please try again.', 'error');
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
        msg('Network error — please try again.', 'error');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
