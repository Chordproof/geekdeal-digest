from __future__ import annotations
import json
import os
import time
import urllib.request

API = "https://api.isthereanydeal.com"
KEY = os.environ.get("ITAD_API_KEY", "")
USER_AGENT = "GeekDealDigest/1.0 (+https://geekdeal.example)"

# IDs reais confirmados via /service/shops/v1
SHOP_MAP = {
    61: "steam",
    16: "epic",
    35: "gog",
    6: "fanatical",
    37: "humble",
    36: "greenman",
    29: "gamesplanet",
    64: "wingamestore",
    20: "gamebillet",
    13: "dlgamer",
    50: "nuuvem",
    42: "indiegala",
    24: "gamersgate",
    2: "allyouplay",
    49: "newegg",
}

def _get(path, params=None):
    url = API + path
    if params:
        url += "?" + "&".join(k + "=" + str(v) for k, v in params.items())
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "ITAD-API-Key": KEY,
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def _post(path, params, body):
    url = API + path + "?" + "&".join(k + "=" + str(v) for k, v in params.items())
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={
        "User-Agent": USER_AGENT,
        "ITAD-API-Key": KEY,
        "Content-Type": "application/json",
    }, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def fetch(limit=100):
    if not KEY:
        print("[itad] ITAD_API_KEY ausente, pulando fonte")
        return

    # 1. Busca os IDs internos dos jogos em promocao
    try:
        deals = _get("/deals/v2", {
            "key": KEY,
            "country": "US",
            "shops": ",".join(str(s) for s in SHOP_MAP),
            "sort": "cut",
            "limit": limit,
        })
    except Exception as exc:
        print("[itad] /deals/v2 falhou: " + str(exc))
        return

    if not isinstance(deals, list):
        print("[itad] resposta inesperada em /deals/v2")
        return

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
        url = (deal.get("url") or "").strip()
        if not title or not url.startswith("https://"):
            continue

        yield {
            "title": title,
            "store_slug": slug,
            "product_url": url,
            "offer_price": offer,
            "reference_price": normal,
            "currency": price.get("currency", "USD"),
            "market": "US",
            "metacritic": None,
            "discount_pct": cut,
            "source": "itad",
            "source_url": url,
        }

        time.sleep(0.05)
