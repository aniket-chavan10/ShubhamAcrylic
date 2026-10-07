import { fetchWithAuth } from "../utils/apiUtils";

export type GarmentStyle = "hoodie" | "oversized-tee" | "polo";

export interface GarmentColor { name: string; hex: string }
export interface GarmentSize { label: string; extra: number }
export interface Placement {
  key: string;
  label: string;
  view: "front" | "back";
  price: number;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
}
export interface Garment {
  id: number;
  key: string;
  style: GarmentStyle;
  name: string;
  tagline: string;
  description: string;
  fabric: string;
  basePrice: number | string;
  colors: GarmentColor[];
  sizes: GarmentSize[];
  placements: Placement[];
  mockupFront?: string | null;
  mockupBack?: string | null;
  /** Home page card photo */
  coverImage?: string | null;
  isActive: boolean;
  sortOrder: number;
}

async function json(res: Response, fallback: string) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fallback);
  }
  return res.json();
}

export async function fetchGarments(): Promise<Garment[]> {
  return json(await fetchWithAuth("/garments/admin/all"), "Failed to load garments");
}

export async function saveGarment(id: number | null, form: FormData): Promise<Garment> {
  const res = await fetchWithAuth(id ? `/garments/${id}` : "/garments", { method: id ? "PUT" : "POST", body: form });
  return json(res, "Failed to save garment");
}

export async function deleteGarment(id: number) {
  return json(await fetchWithAuth(`/garments/${id}`, { method: "DELETE" }), "Failed to delete garment");
}
