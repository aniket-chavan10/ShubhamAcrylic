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

export async function updateProduct(id: number | string, productData: any) {
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

export async function deleteProduct(id: number | string) {
  const res = await fetchWithAuth(`/products/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete product");
  }
  return await res.json();
}
