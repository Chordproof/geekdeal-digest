from __future__ import annotations
import json
import urllib.request

API = ("https://store-site-backend-static.ak.epicgames.com"
       "/freeGamesPromotions?locale=en-US&country=US&allowCountries=US")
USER_AGENT = "GeekDealDigest/1.0"

def fetch():
    req = urllib.request.Request(API, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    elements = (data.get("data", {})
                    .get("Catalog", {})
                    .get("searchStore", {})
                    .get("elements", []))

    print("[epic] " + str(len(elements)) + " itens na vitrine")

    for el in elements:
        promos = el.get("promotions") or {}
        offers = promos.get("promotionalOffers") or []
        if not offers:
            continue

        discount = 0
        for group in offers:
            for o in group.get("promotionalOffers", []):
                discount = (o.get("discountSetting") or {}).get("discountPercentage", 0)
                break

        if discount != 0:
            continue

        title = (el.get("title") or "").strip()
        if not title:
            continue

        slug = el.get("productSlug") or el.get("urlSlug") or ""
        if not slug:
            continue

        url = "https://store.epicgames.com/en-US/p/" + slug

        yield {
            "title": title,
            "store_slug": "epic",
            "product_url": url,
            "offer_price": 0.01,
            "reference_price": 0.0,
            "currency": "USD",
            "market": "US",
            "metacritic": None,
            "source": "epic_free",
            "source_url": url,
            "is_free": True,
        }
