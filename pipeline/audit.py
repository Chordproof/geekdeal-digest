from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

RAW_DIR = Path("data/raw")

def write_raw(records):
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    path = RAW_DIR / (today + ".jsonl")
    with path.open("a", encoding="utf-8") as fh:
        for rec in records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return path
