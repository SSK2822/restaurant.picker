import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadList } from "../lib/data";
import {
  getNote,
  isFavorite,
  setNote as persistNote,
  toggleFavorite,
  useStateSnapshot,
} from "../lib/notes";
import type { ListFile, Place } from "../lib/types";

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

  const save = () => {
    persistNote(decodedId, draft);
    setSavedAt(Date.now());
    window.setTimeout(() => setSavedAt(null), 1500);
  };

  return (
    <div className="space-y-5 pt-2">
      <Link to="/" className="btn-ghost text-sm">← back</Link>

      <div className="card overflow-hidden">
        {place.photo_url && (
          <img
            src={place.photo_url}
            alt={place.name}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-display font-bold">{place.name}</h1>
            <button
              onClick={() => toggleFavorite(decodedId)}
              aria-label={fav ? "Unfavorite" : "Favorite"}
              className={
                "text-2xl rounded-full w-11 h-11 flex items-center justify-center transition " +
                (fav
                  ? "bg-bird-100 text-bird-500"
                  : "bg-sun-100 text-sun-400 hover:text-bird-500")
              }
            >
              {fav ? "★" : "☆"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 text-sm">
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
            {place.cuisine && <span className="pill">{place.cuisine}</span>}
            {place.price_level && <span className="pill">{place.price_level}</span>}
          </div>
          {place.address && (
            <p className="text-sm text-sun-700/80">{place.address}</p>
          )}
          <a
            href={place.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-2"
          >
            Open in Google Maps
          </a>
        </div>
      </div>

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
            onClick={save}
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
