"""Scrape Google Maps shared lists into static JSON for the frontend.

Reads list URLs from ``config/lists.yaml``, resolves each one to Google's
internal ``entitylist`` JSON endpoint, and writes one JSON file per list to
``public/data/<slug>.json`` plus a manifest at ``public/data/index.json``.

Run:
    pip install -r scripts/requirements.txt
    python scripts/scrape.py
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx
import yaml

from extractors import COMMON_HEADERS, detect_borough, fetch_list, slugify


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "lists.yaml"
DATA_DIR = ROOT / "public" / "data"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_existing(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def place_signature(p: dict) -> tuple:
    return (
        p.get("place_id", ""),
        p.get("name", ""),
        p.get("address", ""),
    )


def places_changed(old: dict | None, new: dict) -> bool:
    if not old:
        return True
    a = sorted(place_signature(p) for p in old.get("places", []))
    b = sorted(place_signature(p) for p in new.get("places", []))
    return a != b


def shape_for_frontend(parsed: dict, name: str, source_url: str) -> dict:
    places = []
    for p in parsed["places"]:
        places.append(
            {
                "place_id": p["place_id"],
                "name": p["name"],
                "address": p["address"],
                "borough": detect_borough(p["address"]),
                "lat": p["lat"],
                "lng": p["lng"],
                "maps_url": p["maps_url"],
                "rating": None,
                "reviews": None,
                "cuisine": "",
                "price_level": "",
                "photo_url": None,
            }
        )
    return {
        "name": name,
        "slug": slugify(name),
        "source_url": source_url,
        "list_id": parsed.get("list_id"),
        "updated_at": now_iso(),
        "places": places,
    }


def main() -> int:
    if not CONFIG_PATH.exists():
        print(f"Missing {CONFIG_PATH}", file=sys.stderr)
        return 1
    cfg = yaml.safe_load(CONFIG_PATH.read_text(encoding="utf-8")) or {}
    entries = cfg.get("lists", [])
    if not entries:
        print("No lists configured.", file=sys.stderr)
        return 1

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    index_lists = []
    failures = 0

    with httpx.Client(headers=COMMON_HEADERS) as client:
        for entry in entries:
            name = entry["name"]
            url = entry["url"]
            print(f"[{name}] fetching")
            try:
                parsed = fetch_list(url, client)
            except Exception as e:
                failures += 1
                print(f"FAILED [{name}]: {e}", file=sys.stderr)
                continue

            data = shape_for_frontend(parsed, name, url)
            out_path = DATA_DIR / f"{data['slug']}.json"
            existing = load_existing(out_path)
            if places_changed(existing, data):
                out_path.write_text(
                    json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8",
                )
                print(f"[{name}] wrote {out_path.name} ({len(data['places'])} places)")
            else:
                print(f"[{name}] no changes ({len(data['places'])} places)")

            index_lists.append(
                {
                    "slug": data["slug"],
                    "name": data["name"],
                    "count": len(data["places"]),
                    "updated_at": data["updated_at"],
                }
            )

    index = {"updated_at": now_iso(), "lists": index_lists}
    (DATA_DIR / "index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote index.json with {len(index_lists)} lists.")
    return 1 if failures and not index_lists else 0


if __name__ == "__main__":
    sys.exit(main())
