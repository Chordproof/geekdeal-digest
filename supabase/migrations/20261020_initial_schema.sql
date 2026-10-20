-- GeekDeal Digest — initial database schema (Supabase / PostgreSQL)
-- Version: 1.0.0
-- Scope: a dedicated project for the news + deals portal; never apply to ChordProof.
-- Creates schema only; no demo data is seeded. Apply once, after review.
--
-- Security model:
--   * anon/authenticated can SELECT published public content, subject to RLS.
--   * browser roles cannot write content, submit reports, or manage subscribers.
--   * service_role access is backend-only; never expose its key in a browser.
--   * deal reports/newsletter need a validated backend and provider integration.

BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE FUNCTION private.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
BEGIN NEW.updated_at := pg_catalog.now(); RETURN NEW; END;
$function$;
REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.set_updated_at() TO service_role;

CREATE TABLE public.retailers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
 website_url text NOT NULL CHECK (website_url ~ '^https://[^[:space:]]+$'),
 markets text[] NOT NULL CHECK (cardinality(markets)>0 AND markets <@ ARRAY['US','CA']::text[]),
 affiliate_program text CHECK (affiliate_program IS NULL OR char_length(affiliate_program)<=160),
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 retailer_id uuid NOT NULL REFERENCES public.retailers(id) ON DELETE RESTRICT,
 slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 240),
 summary text CHECK (summary IS NULL OR char_length(summary)<=1000),
 market text NOT NULL CHECK (market IN ('US','CA')),
 currency text NOT NULL CHECK (currency IN ('USD','CAD')),
 category text NOT NULL CHECK (category IN ('games','hardware','digital','anime','comics','movies_tv','collectibles','tabletop','other')),
 item_condition text NOT NULL DEFAULT 'new' CHECK (item_condition IN ('new','open_box','refurbished','used')),
 product_url text NOT NULL CHECK (product_url ~ '^https://[^[:space:]]+$'),
 affiliate_url text CHECK (affiliate_url IS NULL OR affiliate_url ~ '^https://[^[:space:]]+$'),
 affiliate_program text CHECK (affiliate_program IS NULL OR char_length(affiliate_program)<=160),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','withdrawn')),
 published_at timestamptz, expires_at timestamptz,
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT deals_market_currency_match CHECK ((market='US' AND currency='USD') OR (market='CA' AND currency='CAD')),
 CONSTRAINT deals_published_needs_timestamp CHECK (status<>'published' OR published_at IS NOT NULL),
 CONSTRAINT deals_expiry_after_publication CHECK (expires_at IS NULL OR published_at IS NULL OR expires_at>published_at),
 CONSTRAINT deals_id_market_currency_key UNIQUE (id,market,currency)
);

-- Append one observation per price check. Offer, retailer-list and MSRP values are distinct.
CREATE TABLE public.deal_price_checks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), deal_id uuid NOT NULL,
 market text NOT NULL CHECK (market IN ('US','CA')), currency text NOT NULL CHECK (currency IN ('USD','CAD')),
 price_kind text NOT NULL CHECK (price_kind IN ('offer_price','retailer_list_price','msrp')),
 price numeric(12,2) NOT NULL CHECK (price>=0),
 availability text NOT NULL DEFAULT 'unknown' CHECK (availability IN ('in_stock','out_of_stock','preorder','region_limited','unknown')),
 source_url text NOT NULL CHECK (source_url ~ '^https://[^[:space:]]+$'),
 checked_at timestamptz NOT NULL DEFAULT now(), checked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 evidence_note text CHECK (evidence_note IS NULL OR char_length(evidence_note)<=1000), recorded_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT price_check_market_currency_match CHECK ((market='US' AND currency='USD') OR (market='CA' AND currency='CAD')),
 CONSTRAINT price_check_deal_market_currency_fk FOREIGN KEY (deal_id,market,currency) REFERENCES public.deals(id,market,currency) ON DELETE RESTRICT
);

CREATE TABLE public.articles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 240),
 excerpt text CHECK (excerpt IS NULL OR char_length(excerpt)<=1200), body text NOT NULL CHECK (char_length(btrim(body))>0),
 section text NOT NULL CHECK (section IN ('gaming','hardware','anime','comics','movies_tv','superheroes','collectibles','tabletop')),
 market text NOT NULL DEFAULT 'both' CHECK (market IN ('US','CA','both')),
 author_name text CHECK (author_name IS NULL OR char_length(btrim(author_name))<=120),
 cover_image_url text CHECK (cover_image_url IS NULL OR cover_image_url ~ '^https://[^[:space:]]+$'),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','withdrawn')),
 published_at timestamptz, created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT articles_published_needs_timestamp CHECK (status<>'published' OR published_at IS NOT NULL)
);
CREATE TABLE public.article_sources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
 position integer NOT NULL DEFAULT 0 CHECK (position>=0), source_title text NOT NULL CHECK (char_length(btrim(source_title)) BETWEEN 1 AND 240),
 publisher text CHECK (publisher IS NULL OR char_length(btrim(publisher))<=160), source_url text NOT NULL CHECK (source_url ~ '^https://[^[:space:]]+$'),
 accessed_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (article_id,position)
);
CREATE TABLE public.deal_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE RESTRICT,
 reason text NOT NULL CHECK (reason IN ('price_changed','out_of_stock','wrong_market','broken_link','other')),
 details text CHECK (details IS NULL OR char_length(details)<=1000), review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','resolved','dismissed')),
 created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz, reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE TABLE public.newsletter_subscribers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320 AND email=lower(btrim(email)) AND position('@' IN email)>1),
 market text NOT NULL CHECK (market IN ('US','CA')), consent_at timestamptz NOT NULL,
 consent_text_version text NOT NULL CHECK (char_length(btrim(consent_text_version)) BETWEEN 1 AND 80),
 consent_source text NOT NULL DEFAULT 'website' CHECK (char_length(btrim(consent_source)) BETWEEN 1 AND 80),
 status text NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation','confirmed','unsubscribed')),
 confirmed_at timestamptz, unsubscribed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (status<>'confirmed' OR confirmed_at IS NOT NULL), CHECK (status<>'unsubscribed' OR unsubscribed_at IS NOT NULL), UNIQUE (email,market)
);

CREATE INDEX deals_market_category_status_published_idx ON public.deals(market,category,status,published_at DESC);
CREATE INDEX deals_retailer_idx ON public.deals(retailer_id);
CREATE INDEX deals_expiry_idx ON public.deals(expires_at) WHERE status='published' AND expires_at IS NOT NULL;
CREATE INDEX deal_price_checks_latest_idx ON public.deal_price_checks(deal_id,price_kind,checked_at DESC);
CREATE INDEX articles_section_market_published_idx ON public.articles(section,market,published_at DESC) WHERE status='published';
CREATE INDEX article_sources_article_position_idx ON public.article_sources(article_id,position);
CREATE INDEX deal_reports_pending_idx ON public.deal_reports(created_at DESC) WHERE review_status='pending';

CREATE TRIGGER retailers_set_updated_at BEFORE UPDATE ON public.retailers FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER deals_set_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER articles_set_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER newsletter_subscribers_set_updated_at BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_price_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY retailers_public_read_active ON public.retailers FOR SELECT TO anon,authenticated USING (is_active=true);
CREATE POLICY deals_public_read_current_publications ON public.deals FOR SELECT TO anon,authenticated USING (status='published' AND published_at<=now() AND (expires_at IS NULL OR expires_at>now()));
CREATE POLICY price_checks_public_read_for_current_deals ON public.deal_price_checks FOR SELECT TO anon,authenticated USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id=deal_price_checks.deal_id AND d.status='published' AND d.published_at<=now() AND (d.expires_at IS NULL OR d.expires_at>now())));
CREATE POLICY articles_public_read_published ON public.articles FOR SELECT TO anon,authenticated USING (status='published' AND published_at<=now());
CREATE POLICY article_sources_public_read_for_published_articles ON public.article_sources FOR SELECT TO anon,authenticated USING (EXISTS (SELECT 1 FROM public.articles a WHERE a.id=article_sources.article_id AND a.status='published' AND a.published_at<=now()));
-- deal_reports and newsletter_subscribers intentionally have no browser policies.
REVOKE ALL ON TABLE public.retailers,public.deals,public.deal_price_checks,public.articles,public.article_sources,public.deal_reports,public.newsletter_subscribers FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
GRANT SELECT ON TABLE public.retailers,public.deals,public.deal_price_checks,public.articles,public.article_sources TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.retailers,public.deals,public.articles,public.article_sources TO service_role;
GRANT SELECT,INSERT ON TABLE public.deal_price_checks TO service_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.deal_reports TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.newsletter_subscribers TO service_role;
COMMENT ON TABLE public.retailers IS 'Retailer catalog for US and Canada. Deactivate rather than delete history.';
COMMENT ON TABLE public.deals IS 'Editorially curated offers; each record is for one market and matching currency.';
COMMENT ON TABLE public.deal_price_checks IS 'Append-only price observations. Historical offer price is not MSRP or list price.';
COMMENT ON COLUMN public.deal_price_checks.checked_at IS 'Time a human or authorized checker actually observed the retailer page.';
COMMENT ON COLUMN public.deals.expires_at IS 'Known promotion end; NULL means no end time is known.';
COMMENT ON TABLE public.articles IS 'Original articles. Store Markdown/plain text; sanitize rendered output.';
COMMENT ON TABLE public.article_sources IS 'Sources consulted for each article.';
COMMENT ON TABLE public.deal_reports IS 'Private moderation queue; accept only through validated, rate-limited server endpoint.';
COMMENT ON TABLE public.newsletter_subscribers IS 'Private subscriber/consent records; wire a real provider before enabling signup.';
COMMIT;
-- No sample data is seeded. Public "Verified" state requires a real recent deal_price_checks row.
-- Newsletter/report backend, moderation auth, consent confirmation, rate limiting and provider integration are not implemented here.
