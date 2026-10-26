from __future__ import annotations
from dataclasses import dataclass
from config import (MIN_DISCOUNT_PCT, MAX_BASELINE_PRICE, METACRITIC_MIN_WHEN_PRICY,
                    PRICY_THRESHOLD, MIN_PRICE, CATEGORIES, CONDITIONS)

@dataclass
class Candidate:
    title: str
    store_slug: str
    product_url: str
    offer_price: float
    reference_price: float | None
    currency: str
    market: str
    category: str = "other"
    item_condition: str = "new"
    metacritic: int | None = None
    affiliate_url: str | None = None
    source_url: str = ""

def discount_pct(ref, offer):
    if not ref or ref <= 0:
        return 0.0
    return max(0.0, (ref - offer) / ref * 100.0)

def evaluate(c):
    reasons = []
    if c.offer_price is None or c.offer_price < MIN_PRICE:
        reasons.append("G1: preco ausente ou abaixo do piso")
    if not c.reference_price or c.reference_price <= 0:
        reasons.append("G2: sem preco de referencia")
    if c.reference_price and c.offer_price >= c.reference_price:
        reasons.append("G3: referencia nao supera a oferta")
    pct = discount_pct(c.reference_price, c.offer_price)
    if pct < MIN_DISCOUNT_PCT:
        reasons.append("G4: desconto abaixo do piso")
    if c.reference_price and c.reference_price > MAX_BASELINE_PRICE:
        reasons.append("G5: referencia acima do teto")
    if (c.reference_price and c.reference_price > PRICY_THRESHOLD
            and c.metacritic is not None
            and c.metacritic < METACRITIC_MIN_WHEN_PRICY):
        reasons.append("G6: metacritic baixo para item caro")
    if c.category not in CATEGORIES:
        reasons.append("G7: categoria invalida")
    if c.item_condition not in CONDITIONS:
        reasons.append("G7: condicao invalida")
    if not c.product_url.startswith("https://"):
        reasons.append("G8: product_url nao https")
    if not c.title or len(c.title.strip()) == 0:
        reasons.append("G9: titulo vazio")
    return (len(reasons) == 0, reasons)
