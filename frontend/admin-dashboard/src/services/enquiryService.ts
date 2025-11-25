const API_BASE = "http://localhost:5000/api/enquiries";

export async function fetchEnquiries(page = 1, limit = 10) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${API_BASE}?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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
  // No token assumed required for submitting Contact Us form; add if needed
  const res = await fetch(API_BASE, {
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
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${API_BASE}/pending-count`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch pending enquiry count");
  }
  return await res.json();
}


export async function deleteEnquiry(id: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete enquiry");
  }
  return await res.json();
}

// New: Mark enquiry as resolved/read by ID
export async function markEnquiryResolved(id: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${API_BASE}/${id}/resolve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to mark enquiry as resolved");
  }
  return await res.json();
}