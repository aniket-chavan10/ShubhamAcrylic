import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import * as bannerService from "../services/bannerService";

const ManageBanners = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingBanner, setEditingBanner] = useState<any>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [link, setLink] = useState("");
    const [order, setOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState("");

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        try {
            setLoading(true);
            const data = await bannerService.fetchBanners();
            setBanners(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (banner: any) => {
        setEditingBanner(banner);
        setTitle(banner.title || "");
        setSubtitle(banner.subtitle || "");
        setLink(banner.link || "");
        setOrder(banner.order || 0);
        setIsActive(banner.isActive);
        setPreview(banner.imageUrl || "");
        setImageFile(null);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingBanner(null);
        setTitle("");
        setSubtitle("");
        setLink("");
        setOrder(0);
        setIsActive(true);
        setPreview("");
        setImageFile(null);
        setIsFormOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("subtitle", subtitle);
            formData.append("link", link);
            formData.append("order", order.toString());
            formData.append("isActive", isActive.toString());
            if (imageFile) {
                formData.append("image", imageFile);
            }

            if (editingBanner) {
                await bannerService.updateBanner(editingBanner._id, formData);
            } else {
                await bannerService.addBanner(formData);
            }

            setIsFormOpen(false);
            loadBanners();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this banner?")) {
            try {
                await bannerService.deleteBanner(id);
                loadBanners();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const handleToggleActive = async (banner: any) => {
        try {
            const formData = new FormData();
            formData.append("title", banner.title);
            formData.append("subtitle", banner.subtitle);
            formData.append("link", banner.link || "");
            formData.append("order", banner.order.toString());
            formData.append("isActive", (!banner.isActive).toString());

            await bannerService.updateBanner(banner._id, formData);
            loadBanners();
        } catch (err: any) {
            alert("Failed to toggle banner status: " + err.message);
        }
    };

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <span className="inline-block w-1 h-8 rounded-full bg-blue-600"></span>
                    <h2 className="text-3xl font-bold text-blue-900 tracking-tight">Manage Banners</h2>
                </div>
                <button
                    onClick={handleAddNew}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    Add New Banner
                </button>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingBanner ? "Edit Banner" : "Add New Banner"}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                                    <input
                                        type="text"
                                        value={subtitle}
                                        onChange={(e) => setSubtitle(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
                                    <input
                                        type="text"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        placeholder="/products"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={order}
                                        onChange={(e) => setOrder(parseInt(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {preview && (
                                    <div className="mt-4">
                                        <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                                >
                                    {editingBanner ? "Update Banner" : "Create Banner"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                {loading ? (
                    <p className="p-8 text-center text-gray-500">Loading banners...</p>
                ) : error ? (
                    <p className="p-8 text-center text-red-500">{error}</p>
                ) : banners.length === 0 ? (
                    <p className="p-8 text-center text-gray-500">No banners found. Add one to get started!</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {banners.map((banner) => (
                            <div key={banner._id} className="bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
                                <div className="relative h-48">
                                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(banner)}
                                            className="p-2 bg-white rounded-full shadow-md text-blue-600 hover:text-blue-800"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner._id)}
                                            className="p-2 bg-white rounded-full shadow-md text-red-600 hover:text-red-800"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                    {!banner.isActive && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Inactive</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 truncate">{banner.title || "No Title"}</h3>
                                    <p className="text-sm text-gray-500 truncate">{banner.subtitle || "No Subtitle"}</p>
                                    <div className="mt-3 flex justify-between items-center text-xs">
                                        <span className="text-gray-400">Order: {banner.order}</span>
                                        <button
                                            onClick={() => handleToggleActive(banner)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${banner.isActive
                                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {banner.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ManageBanners;
