from __future__ import annotations
import os
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl
from config import RETAILER_BY_SLUG

def _tags_from_env():
    raw = os.environ.get("AFFILIATE_TAGS", "").strip()
    if not raw:
        return {}
    tags = {}
    for chunk in raw.split(";"):
        chunk = chunk.strip()
        if not chunk or "=" not in chunk:
            continue
        key, value = chunk.split("=", 1)
        if key.strip() and value.strip():
            tags[key.strip()] = value.strip()
    return tags

_TAGS = _tags_from_env()

ALLOWED_HOSTS = {
    "amazon": {"amazon.com", "www.amazon.com"},
    "ebay": {"ebay.com", "www.ebay.com"},
    "walmart": {"walmart.com", "www.walmart.com"},
    "bestbuy": {"bestbuy.com", "www.bestbuy.com"},
    "fanatical": {"fanatical.com", "www.fanatical.com"},
    "humble": {"humblebundle.com", "www.humblebundle.com"},
    "gog": {"gog.com", "www.gog.com"},
    "greenman": {"greenmangaming.com", "www.greenmangaming.com"},
    "gamesplanet": {"gamesplanet.com", "us.gamesplanet.com"},
    "wingamestore": {"wingamestore.com", "www.wingamestore.com"},
    "gamebillet": {"gamebillet.com", "www.gamebillet.com"},
    "voidu": {"voidu.com", "www.voidu.com"},
    "dlgamer": {"dlgamer.com", "www.dlgamer.com"},
    "nuuvem": {"nuuvem.com", "www.nuuvem.com"},
}

PARAM_NAME = {
    "amazon": "tag", "ebay": "campid", "walmart": "u1", "bestbuy": "ref",
    "fanatical": "ref", "humble": "partner", "gog": "pp",
    "greenman": "ref", "gamesplanet": "ref", "wingamestore": "ref",
    "gamebillet": "ref", "voidu": "ref", "dlgamer": "ref", "nuuvem": "ref",
}

def build_affiliate_url(retailer_slug, product_url):
    retailer = RETAILER_BY_SLUG.get(retailer_slug)
    if retailer is None or retailer.tag_key is None:
        return None
    tag = _TAGS.get(retailer.tag_key)
    if not tag:
        return None
    try:
        parsed = urlparse(product_url)
    except ValueError:
        return None
    if parsed.scheme != "https":
        return None
    host = (parsed.hostname or "").lower()
    allowed = ALLOWED_HOSTS.get(retailer.tag_key, set())
    if host not in allowed:
        return None
    param = PARAM_NAME.get(retailer.tag_key)
    if not param:
        return None
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query[param] = tag
    new_url = parsed._replace(query=urlencode(query))
    return urlunparse(new_url)

def affiliate_meta(retailer_slug, product_url):
    url = build_affiliate_url(retailer_slug, product_url)
    if url is None:
        return None, None
    retailer = RETAILER_BY_SLUG[retailer_slug]
    return url, retailer.affiliate_program
