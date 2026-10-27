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
MAX_OFFERS_PER_RUN = 60
MIN_PRICE = 1.00
MAX_TITLE_LEN = 240
MAX_SUMMARY_LEN = 1000

CATEGORIES = {"games", "hardware", "digital", "anime", "comics",
              "movies_tv", "collectibles", "tabletop", "other"}
CONDITIONS = {"new", "open_box", "refurbished", "used"}

CATEGORY_KEYWORDS = {
    "hardware": ("controller", "headset", "console", "ssd", "monitor",
                 "keyboard", "mouse", "gpu", "ram", "charger", "dock"),
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
    # Fisicas com programa de afiliado
    Retailer("amazon-us", "Amazon", "https://www.amazon.com", ("US",), "Amazon Associates", "amazon"),
    Retailer("ebay-us", "eBay", "https://www.ebay.com", ("US",), "eBay Partner Network", "ebay"),
    Retailer("walmart-us", "Walmart", "https://www.walmart.com", ("US",), "Walmart Creator", "walmart"),
    Retailer("best-buy-us", "Best Buy", "https://www.bestbuy.com", ("US",), "Best Buy Affiliate", "bestbuy"),
    # Digitais com programa de afiliado
    Retailer("fanatical", "Fanatical", "https://www.fanatical.com", ("US", "CA"), "Fanatical Affiliates", "fanatical"),
    Retailer("humble", "Humble Bundle", "https://www.humblebundle.com", ("US", "CA"), "Humble Partner", "humble"),
    Retailer("gog", "GOG.com", "https://www.gog.com", ("US", "CA"), "GOG Affiliates", "gog"),
    Retailer("greenman", "Green Man Gaming", "https://www.greenmangaming.com", ("US", "CA"), "GMG Affiliates", "greenman"),
    Retailer("gamesplanet", "GamesPlanet", "https://gamesplanet.com", ("US", "CA"), "GamesPlanet Affiliates", "gamesplanet"),
    Retailer("wingamestore", "WinGameStore", "https://www.wingamestore.com", ("US",), "WinGameStore Affiliates", "wingamestore"),
    Retailer("gamebillet", "GameBillet", "https://www.gamebillet.com", ("US",), "GameBillet Affiliates", "gamebillet"),
    Retailer("voidu", "Voidu", "https://www.voidu.com", ("US",), "Voidu Affiliates", "voidu"),
    Retailer("dlgamer", "DLGamer", "https://www.dlgamer.com", ("US",), "DLGamer Affiliates", "dlgamer"),
    Retailer("nuuvem", "Nuuvem", "https://www.nuuvem.com", ("US",), "Nuuvem Affiliates", "nuuvem"),
    # Sem programa de afiliado - entram por trafego e AdSense
    Retailer("steam", "Steam", "https://store.steampowered.com", ("US", "CA"), None, None),
    Retailer("epic", "Epic Games Store", "https://store.epicgames.com", ("US", "CA"), None, None),
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
    "green man gaming": "greenman", "greenman": "greenman",
    "gamesplanet": "gamesplanet",
    "wingamestore": "wingamestore",
    "gamebillet": "gamebillet",
    "voidu": "voidu",
    "dlgamer": "dlgamer",
    "nuuvem": "nuuvem",
    "steam": "steam",
    "epic": "epic", "epic games store": "epic",
}

def resolve_retailer(source_store):
    return STORE_ALIASES.get(source_store.strip().lower())
