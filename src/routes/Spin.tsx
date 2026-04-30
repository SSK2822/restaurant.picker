import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { loadList } from "../lib/data";
import type { ListFile, Place } from "../lib/types";
import SpinWheel from "../components/SpinWheel";

export default function Spin() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState<ListFile | null>(null);
  const [winner, setWinner] = useState<Place | null>(null);
  const [spinKey, setSpinKey] = useState(1);

  useEffect(() => {
    loadList(slug).then(setList).catch(() => navigate("/"));
  }, [slug, navigate]);

  if (!list) {
    return (
      <div className="flex items-center justify-center py-16 text-sun-700/70">
        loading…
      </div>
    );
  }

  if (list.places.length === 0) {
    return (
      <div className="card p-6 mt-6 text-center">
        <p className="mb-4">This list is empty — nothing to spin.</p>
        <Link to="/" className="btn-ghost">← back</Link>
      </div>
    );
  }

  const respin = () => {
    setWinner(null);
    setSpinKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col items-center gap-8 pt-4">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-sun-700/70">
          Spinning {list.name}
        </p>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mt-1">
          {winner ? "Tonight, you eat at…" : "Picking a place…"}
        </h1>
      </div>

      <SpinWheel places={list.places} spinKey={spinKey} onLanded={setWinner} />

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="card p-6 max-w-md w-full flex flex-col items-center text-center gap-3"
          >
            {winner.photo_url && (
              <img
                src={winner.photo_url}
                alt={winner.name}
                className="w-full h-48 object-cover rounded-xl"
              />
            )}
            <h2 className="text-2xl font-display font-bold">{winner.name}</h2>
            <div className="flex gap-1.5 flex-wrap justify-center text-sm">
              {winner.rating != null && (
                <span className="pill">★ {winner.rating.toFixed(1)}</span>
              )}
              {winner.cuisine && <span className="pill">{winner.cuisine}</span>}
              {winner.price_level && (
                <span className="pill">{winner.price_level}</span>
              )}
            </div>
            {winner.address && (
              <p className="text-sm text-sun-700/80">{winner.address}</p>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <a
                href={winner.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Open in Maps
              </a>
              <Link
                to={`/place/${list.slug}/${encodeURIComponent(winner.place_id)}`}
                className="btn-ghost"
              >
                Notes
              </Link>
              <button onClick={respin} className="btn-ghost">
                🎲 Spin again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link to="/" className="btn-ghost text-sm">← back to list</Link>
    </div>
  );
}
