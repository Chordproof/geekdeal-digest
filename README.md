# GeekDeal Digest

Verified deals, reviews and buying guides for PC hardware, gaming gear, consumer tech and geek culture — for readers in the United States.

**Live site:** https://geekdealdigest.com

---

## What this is

GeekDeal Digest is a static site that publishes price information pulled from retailers' own public feeds. Every deal card carries the timestamp of the last verification. We never invent a "was" price and we never run a fake countdown.

The site is plain HTML, one shared stylesheet and two small JavaScript files. There is no build step, no framework and no bundler.

---

## Stack

| Layer | Technology |
|---|---|
| Pages | Static HTML5 |
| Styling | Single shared CSS file (`assets/style.css`) |
| Data | Supabase REST API (PostgREST), called with native `fetch` |
| Hosting | Cloudflare Pages |
| Pipeline | Python, runs separately on GitHub Actions every 6 hours |

---

## Repository structure

```text
site/
├── index.html              Home
├── about.html              About and verification methodology
├── contact.html            Contact and corrections
├── newsletter.html         Newsletter signup (form disabled until provider connected)
├── disclosure.html         Affiliate disclosure (FTC 16 CFR Part 255)
├── privacy.html            Privacy policy (GDPR + CCPA/CPRA)
├── terms.html              Terms of use
├── sitemap.xml             Sitemap
├── robots.txt              Crawler rules
├── _headers                Cloudflare Pages security and cache headers
├── assets/
│   ├── style.css           Shared stylesheet
│   ├── supabase.js         Data access layer (window.GeekDeal)
│   └── deals-render.js     Deal card rendering (window.GeekDealRender)
├── deals/
│   └── index.html          Deal feed with filters and sorting
├── reviews/
│   └── index.html          Reviews and comparisons listing
└── guides/
    └── index.html          Buying guides listing
