import { useEffect, useState } from "react";
import { fetchReorder, RawMaterial } from "../services/inventoryService";

export interface StockAlerts {
  items: RawMaterial[];
  count: number;
  loaded: boolean;
}

const EMPTY: StockAlerts = { items: [], count: 0, loaded: false };
let cached: StockAlerts = EMPTY;
let pending: Promise<void> | null = null;
let fetchedAt = 0;
const listeners = new Set<(a: StockAlerts) => void>();
const MAX_AGE = 60_000;

function load(force = false) {
  if (!force && (pending || Date.now() - fetchedAt < MAX_AGE)) return;
  pending = fetchReorder()
    .then(r => { cached = { items: r.items, count: r.count, loaded: true }; })
    .catch(() => { cached = { ...cached, loaded: true }; })
    .finally(() => {
      pending = null;
      fetchedAt = Date.now();
      listeners.forEach(fn => fn(cached));
    });
}

/** Re-fetch after stock changes so the menu badge and dashboard stay current */
export function refreshStockAlerts() {
  load(true);
}

/** Materials at or below their alert level, shared by the sidebar badge and dashboard */
export function useStockAlerts(): StockAlerts {
  const [alerts, setAlerts] = useState<StockAlerts>(cached);
  useEffect(() => {
    listeners.add(setAlerts);
    if (cached.loaded) setAlerts(cached);
    load();
    return () => { listeners.delete(setAlerts); };
  }, []);
  return alerts;
}
