"""Helpers for fetching Google Maps shared-list data via the public
``entitylist`` endpoint that Google's own Maps web client uses.

Discovery: when you visit a shared list URL, Google's HTML preloads a call to
``/maps/preview/entitylist/getlist?...&pb=...`` that returns the list as a
JSON payload (with the canonical ``)]}'`` JSONP-prefix). That endpoint is
unauthenticated for any anyone-with-link list, and returns clean structured
data — no DOM scraping required.
"""
from __future__ import annotations

import hashlib
import json
import re
from typing import Any
from urllib.parse import urljoin

import httpx


# A minimal UA. Full Chrome UA strings trigger Google's JS-required interstitial
# (the page that redirects via JS instead of HTTP). The bare "Mozilla/5.0"
# convinces Google to serve the bot-friendly redirect path.
USER_AGENT = "Mozilla/5.0"
COMMON_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept-Language": "en-US,en;q=0.9",
}

JSONP_PREFIX = ")]}'"


def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s or "list"


def signed_to_unsigned(value: str | int) -> int:
    """Google encodes 64-bit IDs as signed decimals; flip to unsigned for URL use."""
    n = int(value)
    if n < 0:
        n += 1 << 64
    return n


def cid_to_maps_url(cid: str | int) -> str:
    return f"https://maps.google.com/?cid={signed_to_unsigned(cid)}"


def fetch_list(short_url: str, client: httpx.Client) -> dict[str, Any]:
    """Resolve a maps.app.goo.gl link and return the parsed list payload."""
    landing = client.get(short_url, follow_redirects=True, timeout=20)
    landing.raise_for_status()

    api_path = _extract_api_path(landing.text)
    if not api_path:
        raise RuntimeError("Could not locate entitylist API path on landing page")

    api_url = urljoin("https://www.google.com", api_path)
    api_resp = client.get(
        api_url,
        follow_redirects=True,
        timeout=30,
        headers={**COMMON_HEADERS, "Referer": str(landing.url)},
    )
    api_resp.raise_for_status()

    body = api_resp.text
    if body.startswith(JSONP_PREFIX):
        body = body[len(JSONP_PREFIX):]
    data = json.loads(body)
    return _parse_payload(data)


def _extract_api_path(html: str) -> str | None:
    m = re.search(
        r'href="(/maps/preview/entitylist/getlist[^"]+)"',
        html,
    )
    if not m:
        return None
    return m.group(1).replace("&amp;", "&")


def _parse_payload(data: list) -> dict[str, Any]:
    """Convert Google's protobuf-shaped JSON into a flat dict."""
    payload = data[0]
    list_id = _safe_get(payload, [0, 0])
    list_name = _safe_get(payload, [4]) or ""
    raw_places = _safe_get(payload, [8]) or []

    places = []
    for entry in raw_places:
        place = _parse_place(entry)
        if place:
            places.append(place)

    return {
        "list_id": list_id,
        "list_name": list_name,
        "places": places,
    }


def _parse_place(entry: list) -> dict[str, Any] | None:
    details = _safe_get(entry, [1])
    name = _safe_get(entry, [2]) or ""
    if not name or not details:
        return None

    full_label = _safe_get(details, [2]) or ""
    address = _safe_get(details, [4]) or ""
    coords = _safe_get(details, [5]) or [None, None, None, None]
    fid_parts = _safe_get(details, [6]) or []
    mid = _safe_get(details, [7]) or ""

    lat = _to_float(_safe_get(coords, [2]))
    lng = _to_float(_safe_get(coords, [3]))

    cid = None
    if isinstance(fid_parts, list) and len(fid_parts) >= 2:
        cid = str(fid_parts[1])

    maps_url = cid_to_maps_url(cid) if cid else _fallback_maps_url(name, address)

    place_id = _stable_place_id(mid, fid_parts, name, address)

    return {
        "place_id": place_id,
        "name": name,
        "address": address,
        "full_label": full_label,
        "lat": lat,
        "lng": lng,
        "mid": mid,
        "cid": cid,
        "maps_url": maps_url,
    }


def _safe_get(obj: Any, path: list[int]) -> Any:
    cur = obj
    for k in path:
        if cur is None:
            return None
        try:
            cur = cur[k]
        except (IndexError, KeyError, TypeError):
            return None
    return cur


def _to_float(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def _stable_place_id(
    mid: str, fid_parts: list, name: str, address: str
) -> str:
    if mid:
        return mid
    if isinstance(fid_parts, list) and len(fid_parts) >= 2:
        return f"fid:{fid_parts[0]}:{fid_parts[1]}"
    seed = f"{name}|{address}".encode("utf-8")
    return "h:" + hashlib.sha1(seed).hexdigest()[:16]


def _fallback_maps_url(name: str, address: str) -> str:
    from urllib.parse import quote
    q = quote(f"{name} {address}".strip())
    return f"https://www.google.com/maps/search/?api=1&query={q}"
