import { useState } from "react";

const ProductTable = ({
  products,
  onEdit,
  onDelete,
}: {
  products: any[] | undefined;   // allow undefined for safety
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
}) => {
  // Defensive fallback to empty array if products is falsy or not an array
  const safeProducts = Array.isArray(products) ? products : [];

  const categories = ["All", ...Array.from(new Set(safeProducts.map((p) =>
    typeof p.category === 'object' ? p.category?.name : p.category
  )))];
  const [activeTab, setActiveTab] = useState<string>("All");

  const filteredProducts =
    activeTab === "All"
      ? safeProducts
      : safeProducts.filter((p) => {
        const catName = typeof p.category === 'object' ? p.category?.name : p.category;
        return catName === activeTab;
      });

  const normalizeTags = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) {
      // Tags might contain JSON strings, parse each safely
      return tags.flatMap((tag) => {
        try {
          const parsed = JSON.parse(tag);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [tag];
        }
      });
    }
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return tags.split(",").map((t) => t.trim());
      }
    }
    return [];
  };


  return (
    <div className="mt-6">
      <div className="flex gap-2 mb-5">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full font-medium border transition
              ${activeTab === category
                ? "bg-blue-600 text-white shadow border-blue-600"
                : "bg-gray-50 hover:bg-blue-50 text-gray-700 border-gray-200"
              }`}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-lg overflow-x-auto p-2">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm border-b border-gray-200">
              <th className="py-3 px-3 text-left font-medium">Image</th>
              <th className="py-3 px-3 text-left font-medium">Name</th>
              <th className="py-3 px-3 text-left font-medium">Category</th>
              <th className="py-3 px-3 text-left font-medium">Price</th>
              <th className="py-3 px-3 text-left font-medium">Stock</th>
              <th className="py-3 px-3 text-left font-medium">Tags</th>
              <th className="py-3 px-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400">
                  No products in this category.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product._id}
                  className="border-b border-gray-100 hover:bg-blue-50 transition group"
                >
                  <td className="py-2 px-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200 group-hover:border-blue-400 transition"
                    />
                  </td>
                  <td className="py-2 px-3 font-semibold text-gray-900">
                    {product.name}
                    <div className="text-xs text-gray-400 font-normal">
                      {product.materialType}, {product.size}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {typeof product.category === 'object' ? product.category?.name : product.category}
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-blue-600 font-bold">₹{product.price}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${product.stockQuantity < 5
                        ? "bg-red-100 text-red-600"
                        : "bg-green-50 text-green-700"
                        }`}
                    >
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {normalizeTags(product.tags).map((tag: string) => (
                        <span
                          key={tag}
                          className="bg-blue-100 rounded-full px-2 py-0.5 text-xs text-blue-700 font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-2 px-3">
                    <button
                      className="mr-2 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded text-yellow-900 text-xs font-bold transition"
                      onClick={() => onEdit(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-900 text-xs font-bold transition"
                      onClick={() => onDelete(product._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
