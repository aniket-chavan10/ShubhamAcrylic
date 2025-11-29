import { fetchWithAuth } from "../utils/apiUtils";

export async function fetchProductStats() {
  const res = await fetchWithAuth("/products/stats");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch product stats");
  }
  return await res.json();
}

export async function fetchProducts() {
  const res = await fetchWithAuth("/products");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch products");
  }
  return await res.json();
}

export async function addProduct(formData: FormData) {
  const res = await fetchWithAuth("/products", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to add product");
  }

  return await res.json();
}

export async function updateProduct(id: string, productData: any) {
  // If productData is FormData, pass it directly. If object, stringify it.
  // But wait, the original code stringified it. Let's check if it handles file uploads in update.
  // The original updateProduct used JSON.stringify(productData).
  // But wait, if we want to support image update, we might need FormData.
  // Let's stick to original behavior for now, but use fetchWithAuth.

  const isFormData = productData instanceof FormData;

  const res = await fetchWithAuth(`/products/${id}`, {
    method: "PUT",
    body: isFormData ? productData : JSON.stringify(productData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update product");
  }
  return await res.json();
}

export async function deleteProduct(id: string) {
  const res = await fetchWithAuth(`/products/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete product");
  }
  return await res.json();
}
