# GeekDeal Digest

Private repository for the GeekDeal Digest MVP: gaming/nerd-culture news and curated US/Canada product offers.

## Current scope

- Static single-page site connected read-only to the dedicated Supabase project.
- Published offers and stories only; empty states are real, not demo content.
- Filters for market, category, store, condition, and price/date sorting.
- “Verified” badge is shown only for an actual offer-price observation less than 24 hours old.
- Affiliate links are labeled near offers.
- Newsletter and outdated-deal reporting are intentionally inactive until a validated backend and email provider are implemented.
- No sample data is seeded in the database.

## Local preview

Open `index.html` via a local HTTP server. `supabase-config.js` holds the public project URL and Supabase publishable key. This key is designed for browser use and must remain protected by Row Level Security. **Never put a Supabase secret/service_role key in this repository or in browser code.**

## Database

The initial schema is at `supabase/migrations/20261020_initial_schema.sql`. It was applied to the dedicated Supabase project `geekdeal-digest` (`dzkbtgipmspwaglangep`, region `us-east-1`) and verified there. Do not apply it to the ChordProof project.

## Deployment

The repository includes a static Vercel configuration, but no Vercel project or deployment has been created. The portal is intended to earn affiliate commissions and advertising revenue. Vercel states that Hobby is for personal, non-commercial use; use Vercel Pro (currently listed at US$20/month plus applicable taxes/usage) or a different host whose current terms allow the site's commercial use. Do not deploy this commercial project on Vercel Hobby.

For Vercel, the static build command copies only `index.html` and `supabase-config.js` to `public/`; the database migration and README are not published as website files.
