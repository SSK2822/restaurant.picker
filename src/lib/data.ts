import type { IndexFile, ListFile } from "./types";

const BASE = import.meta.env.BASE_URL;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}data/${path}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const loadIndex = (): Promise<IndexFile> => fetchJson("index.json");
export const loadList = (slug: string): Promise<ListFile> => fetchJson(`${slug}.json`);
