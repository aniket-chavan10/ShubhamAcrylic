export async function fetchProductStats() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const res = await fetch("http://localhost:5000/api/products/stats", {
    headers: {
      "Authorization": `Bearer ${token}`
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch product stats");
  }
  return await res.json();
}


// api/products.ts (your service methods file)
export async function fetchProducts() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const res = await fetch("http://localhost:5000/api/products", {
    headers: {
      "Authorization": `Bearer ${token}`
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch products");
  }
  return await res.json();
}

export async function addProduct(formData: FormData) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const res = await fetch("http://localhost:5000/api/products", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      // 'Content-Type' is set automatically by browser for FormData
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to add product");
  }

  return await res.json();
}


export async function updateProduct(id: string, productData: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`http://localhost:5000/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(productData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update product");
  }
  return await res.json();
}
