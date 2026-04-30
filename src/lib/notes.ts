import { useEffect, useState } from "react";

const STORAGE_KEY = "sunnybird:state:v1";
const EVENT = "sunnybird:state-changed";

interface PlaceState {
  notes?: string;
  favorite?: boolean;
}

interface State {
  places: Record<string, PlaceState>;
  lastList?: string;
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { places: {} };
    const parsed = JSON.parse(raw) as Partial<State>;
    return { places: parsed.places ?? {}, lastList: parsed.lastList };
  } catch {
    return { places: {} };
  }
}

function persist(state: State) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT));
}

function prune(state: State, placeId: string) {
  const entry = state.places[placeId];
  if (entry && !entry.notes && !entry.favorite) {
    delete state.places[placeId];
  }
}

export function getNote(placeId: string): string {
  return load().places[placeId]?.notes ?? "";
}

export function setNote(placeId: string, note: string) {
  const state = load();
  const trimmed = note.trim();
  state.places[placeId] = {
    ...state.places[placeId],
    notes: trimmed || undefined,
  };
  prune(state, placeId);
  persist(state);
}

export function isFavorite(placeId: string): boolean {
  return !!load().places[placeId]?.favorite;
}

export function toggleFavorite(placeId: string): boolean {
  const state = load();
  const next = !state.places[placeId]?.favorite;
  state.places[placeId] = {
    ...state.places[placeId],
    favorite: next || undefined,
  };
  prune(state, placeId);
  persist(state);
  return next;
}

export function getLastList(): string | undefined {
  return load().lastList;
}

export function setLastList(slug: string) {
  const state = load();
  state.lastList = slug;
  persist(state);
}

export function getAllStates(): Record<string, PlaceState> {
  return load().places;
}

export function exportState(): string {
  return JSON.stringify(load(), null, 2);
}

export function importState(json: string) {
  const parsed = JSON.parse(json) as Partial<State>;
  persist({ places: parsed.places ?? {}, lastList: parsed.lastList });
}

export function useStateSnapshot() {
  const [snap, setSnap] = useState<Record<string, PlaceState>>(getAllStates);
  useEffect(() => {
    const handler = () => setSnap(getAllStates());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return snap;
}
