from __future__ import annotations
import json
import re
import urllib.request
from datetime import datetime, timezone
from config import SUPABASE_URL, SERVICE_KEY, MAX_SUMMARY_LEN

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": "Bearer " + SERVICE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=merge-duplicates",
}

def _req(method, table, payload=None, params=""):
    url = SUPABASE_URL + "/rest/v1/" + table + params
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode()
        return json.loads(body) if body else {}

def slugify(text):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:80] or "deal"

def ensure_retailers(retailers):
    payload = [{"slug": r.slug, "name": r.name, "website_url": r.website_url,
                "markets": list(r.markets), "affiliate_program": r.affiliate_program,
                "is_active": True} for r in retailers]
    _req("POST", "retailers", payload, "?on_conflict=slug")
    print("[publish] " + str(len(payload)) + " retailers garantidos")

def upsert_deal(c, retailer_id, slug):
    payload = {
        "retailer_id": retailer_id,
        "slug": slug,
        "title": c.title[:240],
        "summary": (c.source_url or "")[:MAX_SUMMARY_LEN] or None,
        "market": c.market,
        "currency": c.currency,
        "category": c.category,
        "item_condition": c.item_condition,
        "product_url": c.product_url,
        "affiliate_url": c.affiliate_url,
        "affiliate_program": ("affiliate" if c.affiliate_url else None),
        "status": "published",
        "published_at": datetime.now(timezone.utc).isoformat(),
    }
    result = _req("POST", "deals", [payload], "?on_conflict=slug")
    if isinstance(result, list) and result:
        return result[0].get("id")
    return None

def record_price_check(deal_id, c):
    payload = {
        "deal_id": deal_id,
        "market": c.market,
        "currency": c.currency,
        "price_kind": "offer_price",
        "price": round(c.offer_price, 2),
        "availability": "in_stock",
        "source_url": c.source_url or c.product_url,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "evidence_note": "Pipeline automatizado CheapShark",
    }
    _req("POST", "deal_price_checks", [payload])

def log_run(stats):
    _req("POST", "pipeline_runs", [stats])
