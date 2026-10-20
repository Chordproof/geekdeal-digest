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

This repository is not yet connected to a hosting project. The product is intended to earn affiliate commissions and advertising revenue, so confirm the hosting plan permits commercial use before publishing. The current Vercel Hobby plan is described by Vercel as for personal, non-commercial use; no Vercel project/deployment has been created for this repository.
