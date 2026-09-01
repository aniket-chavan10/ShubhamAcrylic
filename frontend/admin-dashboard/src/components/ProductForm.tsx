import { useState, useEffect, useRef } from "react";
import { getAllCategories } from "../services/categoryService";
import { X, ImagePlus, Shirt } from "lucide-react";

const SPORT_TYPES = ["Football", "Cricket", "Basketball", "Volleyball", "Hockey", "Kabaddi", "Athletics", "Generic"];
const FABRICS = ["Polyester", "Cotton", "Dri-FIT", "Mesh", "Cotton Blend", "Fleece", "Nylon"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const GENDERS = ["Men", "Women", "Unisex", "Kids"];
const FIT_TYPES = ["Regular", "Slim", "Loose", "Athletic"];

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  category: "",
  sportType: "",
  fabric: "",
  availableSizes: [] as string[],
  gender: "Unisex",
  fitType: "Regular",
  isCustomizable: false,
  color: "",
  stockQuantity: 0,
  tags: "",
};

interface ImagePreview {
  src: string;
  file?: File;
  existingId?: number;
  isMain: boolean;
}

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
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialValues) {
      let tagsString = "";
      if (Array.isArray(initialValues.tags)) {
        tagsString = initialValues.tags.join(", ");
      } else if (typeof initialValues.tags === "string") {
        try {
          const parsed = JSON.parse(initialValues.tags);
          tagsString = Array.isArray(parsed) ? parsed.join(", ") : initialValues.tags;
        } catch {
          tagsString = initialValues.tags;
        }
      }

      let sizesArray: string[] = [];
      if (Array.isArray(initialValues.availableSizes)) {
        sizesArray = initialValues.availableSizes;
      } else if (typeof initialValues.availableSizes === "string") {
        try { sizesArray = JSON.parse(initialValues.availableSizes); } catch { sizesArray = []; }
      }

      setForm({
        ...emptyForm,
        ...initialValues,
        tags: tagsString,
        availableSizes: sizesArray,
        category: typeof initialValues.category === "object"
          ? initialValues.category?.id
          : initialValues.category,
      });

      const existingPreviews: ImagePreview[] = (initialValues.images || []).map((img: any) => ({
        src: img.imageUrl.startsWith("/uploads")
          ? `http://localhost:5000${img.imageUrl}`
          : img.imageUrl,
        existingId: img.id,
        isMain: img.isMain,
      }));
      setPreviews(existingPreviews);
      setRemovedIds([]);
    } else {
      setForm(emptyForm);
      setPreviews([]);
      setRemovedIds([]);
    }
  }, [initialValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const toggleSize = (size: string) => {
    setForm((prev: any) => ({
      ...prev,
      availableSizes: prev.availableSizes.includes(size)
        ? prev.availableSizes.filter((s: string) => s !== size)
        : [...prev.availableSizes, size],
    }));
  };

  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalAfter = previews.length + files.length;
    if (totalAfter > 5) {
      alert("Maximum 5 images allowed per product.");
      return;
    }
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [
          ...prev,
          {
            src: reader.result as string,
            file,
            isMain: prev.length === 0 && idx === 0,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const img = previews[index];
    if (img.existingId) {
      setRemovedIds(prev => [...prev, img.existingId!]);
    }
    const updated = previews.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(p => p.isMain)) {
      updated[0].isMain = true;
    }
    setPreviews(updated);
  };

  const setMainImage = (index: number) => {
    setPreviews(prev => prev.map((p, i) => ({ ...p, isMain: i === index })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const tagsArray = form.tags
        ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price.toString());
      formData.append("category", form.category);
      formData.append("sportType", form.sportType || "");
      formData.append("fabric", form.fabric || "");
      formData.append("availableSizes", JSON.stringify(form.availableSizes || []));
      formData.append("gender", form.gender || "");
      formData.append("fitType", form.fitType || "");
      formData.append("isCustomizable", String(form.isCustomizable));
      formData.append("color", form.color || "");
      formData.append("stockQuantity", form.stockQuantity?.toString() || "0");
      formData.append("tags", JSON.stringify(tagsArray));

      previews.forEach(p => {
        if (p.file) formData.append("images", p.file);
      });

      if (removedIds.length > 0) {
        formData.append("removeImageIds", removedIds.join(","));
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
        className="bg-white rounded-3xl shadow-2xl w-full flex flex-col md:flex-row gap-10 p-6 max-h-[85vh] overflow-auto"
      >
        {/* ── Left: Text Fields ──────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-5 overflow-auto">

          {/* Product Code badge (edit mode) */}
          {mode === "edit" && initialValues?.productCode && (
            <div className="col-span-2">
              <label className="block mb-1 text-xs font-semibold text-gray-500">Product Code (Auto-generated)</label>
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-2 rounded-lg text-sm">
                🏷️ {initialValues.productCode}
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Product Name *</label>
            <input
              name="name" type="text" value={form.name} onChange={handleChange} required
              placeholder="e.g. India Cricket Jersey 2024"
              className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring-indigo-400 focus:outline-none text-gray-700 transition text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Category *</label>
            <select
              name="category" value={form.category} onChange={handleChange} required
              className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring-indigo-400 focus:outline-none text-gray-700 bg-white text-sm"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sport Type */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Sport Type</label>
            <select
              name="sportType" value={form.sportType} onChange={handleChange}
              className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring-indigo-400 focus:outline-none text-gray-700 bg-white text-sm"
            >
              <option value="">Select Sport</option>
              {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Fabric */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Fabric</label>
            <select
              name="fabric" value={form.fabric} onChange={handleChange}
              className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring-indigo-400 focus:outline-none text-gray-700 bg-white text-sm"
            >
              <option value="">Select Fabric</option>
              {FABRICS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Gender</label>
            <select
              name="gender" value={form.gender} onChange={handleChange}
              className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring-indigo-400 focus:outline-none text-gray-700 bg-white text-sm"
            >
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Fit Type */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Fit Type</label>
            <select
              name="fitType" value={form.fitType} onChange={handleChange}
              className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring-indigo-400 focus:outline-none text-gray-700 bg-white text-sm"
            >
              {FIT_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Price (₹) *</label>
            <input
              name="price" type="number" value={form.price} onChange={handleChange} required min={0}
              className="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Stock *</label>
            <input
              name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} required min={0}
              className="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Primary Color</label>
            <input
              name="color" type="text" value={form.color} onChange={handleChange}
              placeholder="e.g. Blue, Red & White"
              className="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm"
            />
          </div>

          {/* Customizable Toggle */}
          <div className="flex items-center gap-3 mt-1">
            <label className="text-xs font-semibold text-gray-700">Customizable?</label>
            <button
              type="button"
              onClick={() => setForm((p: any) => ({ ...p, isCustomizable: !p.isCustomizable }))}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                form.isCustomizable ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.isCustomizable ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs text-gray-500">{form.isCustomizable ? "Yes" : "No"}</span>
          </div>

          {/* Available Sizes */}
          <div className="col-span-2">
            <label className="block mb-2 text-xs font-semibold text-gray-700">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    form.availableSizes.includes(size)
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">Tags (comma-separated)</label>
            <input
              name="tags" type="text" value={form.tags} onChange={handleChange}
              placeholder="jersey, cricket, india, blue"
              className="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm"
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block mb-1 text-xs font-semibold text-gray-700">Description *</label>
            <textarea
              name="description" rows={3} value={form.description} onChange={handleChange} required
              placeholder="Describe the jersey — team, occasion, material features..."
              className="border border-gray-300 rounded-lg w-full px-3 py-2 resize-none focus:ring-indigo-400 focus:outline-none text-gray-700 text-sm"
            />
          </div>
        </div>

        {/* ── Right: Images + Buttons ──────────────────────────────────── */}
        <div className="flex flex-col gap-5 min-w-[300px] max-w-[360px]">
          {/* Image upload area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">
                Product Images ({previews.length}/5)
              </label>
              {previews.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition"
                >
                  <ImagePlus size={14} /> Add Image
                </button>
              )}
            </div>

            <input
              ref={fileInputRef} type="file" accept="image/*" multiple
              onChange={handleImageFiles} className="hidden"
            />

            {previews.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition"
              >
                <Shirt size={32} className="mb-2 opacity-50" />
                <span className="text-xs">Click to add jersey images (max 5)</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="relative h-48 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={previews.find(p => p.isMain)?.src || previews[0]?.src}
                    alt="Main"
                    className="w-full h-full object-contain p-3"
                  />
                  <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    MAIN
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {previews.map((p, i) => (
                    <div key={i} className="relative group">
                      <button
                        type="button"
                        onClick={() => setMainImage(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                          p.isMain ? 'border-indigo-600' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img src={p.src} alt={`img-${i}`} className="w-full h-full object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition"
                    >
                      <ImagePlus size={18} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">Click thumbnail to set as main image</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-auto">
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition text-center ${
                submitting ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {submitting
                ? (mode === "edit" ? "Updating..." : "Adding...")
                : (mode === "edit" ? "Update Product" : "Add Product")}
            </button>
            {onCancel && (
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
