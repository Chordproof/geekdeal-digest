from __future__ import annotations
from gates import discount_pct

def score(c):
    base = 0.0
    pct = min(discount_pct(c.reference_price, c.offer_price), 50.0)
    base += pct * 1.4
    if c.affiliate_url:
        base += 15.0
    if c.metacritic:
        base += min(c.metacritic / 100.0 * 10.0, 10.0)
    if c.category in ("digital", "hardware", "games"):
        base += 5.0
    return round(min(base, 100.0), 2)
