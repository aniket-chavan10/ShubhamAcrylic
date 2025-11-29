import { fetchWithAuth } from "../utils/apiUtils";

const API_BASE = "/enquiries";

export async function fetchEnquiries(page = 1, limit = 10) {
  const res = await fetchWithAuth(`${API_BASE}?page=${page}&limit=${limit}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch enquiries");
  }
  return await res.json();
}

export async function createEnquiry(formData: {
  name: string;
  email: string;
  mobileNo?: string;
  message: string;
}) {
  // Public endpoint, use regular fetch
  const res = await fetch(`http://localhost:5000/api${API_BASE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit enquiry");
  }
  return await res.json();
}

export async function fetchPendingEnquiryCount() {
  const res = await fetchWithAuth(`${API_BASE}/pending-count`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch pending enquiry count");
  }
  return await res.json();
}

export async function deleteEnquiry(id: string) {
  const res = await fetchWithAuth(`${API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete enquiry");
  }
  return await res.json();
}

// New: Mark enquiry as resolved/read by ID
export async function markEnquiryResolved(id: string) {
  const res = await fetchWithAuth(`${API_BASE}/${id}/resolve`, {
    method: "PATCH",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to mark enquiry as resolved");
  }
  return await res.json();
}