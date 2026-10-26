from __future__ import annotations
import os
from dataclasses import dataclass
from datetime import timedelta

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    raise SystemExit("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.")

MARKETS = {"US": "USD", "CA": "CAD"}
FRESH_WINDOW = timedelta(hours=24)
RUN_INTERVAL_HOURS = 6
MIN_DISCOUNT_PCT = 15.0
MAX_BASELINE_PRICE = 89.99
METACRITIC_MIN_WHEN_PRICY = 65
PRICY_THRESHOLD = 40.00
MAX_OFFERS_PER_RUN = 40
MIN_PRICE = 1.00
MAX_TITLE_LEN = 240
MAX_SUMMARY_LEN = 1000

CATEGORIES = {"games", "hardware", "digital", "anime", "comics", "movies_tv", "collectibles", "tabletop", "other"}
CONDITIONS = {"new", "open_box", "refurbished", "used"}

CATEGORY_KEYWORDS = {
    "hardware": ("controller", "headset", "console", "ssd", "monitor", "keyboard", "mouse", "gpu", "ram", "charger", "dock"),
    "digital": ("key", "steam", "gog", "digital", "code", "subscription"),
    "anime": ("anime", "manga", "figure", "nendoroid", "figurine"),
    "comics": ("comic", "graphic novel", "omnibus", "manga volume"),
    "movies_tv": ("blu-ray", "4k", "dvd", "movie", "series", "season"),
    "collectibles": ("pop!", "funko", "statue", "collector", "limited edition"),
    "tabletop": ("board game", "dice", "rpg", "card game", "tcg"),
    "games": ("game", "ps5", "xbox", "switch", "nintendo"),
}

@dataclass(frozen=True)
class Retailer:
    slug: str
    name: str
    website_url: str
    markets: tuple
    affiliate_program: str | None
    tag_key: str | None

RETAILERS = (
    Retailer("amazon-us", "Amazon", "https://www.amazon.com", ("US",), "Amazon Associates", "amazon"),
    Retailer("ebay-us", "eBay", "https://www.ebay.com", ("US",), "eBay Partner Network", "ebay"),
    Retailer("walmart-us", "Walmart", "https://www.walmart.com", ("US",), "Walmart Creator", "walmart"),
    Retailer("best-buy-us", "Best Buy", "https://www.bestbuy.com", ("US",), "Best Buy Affiliate", "bestbuy"),
    Retailer("fanatical", "Fanatical", "https://www.fanatical.com", ("US", "CA"), "Fanatical Affiliates", "fanatical"),
    Retailer("humble", "Humble Bundle", "https://www.humblebundle.com", ("US", "CA"), "Humble Partner", "humble"),
    Retailer("gog", "GOG.com", "https://www.gog.com", ("US", "CA"), "GOG Affiliates", "gog"),
)

RETAILER_BY_SLUG = {r.slug: r for r in RETAILERS}

STORE_ALIASES = {
    "amazon": "amazon-us", "amazon.com": "amazon-us",
    "ebay": "ebay-us", "ebay.com": "ebay-us",
    "walmart": "walmart-us",
    "best buy": "best-buy-us", "bestbuy": "best-buy-us",
    "fanatical": "fanatical",
    "humble bundle": "humble", "humble": "humble",
    "gog": "gog", "gog.com": "gog",
}

def resolve_retailer(source_store):
    return STORE_ALIASES.get(source_store.strip().lower())
