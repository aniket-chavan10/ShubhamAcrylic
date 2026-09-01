import { fetchWithAuth } from "../utils/apiUtils";

export async function getSiteSettings() {
  const res = await fetchWithAuth("/settings");
  if (!res.ok) throw new Error("Failed to fetch site settings");
  return res.json();
}

export async function updateSiteSettings(formData: FormData) {
  const res = await fetchWithAuth("/settings", {
    method: "PUT",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update settings");
  }
  return res.json();
}
