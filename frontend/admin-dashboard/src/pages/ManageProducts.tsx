import { useState, useEffect } from "react";
import { fetchProducts, addProduct, updateProduct, deleteProduct } from "../services/productService";
import AdminLayout from "../components/AdminLayout";
import ProductForm from "../components/ProductForm";
import ProductTable from "../components/ProductTable";
import { ArrowLeft, Plus } from "lucide-react";
import { PageLoader } from "../components/ui";

const ManageProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await fetchProducts();

        let productsArray: any[] = [];

        if (!Array.isArray(fetchedProducts)) {
          // If products array is nested inside 'products' key
          if (Array.isArray(fetchedProducts.products)) {
            productsArray = fetchedProducts.products;
          } else {
            setError("Invalid products data format");
            setLoading(false);
            return;
          }
        } else {
          productsArray = fetchedProducts;
        }

        const cleanedProducts = productsArray.map((p: any) => {
          let parsedTags: string[] = [];

          if (Array.isArray(p.tags)) {
            // Parse stringified tags inside the array if any
            parsedTags = p.tags.flatMap((tag: any) => {
              try {
                const parsed = JSON.parse(tag);
                return Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                return [tag]; // Normal string
              }
            });
          } else if (typeof p.tags === "string") {
            try {
              parsedTags = JSON.parse(p.tags);
              if (!Array.isArray(parsedTags)) parsedTags = [];
            } catch {
              parsedTags = p.tags.split(",").map((t: string) => t.trim());
            }
          }

          return {
            ...p,
            tags: parsedTags,
            name: p.name?.trim(),
            description: p.description?.trim(),
            category: typeof p.category === 'object' ? p.category : p.category?.trim(),
            materialType: p.materialType?.trim(),
            size: p.size?.trim(),
            color: p.color?.trim(),
          };
        });

        setProducts(cleanedProducts);
        setLoading(false);
      } catch (err: any) {
        setLoading(false);
        setError(err.message);
      }
    };
    loadProducts();
  }, []);

  const handleAddNew = () => {
    setEditingProduct(null);
    setViewMode("form");
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setViewMode("form");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert("Product deleted successfully!");
    } catch (err: any) {
      alert("Failed to delete product: " + err.message);
    }
  };

  const handleFormSubmit = async (form: any) => {
    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, form);
        setProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      } else {
        const added = await addProduct(form);
        setProducts((prev) => [added, ...prev]);
      }
      setEditingProduct(null);
      setViewMode("list");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const backToList = () => {
    setEditingProduct(null);
    setViewMode("list");
  };

  return (
    <AdminLayout
      title={viewMode === "form" ? (editingProduct ? "Edit product" : "New product") : "Products"}
      actions={viewMode === "list"
        ? <button onClick={handleAddNew} className="a-btn-accent"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add product</span></button>
        : <button onClick={backToList} className="a-btn-outline"><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">All products</span></button>}
    >
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {viewMode === "form" ? (
        <div className="a-card p-5 sm:p-6">
          <ProductForm
            initialValues={editingProduct}
            onSubmit={handleFormSubmit}
            mode={editingProduct ? "edit" : "add"}
            onCancel={backToList}
          />
        </div>
      ) : loading ? (
        <div className="a-card"><PageLoader /></div>
      ) : (
        <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} onAdd={handleAddNew} />
      )}
    </AdminLayout>
  );
};

export default ManageProducts;
