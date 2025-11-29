import { fetchWithAuth } from "../utils/apiUtils";

export async function getAllCategories() {
    const res = await fetchWithAuth("/categories/admin/all");
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch categories");
    }
    return await res.json();
}

export async function getCategoryById(id: string) {
    const res = await fetchWithAuth(`/categories/${id}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch category");
    }
    return await res.json();
}

export async function createCategory(categoryData: {
    name: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
}) {
    const res = await fetchWithAuth("/categories", {
        method: "POST",
        body: JSON.stringify(categoryData),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create category");
    }
    return await res.json();
}

export async function updateCategory(
    id: string,
    categoryData: {
        name?: string;
        slug?: string;
        description?: string;
        isActive?: boolean;
    }
) {
    const res = await fetchWithAuth(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(categoryData),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update category");
    }
    return await res.json();
}

export async function deleteCategory(id: string) {
    const res = await fetchWithAuth(`/categories/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete category");
    }
    return await res.json();
}

export async function toggleCategoryStatus(id: string) {
    const res = await fetchWithAuth(`/categories/${id}/toggle`, {
        method: "PATCH",
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to toggle category status");
    }
    return await res.json();
}
