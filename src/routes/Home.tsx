import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadIndex, loadList } from "../lib/data";
import { getLastList, setLastList, useStateSnapshot } from "../lib/notes";
import type { IndexFile, ListFile } from "../lib/types";
import ListPicker from "../components/ListPicker";
import PlaceCard from "../components/PlaceCard";

type Filter = "all" | "favorites" | "noted";

export default function Home() {
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [list, setList] = useState<ListFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
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
    loadList(slug).then(setList).catch((e) => setError(String(e)));
  };

  const filtered = useMemo(() => {
    if (!list) return [];
    const q = search.trim().toLowerCase();
    return list.places.filter((p) => {
      if (filter === "favorites" && !states[p.place_id]?.favorite) return false;
      if (filter === "noted" && !states[p.place_id]?.notes) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.cuisine || "").toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q)
      );
    });
  }, [list, search, filter, states]);

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

  if (!index) {
    return <Loading label="loading lists…" />;
  }

  if (index.lists.length === 0) {
    return (
      <div className="card p-6 mt-6">
        <p>No lists found. Add some to <code>config/lists.yaml</code>.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 mt-2">
        <ListPicker
          lists={index.lists}
          selected={list?.slug ?? ""}
          onChange={pickList}
        />

        {list && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <Link
              to={`/spin/${list.slug}`}
              className="btn-primary text-base sm:text-lg"
            >
              <span className="text-xl">🎰</span>
              Spin for tonight
            </Link>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, cuisine, address…"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/80 border border-sun-200 focus:border-sun-400 focus:outline-none text-sm"
            />
            <FilterToggle value={filter} onChange={setFilter} />
          </div>
        )}
      </section>

      {!list ? (
        <Loading label="loading places…" />
      ) : filtered.length === 0 ? (
        <p className="card p-6 text-center text-sun-700">
          {list.places.length === 0
            ? "This list is empty (or hasn't been scraped yet)."
            : "Nothing matches your filters."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PlaceCard key={p.place_id} place={p} listSlug={list.slug} />
          ))}
        </div>
      )}

      {list && (
        <p className="text-center text-xs text-sun-700/60">
          Last updated {new Date(list.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function FilterToggle({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (v: Filter) => void;
}) {
  const opts: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "favorites", label: "★" },
    { value: "noted", label: "📝" },
  ];
  return (
    <div className="inline-flex rounded-full bg-white/80 border border-sun-200 p-1 self-start">
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={
            "px-3 py-1.5 rounded-full text-sm font-semibold transition " +
            (o.value === value
              ? "bg-sun-500 text-white"
              : "text-sun-700 hover:bg-sun-100")
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
