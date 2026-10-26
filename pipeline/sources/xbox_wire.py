from __future__ import annotations
import re
import urllib.request
import xml.etree.ElementTree as ET

FEED = "https://news.xbox.com/en-us/feed/"
USER_AGENT = "GeekDealDigest/1.0"

def _clean(text):
    text = re.sub(r"<[^>]+>", "", text or "")
    return re.sub(r"\s+", " ", text).strip()

def fetch(limit=5):
    req = urllib.request.Request(FEED, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=25) as resp:
        root = ET.fromstring(resp.read())

    for item in root.iter("item"):
        title = _clean(item.findtext("title") or "")
        link = (item.findtext("link") or "").strip()
        body = _clean(item.findtext("description") or "")
        pub = (item.findtext("pubDate") or "").strip()
        if not title or not link.startswith("https://") or not body:
            continue
        yield {
            "title": title[:240],
            "excerpt": body[:1200],
            "body": body,
            "link": link,
            "section": "gaming",
            "published_at": pub,
            "source": "xbox_wire",
        }
        limit -= 1
        if limit <= 0:
            break
