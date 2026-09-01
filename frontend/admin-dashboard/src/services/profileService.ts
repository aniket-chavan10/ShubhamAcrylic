import { fetchWithAuth } from "../utils/apiUtils";

// ── Get current logged-in user ────────────────────────────────────────────────
export async function getMe() {
  const res = await fetchWithAuth("/auth/me");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

// ── Change password ───────────────────────────────────────────────────────────
export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await fetchWithAuth("/auth/update-password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update password");
  }
  return res.json();
}

// ── List all admins ───────────────────────────────────────────────────────────
export async function listAdmins() {
  const res = await fetchWithAuth("/auth/admins");
  if (!res.ok) throw new Error("Failed to fetch admin list");
  return res.json();
}

// ── Create new admin ──────────────────────────────────────────────────────────
export async function createAdmin(username: string, email: string, password: string) {
  const res = await fetchWithAuth("/auth/create-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create admin");
  }
  return res.json();
}

// ── Delete admin ──────────────────────────────────────────────────────────────
export async function deleteAdmin(id: number) {
  const res = await fetchWithAuth(`/auth/admins/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete admin");
  }
  return res.json();
}
