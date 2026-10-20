# GeekDeal Digest

Private repository for the GeekDeal Digest MVP: gaming/nerd-culture news and curated US/Canada product offers.

## Current scope

- Static single-page site connected read-only to the dedicated Supabase project.
- Published offers and stories only; empty states are real, not demo content.
- Filters for market, category, store, condition, and price/date sorting.
- "Verified" badge is shown only for an actual offer-price check less than 24 hours old.
- Affiliate links are labeled near offers.
- Newsletter and outdated-deal reporting are intentionally inactive until a validated backend and email provider are implemented.
- No sample data is seeded in the database.

## Local preview

Open `index.html` via a local HTTP server. `supabase-config.js` holds the public project URL and Supabase publishable key. This key is designed for browser use and must remain protected by Row Level Security. **Never put a Supabase secret/service_role key in this repository or in browser code.**

## Database

The initial schema is at `supabase/migrations/20261020_initial_schema.sql`. It was applied to the dedicated Supabase project `geekdeal-digest` (`dzkbtgipmspwaglangep`, region `us-east-1`) and verified there. Do not apply it to the ChordProof project.

## Deployment

The owner authorized evaluation of Cloudflare Pages Free for an early commercial launch on 2026-10-20, confirmed the terms caveat, and authorized public publication **after initial real content is provided**. Do not publish an empty portal or fictitious content. Cloudflare's official self-serve terms and Developer Platform terms reviewed do not explicitly prohibit commercial use on the Free plan; a Cloudflare Community MVP reply (May 20, 2026) says Free plans can be used for business, while warning of no SLA, low traffic priority, shared IPs, and no direct technical support. This forum guidance is not contractual permission. The owner accepted this caveat. References: https://www.cloudflare.com/terms ; https://www.cloudflare.com/service-specific-terms-developer-platform/ ; https://community.cloudflare.com/t/use-free-plan-for-commercial-project-follow-up/732438

Pages supports static HTML and private GitHub repos. Current project setup is prepared in `build-pages.sh` plus `_headers`; build output contains only `index.html`, `supabase-config.js`, and `_headers`. Once initial real editorial content has been provided and published in Supabase, connect the private GitHub repository to Pages, set production branch `main`, build command `sh build-pages.sh`, output directory `dist-pages`, then deploy and verify the live URL. Pages Free limits are documented at https://developers.cloudflare.com/pages/platform/limits/.

No Cloudflare account has been connected and no Pages project/deployment exists yet. Do not deploy the empty portal or fabricated content. The owner may subscribe to Vercel Pro after the portal has generated its first financial return; do not deploy this commercial portal on Vercel Hobby.
