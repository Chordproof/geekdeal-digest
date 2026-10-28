from __future__ import annotations
import json
import time
import urllib.request

API = "https://www.cheapshark.com/api/1.0"
USER_AGENT = "GeekDealDigest/1.0 (+https://geekdeal.example)"

# storeID da CheapShark -> nosso slug
STORE_MAP = {
    "1": "steam",
    "2": "gamersgate",
    "3": "greenman",
    "7": "gog",
    "8": "origin",
    "11": "humble",
    "13": "uplay",
    "15": "fanatical",
    "21": "wingamestore",
    "23": "gamebillet",
    "24": "voidu",
    "25": "epic",
    "27": "gamesplanet",
    "28": "gamesload",
    "29": "2game",
    "30": "indiegala",
    "31": "allyouplay",
    "33": "dlgamer",
    "34": "nuuvem",
    "35": "dreamgame",
}

def _get(path, params=None):
    url = API + path
    if params:
        url += "?" + "&".join(k + "=" + str(v) for k, v in params.items())
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def fetch(limit=60, min_discount=50):
    """Busca ofertas na CheapShark. Retorna dicts no formato do pipeline."""
    try:
        deals = _get("/deals", {
            "storeID": ",".join(STORE_MAP.keys()),
            "upperPrice": 50,
            "lowerPrice": 1,
            "sortBy": "Deal Rating",
            "pageSize": limit,
            "onSale": 1,
        })
    except Exception as exc:
        print("[cheapshark] falha: " + str(exc))
        return

    if not isinstance(deals, list):
        print("[cheapshark] resposta inesperada")
        return

    print("[cheapshark] " + str(len(deals)) + " ofertas recebidas")

    for d in deals:
        store_id = str(d.get("storeID", ""))
        slug = STORE_MAP.get(store_id)
        if slug is None:
            continue

        try:
            offer = float(d.get("salePrice", 0))
            normal = float(d.get("normalPrice", 0))
        except (TypeError, ValueError):
            continue

        if offer <= 0 or normal <= 0 or offer >= normal:
            continue

        savings = float(d.get("savings", 0) or 0)
        if savings < min_discount:
            continue

        title = (d.get("title") or "").strip()
        deal_id = (d.get("dealID") or "").strip()
        if not title or not deal_id:
            continue

        # Link de redirect da CheapShark -> loja real
        url = "https://www.cheapshark.com/redirect?dealID=" + deal_id

        yield {
            "title": title,
            "store_slug": slug,
            "product_url": url,
            "offer_price": offer,
            "reference_price": normal,
            "currency": "USD",
            "market": "US",
            "metacritic": None,
            "discount_pct": round(savings, 1),
            "source": "cheapshark",
            "source_url": url,
        }

        time.sleep(0.02)
