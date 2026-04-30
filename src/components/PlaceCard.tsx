import { Link } from "react-router-dom";
import type { Place } from "../lib/types";
import { useStateSnapshot } from "../lib/notes";

interface Props {
  place: Place;
  listSlug: string;
}

export default function PlaceCard({ place, listSlug }: Props) {
  const states = useStateSnapshot();
  const meta = states[place.place_id];
  const hasNote = !!meta?.notes;
  const isFav = !!meta?.favorite;

  return (
    <Link
      to={`/place/${listSlug}/${encodeURIComponent(place.place_id)}`}
      className="card overflow-hidden hover:shadow-pop hover:-translate-y-0.5 transition flex flex-col"
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
      </div>
      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <h3 className="font-display font-bold text-lg leading-tight text-sun-900">
          {place.name}
        </h3>
        <div className="flex flex-wrap gap-1.5 text-sm text-sun-700">
          {place.rating != null && (
            <span className="pill">★ {place.rating.toFixed(1)}</span>
          )}
          {place.cuisine && <span className="pill">{place.cuisine}</span>}
          {place.price_level && <span className="pill">{place.price_level}</span>}
          {hasNote && (
            <span className="pill bg-bird-100 text-bird-600">📝 noted</span>
          )}
        </div>
        {place.address && (
          <p className="text-xs text-sun-700/70 mt-auto pt-2 line-clamp-2">
            {place.address}
          </p>
        )}
      </div>
    </Link>
  );
}
