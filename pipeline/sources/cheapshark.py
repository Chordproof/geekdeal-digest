from __future__ import annotations
import json
import urllib.request

API = "https://www.cheapshark.com/api/1.0/deals"
USER_AGENT = "GeekDealDigest/1.0"

# Mapa ampliado: storeID da CheapShark -> nosso slug
STORE_MAP = {
    "1": "fanatical",
    "7": "gog",
    "11": "humble",
    "3": "greenman",      # Green Man Gaming
    "13": "gmg",          # GamersGate
    "15": "gamesplanet",
    "21": "wingamestore",
    "23": "gamebillet",
    "24": "voidu",
    "25": "epic",         # Epic Games Store
    "27": "gamesload",
    "28": "indiegala",
    "29": "d2d",
    "30": "dreamgame",
    "31": "allyouplay",
    "33": "dlgamer",
    "34": "nuuvem",
    "35": "gamesplanet-uk",
    "37": "gamesplanet-de",
    "38": "gamesplanet-fr",
}

def fetch(limit=60, upper_price=60):
    query = "?storeID=&upperPrice=" + str(upper_price) + "&onSale=1&pageSize=" + str(limit)
    req = urllib.request.Request(API + query, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=25) as resp:
        rows = json.loads(resp.read().decode("utf-8"))

    print("[cheapshark] " + str(len(rows)) + " linhas recebidas da API")

    descartadas = 0
    for row in rows:
        slug = STORE_MAP.get(str(row.get("storeID", "")))
        if slug is None:
            descartadas += 1
            continue
        try:
            offer = float(row["salePrice"])
            normal = float(row["normalPrice"])
        except (KeyError, TypeError, ValueError):
            descartadas += 1
            continue
        if offer <= 0 or normal <= 0:
            descartadas += 1
            continue
        deal_id = row.get("dealID", "")
        product_url = ("https://www.cheapshark.com/redirect?dealID=" + deal_id) if deal_id else ""
        yield {
            "title": (row.get("title") or "").strip(),
            "store_slug": slug,
            "product_url": product_url,
            "offer_price": offer,
            "reference_price": normal,
            "currency": "USD",
            "market": "US",
            "metacritic": int(row.get("metacriticScore") or 0) or None,
            "source": "cheapshark",
            "source_url": product_url,
        }

    print("[cheapshark] " + str(descartadas) + " linhas descartadas (loja fora do mapa ou preco invalido)")
