import { useState, useEffect } from "react";
import { fetchProducts, addProduct, updateProduct } from "../services/productService";
import AdminLayout from "../components/AdminLayout";
import ProductForm from "../components/ProductForm";
import ProductTable from "../components/ProductTable";

const tabs = [
  { label: "Add / Edit Product", value: "add" },
  { label: "View Products", value: "view" },
];

const ManageProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("view");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await fetchProducts();
        console.log("API response:", fetchedProducts);

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
            category: p.category?.trim(),
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




  const handleTabSwitch = (tab: string) => {
    setActiveTab(tab);
    if (tab === "add" && editingProduct == null) {
      setEditingProduct(null);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setActiveTab("add");
  };

  const handleDelete = (id: string) => {
    // For now local delete - ideally call API to delete as well
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const handleFormSubmit = async (form: any) => {
    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct._id, form);
        setProducts((prev) =>
          prev.map((p) => (p._id === updated._id ? updated : p))
        );
      } else {
        const added = await addProduct(form);
        setProducts((prev) => [added, ...prev]);
      }
      setEditingProduct(null);
      setActiveTab("view");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-block w-1 h-8 rounded-full bg-blue-600"></span>
        <h2 className="text-3xl font-bold text-blue-900 tracking-tight">Manage Products</h2>
      </div>
      <div className="w-full max-w-7xl pb-16 min-h-[75vh]">
        {/* Tabs */}
        <div className="flex flex-row gap-2 mb-5 items-center">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabSwitch(tab.value)}
              className={`
                px-6 py-2 rounded-t-xl font-semibold transition-all
                border-b-2
                ${activeTab === tab.value
                  ? "bg-white text-blue-700 border-blue-600 shadow"
                  : "bg-gray-50 text-gray-500 border-transparent hover:bg-blue-50"}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Card Content */}
        <div className="bg-white rounded-3xl shadow-2xl px-10 py-12">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-block w-1 h-8 rounded-full bg-blue-600"></span>
            <h2 className="text-3xl font-bold text-blue-900 tracking-tight">
              {activeTab === "add"
                ? editingProduct
                  ? "Edit Product"
                  : "Add New Product"
                : "All Products"}
            </h2>
          </div>

          {loading && <p>Loading products...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}

          {activeTab === "add" && (
            <ProductForm
              initialValues={editingProduct}
              onSubmit={handleFormSubmit}
              mode={editingProduct ? "edit" : "add"}
              onCancel={() => {
                setEditingProduct(null);
                setActiveTab("view");
              }}
            />
          )}
          {activeTab === "view" && (
            <ProductTable
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageProducts;
