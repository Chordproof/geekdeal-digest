/* GeekDeal runtime configuration.
 *
 * newsletterEndpoint — where the newsletter form POSTs JSON.
 *   Leave empty until the endpoint is deployed; the form then tells visitors
 *   that signup is not connected instead of pretending to subscribe them.
 *
 *   Self-hosted (automation/newsletter_server.py):
 *     newsletterEndpoint: "https://newsletter.yourdomain.com/subscribe"
 *
 *   Third-party (Buttondown / MailerLite / ConvertKit) — see automation/README.md.
 *
 * analyticsEndpoint — first-party event collector (POST /collect).
 *   Leave empty to disable analytics entirely. When newsletterEndpoint is set,
 *   analytics.js derives /collect from it automatically, so a single host is
 *   enough. No cookies, no third-party script, no IP stored.
 *
 * localEndpoint — used automatically when the site is served from localhost,
 *   so the form can be tested end to end without touching production.
 */
window.GD_CONFIG = {
  siteName: 'GeekDeal',
  newsletterEndpoint: '',
  analyticsEndpoint: '',
  localEndpoint: 'http://localhost:8787/subscribe'
};
