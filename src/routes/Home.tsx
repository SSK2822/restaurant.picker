import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadIndex, loadList } from "../lib/data";
import { getLastList, setLastList, useStateSnapshot } from "../lib/notes";
import type { IndexFile, ListFile } from "../lib/types";
import type { PriceLevel } from "../lib/notes";
import ListPicker from "../components/ListPicker";
import PlaceCard from "../components/PlaceCard";

type StatusFilter = "all" | "favorites" | "noted" | "visited" | "unvisited";

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
const PRICES: PriceLevel[] = ["$", "$$", "$$$", "$$$$"];

export default function Home() {
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [list, setList] = useState<ListFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [borough, setBorough] = useState<string>("");
  const [price, setPrice] = useState<PriceLevel>("");
  const states = useStateSnapshot();

  useEffect(() => {
    loadIndex().then(setIndex).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!index || index.lists.length === 0) return;
    const last = getLastList();
    const slug =
      (last && index.lists.find((l) => l.slug === last)?.slug) ||
      index.lists[0].slug;
    pickList(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const pickList = (slug: string) => {
    setList(null);
    setLastList(slug);
    // Reset sub-filters when switching lists
    setBorough("");
    setPrice("");
    setStatus("all");
    loadList(slug).then(setList).catch((e) => setError(String(e)));
  };

  // Which boroughs actually appear in this list
  const availableBoroughs = useMemo(() => {
    if (!list) return [];
    const seen = new Set(list.places.map((p) => p.borough).filter(Boolean));
    return BOROUGHS.filter((b) => seen.has(b));
  }, [list]);

  // Which prices are set for this list's places
  const availablePrices = useMemo(() => {
    if (!list) return [] as PriceLevel[];
    const seen = new Set(
      list.places.map((p) => states[p.place_id]?.price).filter(Boolean)
    );
    return PRICES.filter((p) => seen.has(p));
  }, [list, states]);

  const filtered = useMemo(() => {
    if (!list) return [];
    const q = search.trim().toLowerCase();
    return list.places.filter((p) => {
      const meta = states[p.place_id];
      if (status === "favorites" && !meta?.favorite) return false;
      if (status === "noted" && !meta?.notes) return false;
      if (status === "visited" && !meta?.visited) return false;
      if (status === "unvisited" && meta?.visited) return false;
      if (borough && p.borough !== borough) return false;
      if (price && (meta?.price || "") !== price) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.cuisine || "").toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q) ||
        (p.borough || "").toLowerCase().includes(q)
      );
    });
  }, [list, search, status, borough, price, states]);

  if (error) {
    return (
      <div className="card p-6 mt-6">
        <h2 className="text-xl font-bold mb-2">Couldn't load your lists</h2>
        <p className="text-sm text-sun-700 mb-4">
          The data file <code>data/index.json</code> hasn't been generated yet.
          Run the scraper or trigger the GitHub Action.
        </p>
        <pre className="text-xs bg-sun-100 p-3 rounded-lg overflow-x-auto">
          {error}
        </pre>
      </div>
    );
  }

  if (!index) return <Loading label="loading lists…" />;
  if (index.lists.length === 0) {
    return (
      <div className="card p-6 mt-6">
        <p>No lists found. Add some to <code>config/lists.yaml</code>.</p>
      </div>
    );
  }

  const activeFilterCount =
    (status !== "all" ? 1 : 0) + (borough ? 1 : 0) + (price ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* List tabs */}
      <ListPicker
        lists={index.lists}
        selected={list?.slug ?? ""}
        onChange={pickList}
      />

      {list && (
        <>
          {/* Action + search row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <Link
              to={`/spin/${list.slug}`}
              className="btn-primary text-base sm:text-lg shrink-0"
            >
              <span className="text-xl">🎰</span>
              Spin for tonight
            </Link>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, cuisine, address…"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/80 border border-sun-200 focus:border-sun-400 focus:outline-none text-sm"
            />
          </div>

          {/* Filter rows */}
          <div className="space-y-2">
            {/* Status row */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-sun-700/60 w-14 shrink-0">Status</span>
              <FilterPills
                options={[
                  { value: "all", label: "All" },
                  { value: "favorites", label: "★ Favs" },
                  { value: "visited", label: "✓ Visited" },
                  { value: "unvisited", label: "Not visited" },
                  { value: "noted", label: "📝 Notes" },
                ]}
                value={status}
                onChange={(v) => setStatus(v as StatusFilter)}
              />
            </div>

            {/* Borough row — only shown when boroughs exist */}
            {availableBoroughs.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-sun-700/60 w-14 shrink-0">Area</span>
                <FilterPills
                  options={[
                    { value: "", label: "All areas" },
                    ...availableBoroughs.map((b) => ({ value: b, label: b })),
                  ]}
                  value={borough}
                  onChange={setBorough}
                />
              </div>
            )}

            {/* Price row — only shown when some prices have been set */}
            {availablePrices.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-sun-700/60 w-14 shrink-0">Price</span>
                <FilterPills
                  options={[
                    { value: "", label: "Any" },
                    ...availablePrices.map((p) => ({ value: p, label: p })),
                  ]}
                  value={price}
                  onChange={(v) => setPrice(v as PriceLevel)}
                />
              </div>
            )}

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setStatus("all"); setBorough(""); setPrice(""); }}
                className="text-xs text-sun-700/60 hover:text-bird-500 transition ml-16"
              >
                clear filters ×
              </button>
            )}
          </div>
        </>
      )}

      {/* Results */}
      {!list ? (
        <Loading label="loading places…" />
      ) : filtered.length === 0 ? (
        <div className="card p-6 text-center text-sun-700 space-y-2">
          <p>
            {list.places.length === 0
              ? "This list is empty (or hasn't been scraped yet)."
              : "Nothing matches your filters."}
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setStatus("all"); setBorough(""); setPrice(""); setSearch(""); }}
              className="btn-ghost text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PlaceCard key={p.place_id} place={p} listSlug={list.slug} />
          ))}
        </div>
      )}

      {list && (
        <p className="text-center text-xs text-sun-700/60">
          {filtered.length} of {list.places.length} places
          {" · "}last synced {new Date(list.updated_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function FilterPills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={
            "px-3 py-1 rounded-full text-xs font-semibold border transition " +
            (o.value === value
              ? "bg-sun-500 text-white border-sun-500"
              : "bg-white/70 text-sun-800 border-sun-200 hover:bg-sun-100")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sun-700/70 gap-3">
      <span className="inline-block w-2 h-2 rounded-full bg-sun-500 animate-pulse" />
      {label}
    </div>
  );
}
