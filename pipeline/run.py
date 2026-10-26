from __future__ import annotations
from datetime import datetime, timezone
import audit
import gates
import publish
from affiliate import affiliate_meta
from config import RETAILERS, RETAILER_BY_SLUG, MAX_OFFERS_PER_RUN, CATEGORY_KEYWORDS
from score import score
from sources import cheapshark

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

def main():
    started = datetime.now(timezone.utc)
    print("[run] inicio " + started.isoformat())
    publish.ensure_retailers(RETAILERS)

    raw, approved, rejected = [], [], []
    seen_slugs = set()

    for row in cheapshark.fetch():
        slug = publish.slugify(row["store_slug"] + "-" + row["title"])
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)

        retailer = RETAILER_BY_SLUG.get(row["store_slug"])
        if retailer is None:
            continue
        if row["market"] not in retailer.markets:
            continue

        aff_url, _ = affiliate_meta(row["store_slug"], row["product_url"])

        candidate = gates.Candidate(
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

        ok, reasons = gates.evaluate(candidate)
        raw.append(dict(row, approved=ok, reasons=reasons))

        if ok:
            candidate.score = score(candidate)
            approved.append((candidate, slug))
        else:
            rejected.append((candidate, reasons))

    approved.sort(key=lambda pair: pair[0].score, reverse=True)
    approved = approved[:MAX_OFFERS_PER_RUN]

    written = 0
    for candidate, slug in approved:
        retailer_id = _retailer_id(candidate.store_slug)
        if not retailer_id:
            continue
        deal_id = publish.upsert_deal(candidate, retailer_id, slug)
        if deal_id:
            publish.record_price_check(deal_id, candidate)
            written += 1

    audit_path = audit.write_raw(raw)

    publish.log_run({
        "started_at": started.isoformat(),
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "fetched": len(raw),
        "approved": len(approved),
        "written": written,
        "rejected": len(rejected),
    })

    print("[run] " + str(len(raw)) + " coletados, " + str(len(approved))
          + " aprovados, " + str(written) + " publicados")
    print("[run] auditoria: " + str(audit_path))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
