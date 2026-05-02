import { Link } from "react-router-dom";
import type { Place } from "../lib/types";
import { toggleVisited, useStateSnapshot } from "../lib/notes";

interface Props {
  place: Place;
  listSlug: string;
}

export default function PlaceCard({ place, listSlug }: Props) {
  const states = useStateSnapshot();
  const meta = states[place.place_id];
  const hasNote = !!meta?.notes;
  const isFav = !!meta?.favorite;
  const visited = !!meta?.visited;
  const price = meta?.price || "";

  return (
    <div className="card overflow-hidden hover:shadow-pop hover:-translate-y-0.5 transition flex flex-col relative">
      {/* Visited toggle — top-left corner */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleVisited(place.place_id);
        }}
        title={visited ? "Mark as not visited" : "Mark as visited"}
        className={
          "absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow transition " +
          (visited
            ? "bg-green-500 text-white"
            : "bg-white/80 text-gray-400 hover:text-green-500")
        }
      >
        ✓
      </button>

      <Link
        to={`/place/${listSlug}/${encodeURIComponent(place.place_id)}`}
        className="flex flex-col flex-1"
      >
        <div className="aspect-[4/3] bg-sun-100 overflow-hidden relative">
          {place.photo_url ? (
            <img
              src={place.photo_url}
              alt={place.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🍽️
            </div>
          )}
          {isFav && (
            <span className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-1 text-bird-500 text-sm shadow">
              ★
            </span>
          )}
          {visited && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
              <span className="bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                visited
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col gap-1.5">
          <h3 className="font-display font-bold text-lg leading-tight text-sun-900">
            {place.name}
          </h3>
          <div className="flex flex-wrap gap-1.5 text-sm text-sun-700">
            {place.rating != null && (
              <span className="pill">★ {place.rating.toFixed(1)}</span>
            )}
            {price && <span className="pill">{price}</span>}
            {place.cuisine && <span className="pill">{place.cuisine}</span>}
            {place.borough && (
              <span className="pill bg-blue-50 text-blue-700">{place.borough}</span>
            )}
            {hasNote && (
              <span className="pill bg-bird-100 text-bird-600">📝</span>
            )}
          </div>
          {place.address && (
            <p className="text-xs text-sun-700/70 mt-auto pt-2 line-clamp-2">
              {place.address}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
