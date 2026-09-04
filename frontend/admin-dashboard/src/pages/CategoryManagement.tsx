import { useState, useEffect, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { Folder, Plus, Edit2, Trash2, CheckCircle, XCircle, Save, X, Image as ImageIcon } from "lucide-react";
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

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Category Management</h2>
                        <p className="text-gray-600 mt-1">Manage categories, images, and homepage layout</p>
                    </div>
                    <button
                        onClick={() => {
                            if (isEditing) resetForm();
                            else setIsEditing(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                    >
                        {isEditing ? (
                            <>
                                <X className="w-4 h-4" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Add Category
                            </>
                        )}
                    </button>
                </div>

                {/* Add/Edit Form */}
                {isEditing && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {editingCategory ? "Edit Category" : "Add New Category"}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="e.g., Oversized T-Shirts"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Slug (auto-generated)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm"
                                        placeholder="oversized-t-shirts"
                                    />
                                </div>
                            </div>

                            {/* Category Image Upload */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                                <label className="block text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                    <ImageIcon size={16} className="text-blue-600" /> Category Cover Image (Upload or Paste URL)
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-lg border border-gray-300 bg-white overflow-hidden flex items-center justify-center shrink-0">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] text-gray-400">No Image</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-semibold rounded-lg text-xs hover:bg-blue-100 transition"
                                        >
                                            Upload Image File
                                        </button>
                                        <input
                                            type="text"
                                            value={formData.imageUrl}
                                            onChange={(e) => {
                                                setFormData({ ...formData, imageUrl: e.target.value });
                                                setImagePreview(e.target.value);
                                            }}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none bg-white"
                                            placeholder="Or paste image URL (e.g. https://...)"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Brief description of this category..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Active (visible to customers)
                                </label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    {editingCategory ? "Update Category" : "Create Category"}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Categories List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900">
                            All Categories ({categories.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cover Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Slug
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                            <p>No categories yet. Create your first category to get started!</p>
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category) => {
                                        const catId = (category as any).id || category._id;
                                        return (
                                            <tr key={catId} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                                                        {category.imageUrl ? (
                                                            <img src={getImageUrl(category.imageUrl)} alt={category.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Folder className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900">{category.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                        {category.slug}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {category.description || "-"}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleToggleStatus(catId!)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        {category.isActive ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                                <XCircle className="w-3 h-3" />
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(category)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Edit category"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(catId!)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete category"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CategoryManagement;
