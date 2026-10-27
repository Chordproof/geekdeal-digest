from __future__ import annotations
from datetime import datetime, timezone
import audit
import gates
import publish
from affiliate import affiliate_meta
from config import RETAILERS, RETAILER_BY_SLUG, MAX_OFFERS_PER_RUN, CATEGORY_KEYWORDS
from score import score
from sources import itad, epic_free, rss

def categorize(title):
    low = title.lower()
    for category, words in CATEGORY_KEYWORDS.items():
        if any(w in low for w in words):
            return category
    return "other"

def _retailer_id(slug):
    rows = publish._req("GET", "retailers", params="?slug=eq." + slug + "&select=id")
    if isinstance(rows, list) and rows:
        return rows[0]["id"]
    return None

def _process_deal(row, seen, raw, approved, rejected):
    slug = publish.slugify(row["store_slug"] + "-" + row["title"])
    if slug in seen:
        return
    seen.add(slug)

    retailer = RETAILER_BY_SLUG.get(row["store_slug"])
    if retailer is None or row["market"] not in retailer.markets:
        return

    aff_url, _ = affiliate_meta(row["store_slug"], row["product_url"])

    c = gates.Candidate(
        title=row["title"],
        store_slug=row["store_slug"],
        product_url=row["product_url"],
        offer_price=row["offer_price"],
        reference_price=row["reference_price"],
        currency=row["currency"],
        market=row["market"],
        category=categorize(row["title"]),
        item_condition="new",
        metacritic=row.get("metacritic"),
        affiliate_url=aff_url,
        source_url=row.get("source_url", ""),
    )

    ok, reasons = gates.evaluate(c)
    raw.append(dict(row, approved=ok, reasons=reasons))

    if ok:
        c.score = score(c)
        approved.append((c, slug))
    else:
        rejected.append((c, reasons))

def main():
    started = datetime.now(timezone.utc)
    print("[run] inicio " + started.isoformat())
    publish.ensure_retailers(RETAILERS)

    raw, approved, rejected = [], [], []
    seen = set()

    # Fonte 1 - ITAD (ofertas com desconto)
    try:
        for row in itad.fetch():
            _process_deal(row, seen, raw, approved, rejected)
    except Exception as exc:
        print("[run] itad falhou: " + str(exc))

    # Fonte 2 - Epic jogos gratis (bypass dos gates de desconto)
    try:
        for row in epic_free.fetch():
            slug = publish.slugify("epic-free-" + row["title"])
            if slug in seen:
                continue
            seen.add(slug)
            c = gates.Candidate(
                title=row["title"], store_slug="epic",
                product_url=row["product_url"], offer_price=0.01,
                reference_price=0.0, currency="USD", market="US",
                category="games", item_condition="new",
                affiliate_url=None, source_url=row["source_url"],
            )
            c.score = 95.0
            raw.append(dict(row, approved=True, reasons=["free_game"]))
            approved.append((c, slug))
    except Exception as exc:
        print("[run] epic falhou: " + str(exc))

    # Fonte 3 - RSS das lojas com afiliado
    for feed_key in ("fanatical", "humble", "gog"):
        try:
            for item in rss.fetch(feed_key, limit=10):
                print("[run] rss " + feed_key + ": " + item["title"][:60])
        except Exception as exc:
            print("[run] rss " + feed_key + " falhou: " + str(exc))

    approved.sort(key=lambda p: p[0].score, reverse=True)
    approved = approved[:MAX_OFFERS_PER_RUN]

    written = 0
    for c, slug in approved:
        rid = _retailer_id(c.store_slug)
        if not rid:
            continue
        deal_id = publish.upsert_deal(c, rid, slug)
        if deal_id:
            publish.record_price_check(deal_id, c)
            written += 1

    audit_path = audit.write_raw(raw)
    publish.log_run({
        "started_at": started.isoformat(),
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "fetched": len(raw), "approved": len(approved),
        "written": written, "rejected": len(rejected),
    })
    print("[run] " + str(len(raw)) + " coletados, " + str(len(approved))
          + " aprovados, " + str(written) + " publicados")
    print("[run] auditoria: " + str(audit_path))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
