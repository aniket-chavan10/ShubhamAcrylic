import { useEffect, useState } from "react";
import { getSiteSettings } from "../services/siteSettingsService";
import { getImageUrl } from "../utils/imageUtils";

export interface Brand {
  companyName: string;
  /** Full URL of the uploaded logo, or "" if none has been uploaded */
  logoUrl: string;
}

/** Bundled copy of the Astitva logo, used until/unless one is uploaded in Site Settings */
export const FALLBACK_LOGO = "/brand-logo.jpg";
const DEFAULT_BRAND: Brand = { companyName: "Astitva Creations", logoUrl: "" };

let cached: Brand | null = null;
let pending: Promise<Brand> | null = null;
const listeners = new Set<(b: Brand) => void>();

function load(): Promise<Brand> {
  if (!pending) {
    pending = getSiteSettings()
      .then((s: { companyName?: string; logoUrl?: string }) => ({
        companyName: s.companyName || DEFAULT_BRAND.companyName,
        logoUrl: getImageUrl(s.logoUrl),
      }))
      .catch(() => DEFAULT_BRAND)
      .then(b => { cached = b; return b; });
  }
  return pending;
}

/** Push fresh values after the admin saves Site Settings */
export function setBrand(next: Partial<Brand>) {
  cached = { ...(cached ?? DEFAULT_BRAND), ...next };
  pending = Promise.resolve(cached);
  listeners.forEach(fn => fn(cached!));
}

/** Company name and logo, fetched once and shared by the whole admin */
export function useBrand(): Brand {
  const [brand, setState] = useState<Brand>(cached ?? DEFAULT_BRAND);
  useEffect(() => {
    let alive = true;
    load().then(b => { if (alive) setState(b); });
    listeners.add(setState);
    return () => { alive = false; listeners.delete(setState); };
  }, []);
  return brand;
}
