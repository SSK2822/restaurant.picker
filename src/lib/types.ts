export interface ListEntry {
  slug: string;
  name: string;
  count: number;
  updated_at: string;
}

export interface IndexFile {
  updated_at: string;
  lists: ListEntry[];
}

export interface Place {
  place_id: string;
  name: string;
  address: string;
  borough: string;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  reviews: number | null;
  cuisine: string;
  price_level: string;
  photo_url: string | null;
  maps_url: string;
}

export interface ListFile {
  name: string;
  slug: string;
  source_url: string;
  updated_at: string;
  places: Place[];
}
