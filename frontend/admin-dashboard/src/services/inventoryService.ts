import { fetchWithAuth } from "../utils/apiUtils";

export type StockStatus = "ok" | "low" | "out";
export type MovementType = "purchase" | "usage" | "adjustment" | "order";

export interface RawMaterial {
  id: number;
  name: string;
  category: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  unit: string;
  quantity: number | string;
  reorderLevel: number | string;
  reorderQty: number | string;
  costPrice: number | string;
  supplier: string;
  notes?: string;
  garmentId?: number | null;
  isActive: boolean;
  status: StockStatus;
  suggestedBuy: number;
}

export interface StockMovement {
  id: number;
  materialId: number;
  type: MovementType;
  change: number | string;
  balanceAfter: number | string;
  unitCost?: number | string | null;
  supplier: string;
  reference: string;
  note?: string;
  date: string;
  createdAt: string;
  material?: Pick<RawMaterial, "id" | "name" | "color" | "size" | "unit">;
}

export interface InventorySummary { total: number; low: number; out: number; value: number }

export const CATEGORIES = [
  { value: "garment", label: "Plain garments" },
  { value: "ink", label: "Inks & colours" },
  { value: "transfer", label: "DTF / transfer film" },
  { value: "packaging", label: "Packaging" },
  { value: "other", label: "Other" },
];

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  purchase: "Purchase",
  usage: "Used",
  adjustment: "Stock count",
  order: "Website order",
};

/** "Plain Hoodie · Jet Black · L" */
export const materialLabel = (m: Pick<RawMaterial, "name" | "color" | "size">) =>
  [m.name, m.color, m.size].filter(Boolean).join(" · ");

async function json<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fallback);
  }
  return res.json();
}

export async function fetchMaterials(params: { q?: string; category?: string; stock?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  return json<{ materials: RawMaterial[]; summary: InventorySummary }>(await fetchWithAuth(`/raw-materials?${qs}`), "Failed to load inventory");
}

export async function fetchReorder() {
  return json<{ items: RawMaterial[]; count: number; summary: InventorySummary }>(await fetchWithAuth("/raw-materials/reorder"), "Failed to load stock alerts");
}

export async function saveMaterial(id: number | null, data: Record<string, unknown>) {
  return json<RawMaterial>(await fetchWithAuth(id ? `/raw-materials/${id}` : "/raw-materials", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(data),
  }), "Failed to save material");
}

export async function bulkCreateMaterials(items: Record<string, unknown>[]) {
  return json<{ created: RawMaterial[]; skipped: number }>(await fetchWithAuth("/raw-materials/bulk", {
    method: "POST",
    body: JSON.stringify({ items }),
  }), "Failed to add materials");
}

export async function deleteMaterial(id: number) {
  return json(await fetchWithAuth(`/raw-materials/${id}`, { method: "DELETE" }), "Failed to delete material");
}

export async function addMovement(id: number, data: Record<string, unknown>) {
  return json<{ material: RawMaterial; movement: StockMovement }>(await fetchWithAuth(`/raw-materials/${id}/movements`, {
    method: "POST",
    body: JSON.stringify(data),
  }), "Failed to update stock");
}

export async function recordPurchase(data: { date: string; supplier: string; reference: string; note: string; items: { materialId: number; quantity: number; unitCost: number | "" }[] }) {
  return json<{ count: number; total: number }>(await fetchWithAuth("/raw-materials/purchases", {
    method: "POST",
    body: JSON.stringify(data),
  }), "Failed to record purchase");
}

export async function fetchMovements(materialId?: number, limit = 100) {
  return json<StockMovement[]>(await fetchWithAuth(materialId ? `/raw-materials/${materialId}/movements?limit=${limit}` : `/raw-materials/movements?limit=${limit}`), "Failed to load history");
}

/** WhatsApp-ready shopping list for the supplier */
export function buyListText(items: RawMaterial[], company: string) {
  const lines = items.map(m => `• ${materialLabel(m)} — ${m.suggestedBuy} ${m.unit} (have ${Number(m.quantity)})`);
  return `${company} – materials to order\n\n${lines.join("\n")}`;
}
