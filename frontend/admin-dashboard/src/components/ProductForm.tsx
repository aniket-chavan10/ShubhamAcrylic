import { useState, useEffect, useRef } from "react";
import { getAllCategories } from "../services/categoryService";
import { X, ImagePlus, Loader2, Shirt, Tag } from "lucide-react";
import { Toggle } from "./ui";
import { getImageUrl } from "../utils/imageUtils";

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
        src: getImageUrl(img.imageUrl),
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

  const Field = ({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) => (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="a-label">{label}</label>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 lg:flex-row">
      {/* ── Details ───────────────────────────────────────────────── */}
      <div className="grid flex-1 grid-cols-1 content-start gap-x-5 gap-y-4 sm:grid-cols-2">
        {mode === "edit" && initialValues?.productCode && (
          <div className="sm:col-span-2">
            <span className="a-badge bg-paper font-mono text-muted"><Tag className="h-3 w-3" /> {initialValues.productCode}</span>
          </div>
        )}

        {Field({ label: "Product name *", children: (
          <input name="name" type="text" value={form.name} onChange={handleChange} required placeholder="e.g. India Cricket Jersey 2024" className="a-input" />
        ) })}
        {Field({ label: "Category *", children: (
          <select name="category" value={form.category} onChange={handleChange} required className="a-select">
            <option value="">Select category</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        ) })}
        {Field({ label: "Sport type", children: (
          <select name="sportType" value={form.sportType} onChange={handleChange} className="a-select">
            <option value="">Select sport</option>
            {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) })}
        {Field({ label: "Fabric", children: (
          <select name="fabric" value={form.fabric} onChange={handleChange} className="a-select">
            <option value="">Select fabric</option>
            {FABRICS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        ) })}
        {Field({ label: "Gender", children: (
          <select name="gender" value={form.gender} onChange={handleChange} className="a-select">
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        ) })}
        {Field({ label: "Fit type", children: (
          <select name="fitType" value={form.fitType} onChange={handleChange} className="a-select">
            {FIT_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        ) })}
        {Field({ label: "Price (₹) *", children: (
          <input name="price" type="number" inputMode="decimal" value={form.price} onChange={handleChange} required min={0} className="a-input" />
        ) })}
        {Field({ label: "Stock *", children: (
          <input name="stockQuantity" type="number" inputMode="numeric" value={form.stockQuantity} onChange={handleChange} required min={0} className="a-input" />
        ) })}
        {Field({ label: "Primary colour", children: (
          <input name="color" type="text" value={form.color} onChange={handleChange} placeholder="e.g. Blue, Red & White" className="a-input" />
        ) })}
        {Field({ label: "Tags (comma-separated)", children: (
          <input name="tags" type="text" value={form.tags} onChange={handleChange} placeholder="jersey, cricket, india, blue" className="a-input" />
        ) })}

        <div className="sm:col-span-2">
          <label className="a-label">Available sizes</label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map(size => (
              <button key={size} type="button" onClick={() => toggleSize(size)}
                className={`min-w-12 rounded-xl border px-3 py-2 text-sm font-semibold transition ${form.availableSizes.includes(size) ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}>
                {size}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium sm:col-span-2">
          <Toggle checked={!!form.isCustomizable} onChange={(v) => setForm((p: any) => ({ ...p, isCustomizable: v }))} label="Customisable" />
          Customisable by the customer
        </label>

        {Field({ label: "Description *", wide: true, children: (
          <textarea name="description" rows={4} value={form.description} onChange={handleChange} required
            placeholder="Describe the product — team, occasion, material features…" className="a-input resize-y" />
        ) })}
      </div>

      {/* ── Images & actions ──────────────────────────────────────── */}
      <div className="flex w-full flex-col gap-5 lg:w-80 lg:shrink-0">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="a-label mb-0">Product images ({previews.length}/5)</label>
            {previews.length < 5 && previews.length > 0 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark hover:underline">
                <ImagePlus className="h-3.5 w-3.5" /> Add image
              </button>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageFiles} className="hidden" />

          {previews.length === 0 ? (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line text-muted transition hover:border-ink hover:text-ink">
              <Shirt className="mb-2 h-8 w-8" strokeWidth={1.5} />
              <span className="text-xs font-medium">Click to add product images (max 5)</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative h-56 overflow-hidden rounded-2xl border border-line bg-paper">
                <img src={previews.find(p => p.isMain)?.src || previews[0]?.src} alt="Main" className="h-full w-full object-contain p-3" />
                <span className="a-badge absolute left-2 top-2 bg-ink text-[10px] text-white">Main</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {previews.map((p, i) => (
                  <div key={i} className="group relative">
                    <button type="button" onClick={() => setMainImage(i)}
                      className={`h-14 w-14 overflow-hidden rounded-xl border-2 transition ${p.isMain ? "border-ink" : "border-line hover:border-muted"}`}>
                      <img src={p.src} alt={`img-${i}`} className="h-full w-full object-cover" />
                    </button>
                    <button type="button" onClick={() => removeImage(i)} aria-label="Remove image"
                      className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-white shadow transition lg:opacity-0 lg:group-hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {previews.length < 5 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Add image"
                    className="grid h-14 w-14 place-items-center rounded-xl border-2 border-dashed border-line text-muted transition hover:border-ink hover:text-ink">
                    <ImagePlus className="h-5 w-5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted">Tap a thumbnail to make it the main image.</p>
            </div>
          )}
        </div>

        <div className="mt-auto flex gap-2">
          <button type="submit" disabled={submitting} className="a-btn-primary flex-1">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? (mode === "edit" ? "Updating…" : "Adding…") : (mode === "edit" ? "Update product" : "Add product")}
          </button>
          {onCancel && <button type="button" onClick={onCancel} className="a-btn-outline">Cancel</button>}
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
