from __future__ import annotations
import re
import urllib.request
import xml.etree.ElementTree as ET

USER_AGENT = "GeekDealDigest/1.0"

FEEDS = {
    "fanatical": "https://www.fanatical.com/en/rss/new",
    "humble": "https://www.humblebundle.com/store/rss",
    "gog": "https://www.gog.com/news/feed",
    "xbox_wire": "https://news.xbox.com/en-us/feed/",
}

def _clean(text):
    text = re.sub(r"<[^>]+>", "", text or "")
    return re.sub(r"\s+", " ", text).strip()

def fetch(feed_key, limit=10):
    url = FEEDS.get(feed_key)
    if not url:
        return

    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            root = ET.fromstring(resp.read())
    except Exception as exc:
        print("[rss] " + feed_key + " falhou: " + str(exc))
        return

    count = 0
    for item in root.iter("item"):
        title = _clean(item.findtext("title") or "")
        link = (item.findtext("link") or "").strip()
        body = _clean(item.findtext("description") or "")
        pub = (item.findtext("pubDate") or "").strip()

        if not title or not link.startswith("https://"):
            continue

        yield {
            "title": title[:240],
            "excerpt": body[:1200],
            "body": body,
            "link": link,
            "published_at": pub,
            "source": feed_key,
        }

        count += 1
        if count >= limit:
            break
