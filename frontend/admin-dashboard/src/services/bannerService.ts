import { fetchWithAuth } from "../utils/apiUtils";

const API_BASE = "/banners";

export async function fetchBanners() {
    const res = await fetchWithAuth(API_BASE);

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch banners");
    }
    return await res.json();
}

export async function addBanner(formData: FormData) {
    const res = await fetchWithAuth(API_BASE, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add banner");
    }
    return await res.json();
}

export async function updateBanner(id: string, formData: FormData) {
    const res = await fetchWithAuth(`${API_BASE}/${id}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update banner");
    }
    return await res.json();
}

export async function deleteBanner(id: string) {
    const res = await fetchWithAuth(`${API_BASE}/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete banner");
    }
    return await res.json();
}
