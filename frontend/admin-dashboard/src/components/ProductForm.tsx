import { useState, useEffect } from "react";
import { getAllCategories } from "../services/categoryService";

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  category: "",
  materialType: "",
  size: "",
  color: "",
  weight: 0,
  stockQuantity: 0,
  tags: "",
  imageUrl: "", // No default image URL
};

const ProductForm = ({
  initialValues,
  onSubmit,
  mode = "add",
  onCancel,
}: {
  initialValues?: any;
  onSubmit: (data: any) => void;
  mode?: "add" | "edit";
  onCancel?: () => void;
}) => {
  const [form, setForm] = useState<any>(emptyForm);
  const [preview, setPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialValues) {
      let tagsString = "";

      if (Array.isArray(initialValues.tags)) {
        tagsString = initialValues.tags.join(", ");
      } else if (typeof initialValues.tags === "string") {
        try {
          const parsed = JSON.parse(initialValues.tags);
          if (Array.isArray(parsed)) {
            tagsString = parsed.join(", ");
          } else {
            tagsString = initialValues.tags;
          }
        } catch {
          tagsString = initialValues.tags; // Could be plain string already
        }
      }

      setForm({
        ...initialValues,
        tags: tagsString,
        category: typeof initialValues.category === 'object' ? initialValues.category._id : initialValues.category
      });
      setPreview(initialValues.imageUrl || "");
    } else {
      setForm(emptyForm);
      setPreview("");
    }
  }, [initialValues]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // ... (rest of image handling and submit logic remains same until return)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview("");
      setForm((prev: any) => ({ ...prev, imageUrl: "" }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setForm((prev: any) => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent multiple submits if already submitting

    setSubmitting(true);
    try {
      const tagsArray = form.tags
        ? form.tags.split(",").map((tag: string) => tag.trim())
        : [];

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price.toString());
      formData.append("category", form.category);
      formData.append("materialType", form.materialType);
      formData.append("size", form.size);
      formData.append("color", form.color);
      formData.append("weight", form.weight.toString());
      formData.append("stockQuantity", form.stockQuantity.toString());
      formData.append("tags", JSON.stringify(tagsArray));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append("image", fileInput.files[0]);
      }

      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="flex w-full bg-transparent">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-2xl w-full flex flex-col md:flex-row gap-10 p-5 max-h-[80vh] overflow-auto"
      >
        {/* Left: Inputs */}
        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6 overflow-auto">
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Name *</label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring-blue-400 focus:outline-none text-gray-700 transition"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring-blue-400 focus:outline-none text-gray-700 transition bg-white"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Material Type</label>
            <input
              name="materialType"
              type="text"
              value={form.materialType}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg w-full px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Size</label>
            <input
              name="size"
              type="text"
              value={form.size}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Color</label>
            <input
              name="color"
              type="text"
              value={form.color}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg w-full px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Price *</label>
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              required
              min={0}
              className="border border-gray-300 rounded-lg w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Weight</label>
            <input
              name="weight"
              type="number"
              value={form.weight}
              onChange={handleChange}
              min={0}
              className="border border-gray-300 rounded-lg w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Stock *</label>
            <input
              name="stockQuantity"
              type="number"
              value={form.stockQuantity}
              onChange={handleChange}
              required
              min={0}
              className="border border-gray-300 rounded-lg w-full px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Tags</label>
            <input
              name="tags"
              type="text"
              value={form.tags}
              onChange={handleChange}
              placeholder="graphic, oversized, cotton"
              className="border border-gray-300 rounded-lg w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Description *</label>
            <textarea
              name="description"
              rows={1}
              value={form.description}
              onChange={handleChange}
              required
              placeholder="Describe product features"
              className="border border-gray-300 rounded-lg w-full px-3 py-2 resize-none focus:ring-blue-400 focus:outline-none text-gray-700"
            />
          </div>
        </div>

        {/* Right: Image and buttons */}
        <div className="flex flex-col gap-6 min-w-[400px] justify-start">
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-semibold text-gray-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full cursor-pointer"
            />
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-40 object-cover rounded-lg border bg-gray-100 shadow"
              />
            ) : (
              <div className="w-full h-40 flex items-center justify-center rounded-lg border bg-gray-50 text-gray-400">
                No image selected
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition text-center ${submitting
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              {submitting ? (mode === "edit" ? "Updating..." : "Adding...") : (mode === "edit" ? "Update Product" : "Add Product")}
            </button>
            {mode === "edit" && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 bg-gray-50 border border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            )}
          </div>

        </div>
      </form>
    </div>
  );
};

export default ProductForm;
