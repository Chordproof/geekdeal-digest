from __future__ import annotations
import json
import os
import time
import urllib.request

API = "https://api.isthereanydeal.com"
KEY = os.environ.get("ITAD_API_KEY", "")
USER_AGENT = "GeekDealDigest/1.0 (+https://geekdeal.example)"

# shop id da ITAD -> nosso slug
SHOP_MAP = {
    61: "fanatical",
    37: "gog",
    15: "humble",
    27: "greenman",
    35: "gamesplanet",
    48: "wingamestore",
    53: "gamebillet",
    62: "voidu",
    69: "dlgamer",
    71: "nuuvem",
    24: "steam",
    16: "epic",
}

def _get(path, params):
    qs = "&".join(k + "=" + str(v) for k, v in params.items())
    url = API + path + "?" + qs
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "ITAD-API-Key": KEY,
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def fetch(limit=100):
    if not KEY:
        print("[itad] ITAD_API_KEY ausente, pulando fonte")
        return

    deals = _get("/deals/v2", {
        "country": "US",
        "shops": ",".join(str(s) for s in SHOP_MAP),
        "sort": "cut",
        "limit": limit,
    })

    print("[itad] " + str(len(deals)) + " ofertas recebidas")

    for d in deals:
        shop = d.get("shop") or {}
        shop_id = shop.get("id")
        slug = SHOP_MAP.get(shop_id)
        if slug is None:
            continue

        deal = d.get("deal") or {}
        price = deal.get("price") or {}
        regular = deal.get("regular") or {}
        cut = deal.get("cut") or 0

        try:
            offer = float(price.get("amount", 0))
            normal = float(regular.get("amount", 0))
        except (TypeError, ValueError):
            continue

        if offer <= 0 or normal <= 0 or offer >= normal:
            continue

        title = (d.get("title") or "").strip()
        url = (d.get("url") or "").strip()
        if not title or not url.startswith("https://"):
            continue

        yield {
            "title": title,
            "store_slug": slug,
            "product_url": url,
            "offer_price": offer,
            "reference_price": normal,
            "currency": "USD",
            "market": "US",
            "metacritic": None,
            "discount_pct": cut,
            "source": "itad",
            "source_url": url,
        }

        time.sleep(0.05)
