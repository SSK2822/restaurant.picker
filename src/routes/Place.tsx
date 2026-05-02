import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadList } from "../lib/data";
import {
  getNote,
  getPrice,
  isFavorite,
  isVisited,
  setNote as persistNote,
  setPrice as persistPrice,
  toggleFavorite,
  toggleVisited,
  useStateSnapshot,
  type PriceLevel,
} from "../lib/notes";
import type { ListFile, Place } from "../lib/types";

const PRICE_OPTIONS: PriceLevel[] = ["$", "$$", "$$$", "$$$$"];

export default function PlacePage() {
  const { slug = "", placeId = "" } = useParams();
  const decodedId = decodeURIComponent(placeId);
  const [list, setList] = useState<ListFile | null>(null);
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const states = useStateSnapshot();

  useEffect(() => {
    loadList(slug).then(setList).catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    setDraft(getNote(decodedId));
  }, [decodedId]);

  const place: Place | undefined = useMemo(
    () => list?.places.find((p) => p.place_id === decodedId),
    [list, decodedId]
  );

  if (!list) {
    return (
      <div className="flex items-center justify-center py-16 text-sun-700/70">
        loading…
      </div>
    );
  }

  if (!place) {
    return (
      <div className="card p-6 mt-6 text-center">
        <p className="mb-4">Place not found in this list.</p>
        <Link to="/" className="btn-ghost">← back</Link>
      </div>
    );
  }

  const fav = !!states[decodedId]?.favorite || isFavorite(decodedId);
  const visited = !!states[decodedId]?.visited || isVisited(decodedId);
  const currentPrice = (states[decodedId]?.price as PriceLevel) || getPrice(decodedId);

  const saveNote = () => {
    persistNote(decodedId, draft);
    setSavedAt(Date.now());
    window.setTimeout(() => setSavedAt(null), 1500);
  };

  return (
    <div className="space-y-5 pt-2">
      <Link to="/" className="btn-ghost text-sm">← back</Link>

      {/* Main card */}
      <div className="card overflow-hidden">
        {place.photo_url && (
          <img
            src={place.photo_url}
            alt={place.name}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-5 space-y-4">
          {/* Name + action buttons */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-display font-bold">{place.name}</h1>
            <div className="flex gap-2 shrink-0">
              {/* Visited toggle */}
              <button
                onClick={() => toggleVisited(decodedId)}
                title={visited ? "Mark as not visited" : "Mark as visited"}
                className={
                  "w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold transition " +
                  (visited
                    ? "bg-green-100 text-green-600"
                    : "bg-sun-100 text-sun-400 hover:text-green-500")
                }
              >
                {visited ? "✓" : "○"}
              </button>
              {/* Favorite toggle */}
              <button
                onClick={() => toggleFavorite(decodedId)}
                title={fav ? "Unfavorite" : "Favorite"}
                className={
                  "w-11 h-11 rounded-full flex items-center justify-center text-2xl transition " +
                  (fav
                    ? "bg-bird-100 text-bird-500"
                    : "bg-sun-100 text-sun-400 hover:text-bird-500")
                }
              >
                {fav ? "★" : "☆"}
              </button>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-1.5 text-sm">
            {visited && (
              <span className="pill bg-green-100 text-green-700">✓ visited</span>
            )}
            {place.rating != null && (
              <span className="pill">
                ★ {place.rating.toFixed(1)}
                {place.reviews != null && (
                  <span className="ml-1 text-sun-700/70">
                    ({place.reviews.toLocaleString()})
                  </span>
                )}
              </span>
            )}
            {currentPrice && <span className="pill">{currentPrice}</span>}
            {place.cuisine && <span className="pill">{place.cuisine}</span>}
            {place.borough && (
              <span className="pill bg-blue-50 text-blue-700">{place.borough}</span>
            )}
          </div>

          {place.address && (
            <p className="text-sm text-sun-700/80">{place.address}</p>
          )}

          <a
            href={place.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Open in Google Maps
          </a>
        </div>
      </div>

      {/* Price level setter */}
      <div className="card p-5 space-y-3">
        <h2 className="text-lg font-bold font-display">Price level</h2>
        <p className="text-xs text-sun-700/60">
          Set manually — used for filtering on the main list.
        </p>
        <div className="flex gap-2">
          {PRICE_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => persistPrice(decodedId, currentPrice === p ? "" : p)}
              className={
                "flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition " +
                (currentPrice === p
                  ? "bg-sun-500 text-white border-sun-500 shadow-pop"
                  : "bg-white text-sun-700 border-sun-200 hover:border-sun-400")
              }
            >
              {p}
            </button>
          ))}
          {currentPrice && (
            <button
              onClick={() => persistPrice(decodedId, "")}
              className="px-3 py-2.5 rounded-xl text-xs text-sun-600 hover:text-bird-500 border-2 border-transparent"
              title="Clear price"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Notes editor */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display">Your notes</h2>
          {savedAt && (
            <span className="text-xs text-sun-600 animate-pulse">saved ✓</span>
          )}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="get the dumplings, skip the soup…"
          className="w-full min-h-[140px] p-3 rounded-xl border border-sun-200 bg-white/90 focus:border-sun-400 focus:outline-none text-sm resize-y"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setDraft(getNote(decodedId))}
            className="btn-ghost"
            disabled={draft === getNote(decodedId)}
          >
            Reset
          </button>
          <button
            onClick={saveNote}
            className="btn-primary"
            disabled={draft === getNote(decodedId)}
          >
            Save note
          </button>
        </div>
        <p className="text-xs text-sun-700/60">
          Notes are saved in this browser only.
        </p>
      </div>
    </div>
  );
}
