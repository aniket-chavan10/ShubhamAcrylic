import { useState, useEffect, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { Folder, Plus, Edit2, Trash2, Save, X, Upload } from "lucide-react";
import { EmptyState, PageLoader, Toggle } from "../components/ui";
import * as categoryService from "../services/categoryService";
import { getImageUrl } from "../utils/imageUtils";

interface Category {
    id?: string | number;
    _id?: string;
    name: string;
    slug: string;
    description: string;
    imageUrl?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const CategoryManagement = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        imageUrl: "",
        isActive: true,
    });

    const [imagePreview, setImagePreview] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryService.getAllCategories();
            setCategories(data);
            setLoading(false);
        } catch (error: any) {
            alert("Failed to load categories: " + error.message);
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = new FormData();
            payload.append("name", formData.name);
            payload.append("slug", formData.slug);
            payload.append("description", formData.description);
            payload.append("isActive", String(formData.isActive));
            if (formData.imageUrl && !imageFile) payload.append("imageUrl", formData.imageUrl);
            if (imageFile) payload.append("image", imageFile);

            const catId = editingCategory ? (editingCategory.id || editingCategory._id) : null;

            if (catId) {
                await categoryService.updateCategory(String(catId), payload);
                alert("Category updated successfully!");
            } else {
                await categoryService.createCategory(payload);
                alert("Category created successfully!");
            }
            resetForm();
            loadCategories();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || "",
            imageUrl: category.imageUrl || "",
            isActive: category.isActive,
        });
        setImagePreview(category.imageUrl ? getImageUrl(category.imageUrl) : "");
        setImageFile(null);
        setIsEditing(true);
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm("Are you sure you want to delete this category? Associated products will be unlinked.")) return;

        try {
            await categoryService.deleteCategory(String(id));
            alert("Category deleted successfully!");
            loadCategories();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleToggleStatus = async (id: string | number) => {
        try {
            await categoryService.toggleCategoryStatus(String(id));
            loadCategories();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            description: "",
            imageUrl: "",
            isActive: true,
        });
        setImagePreview("");
        setImageFile(null);
        setEditingCategory(null);
        setIsEditing(false);
    };

    const handleNameChange = (name: string) => {
        setFormData({
            ...formData,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        });
    };

    const toggleForm = () => (isEditing ? resetForm() : setIsEditing(true));

    return (
        <AdminLayout
            title="Categories"
            actions={
                <button onClick={toggleForm} className={isEditing ? "a-btn-outline" : "a-btn-accent"}>
                    {isEditing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    <span className="hidden sm:inline">{isEditing ? "Cancel" : "Add category"}</span>
                </button>
            }
        >
            <div className="space-y-6">
                <p className="text-sm text-muted">Manage product categories, their cover images and whether they show on the website.</p>

                {isEditing && (
                    <div className="a-card p-5 sm:p-6">
                        <h3 className="mb-5 font-display text-lg font-bold">{editingCategory ? "Edit category" : "New category"}</h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="a-label">Category name *</label>
                                    <input type="text" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} required className="a-input" placeholder="e.g. Oversized T-Shirts" />
                                </div>
                                <div>
                                    <label className="a-label">Slug (auto-generated)</label>
                                    <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="a-input bg-paper" placeholder="oversized-t-shirts" />
                                </div>
                            </div>

                            <div>
                                <label className="a-label">Cover image</label>
                                <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper/50 p-4 sm:flex-row sm:items-center">
                                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white">
                                        {imagePreview ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" /> : <Folder className="h-6 w-6 text-muted" />}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="a-btn-outline px-3 py-2">
                                            <Upload className="h-4 w-4" /> Upload image
                                        </button>
                                        <input
                                            type="text"
                                            value={formData.imageUrl}
                                            onChange={(e) => { setFormData({ ...formData, imageUrl: e.target.value }); setImagePreview(e.target.value); }}
                                            className="a-input"
                                            placeholder="…or paste an image URL (https://…)"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="a-label">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="a-input" placeholder="Brief description of this category…" />
                            </div>

                            <label className="flex items-center gap-3 text-sm font-medium">
                                <Toggle checked={formData.isActive} onChange={(v) => setFormData({ ...formData, isActive: v })} label="Active" />
                                Active (visible to customers)
                            </label>

                            <div className="flex flex-wrap gap-2 pt-1">
                                <button type="submit" className="a-btn-primary"><Save className="h-4 w-4" /> {editingCategory ? "Update category" : "Create category"}</button>
                                <button type="button" onClick={resetForm} className="a-btn-outline">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div>
                    <h3 className="mb-3 font-display text-lg font-bold">All categories <span className="text-muted">({categories.length})</span></h3>
                    {loading ? (
                        <div className="a-card"><PageLoader className="h-48" /></div>
                    ) : categories.length === 0 ? (
                        <div className="a-card">
                            <EmptyState icon={Folder} title="No categories yet" text="Create your first category to get started.">
                                <button onClick={() => setIsEditing(true)} className="a-btn-primary"><Plus className="h-4 w-4" /> Add category</button>
                            </EmptyState>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {categories.map((category) => {
                                const catId = category.id || category._id;
                                return (
                                    <div key={catId} className="a-card flex gap-4 p-4">
                                        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-paper">
                                            {category.imageUrl
                                                ? <img src={getImageUrl(category.imageUrl)} alt={category.name} className="h-full w-full object-cover" />
                                                : <Folder className="h-5 w-5 text-muted" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold">{category.name}</p>
                                                    <p className="truncate font-mono text-xs text-muted">/{category.slug}</p>
                                                </div>
                                                <div className="-mr-2 -mt-1 flex">
                                                    <button onClick={() => handleEdit(category)} className="a-icon-btn" title="Edit category"><Edit2 className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDelete(catId!)} className="a-icon-btn-danger" title="Delete category"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                            {category.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{category.description}</p>}
                                            <label className="mt-2 flex items-center gap-2 text-xs font-medium text-muted">
                                                <Toggle checked={category.isActive} onChange={() => handleToggleStatus(catId!)} label="Active" />
                                                {category.isActive ? "Visible on website" : "Hidden"}
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default CategoryManagement;
