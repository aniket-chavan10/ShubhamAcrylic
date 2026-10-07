import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import * as bannerService from "../services/bannerService";
import { getImageUrl } from "../utils/imageUtils";
import { ImageIcon, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { EmptyState, Modal, PageLoader, Toggle } from "../components/ui";

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
                await bannerService.updateBanner(editingBanner.id || editingBanner._id, formData);
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
            formData.append("title", banner.title || "");
            formData.append("subtitle", banner.subtitle || "");
            formData.append("link", banner.link || "");
            formData.append("order", banner.order.toString());
            formData.append("isActive", (!banner.isActive).toString());

            await bannerService.updateBanner(banner.id || banner._id, formData);
            loadBanners();
        } catch (err: any) {
            alert("Failed to toggle banner status: " + err.message);
        }
    };

    return (
        <AdminLayout
            title="Banners"
            actions={<button onClick={handleAddNew} className="a-btn-accent"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add banner</span></button>}
        >
            <p className="mb-5 text-sm text-muted">Slides shown in the home page carousel, in order. Inactive banners are hidden from the website.</p>

            {isFormOpen && (
                <Modal
                    title={editingBanner ? "Edit banner" : "New banner"}
                    onClose={() => setIsFormOpen(false)}
                    size="lg"
                    footer={<>
                        <button type="button" onClick={() => setIsFormOpen(false)} className="a-btn-outline">Cancel</button>
                        <button type="submit" form="banner-form" className="a-btn-primary">{editingBanner ? "Update banner" : "Create banner"}</button>
                    </>}
                >
                    <form id="banner-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="a-label">Banner image *</label>
                            <label className="group relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-paper/50 transition hover:border-ink">
                                {preview
                                    ? <img src={getImageUrl(preview)} alt="Preview" className="h-full w-full object-cover" />
                                    : <span className="flex flex-col items-center text-sm text-muted"><Upload className="mb-2 h-6 w-6" /> Click to choose an image</span>}
                                {preview && <span className="a-badge absolute bottom-2 right-2 bg-white/90 text-ink shadow">Change image</span>}
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="a-label">Title</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="a-input" />
                            </div>
                            <div>
                                <label className="a-label">Subtitle</label>
                                <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="a-input" />
                            </div>
                            <div>
                                <label className="a-label">Link (optional)</label>
                                <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/products" className="a-input" />
                            </div>
                            <div>
                                <label className="a-label">Order</label>
                                <input type="number" inputMode="numeric" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className="a-input" />
                            </div>
                        </div>
                        <label className="flex items-center gap-3 text-sm font-medium">
                            <Toggle checked={isActive} onChange={setIsActive} label="Active" /> Active (show on the website)
                        </label>
                    </form>
                </Modal>
            )}

            {loading ? (
                <div className="a-card"><PageLoader /></div>
            ) : error ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : banners.length === 0 ? (
                <div className="a-card">
                    <EmptyState icon={ImageIcon} title="No banners yet" text="Add a banner to show it in the home page carousel.">
                        <button onClick={handleAddNew} className="a-btn-primary"><Plus className="h-4 w-4" /> Add banner</button>
                    </EmptyState>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {banners.map((banner) => (
                        <div key={banner.id || banner._id} className="a-card overflow-hidden">
                            <div className="relative aspect-[16/9] bg-paper">
                                <img src={getImageUrl(banner.imageUrl)} alt={banner.title} className={`h-full w-full object-cover ${banner.isActive ? "" : "opacity-40 grayscale"}`} />
                                <span className="a-badge absolute left-2 top-2 bg-white/90 text-ink shadow">#{banner.order}</span>
                                {!banner.isActive && <span className="a-badge absolute right-2 top-2 bg-ink text-white">Hidden</span>}
                            </div>
                            <div className="flex items-start gap-3 p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold">{banner.title || "Untitled"}</p>
                                    <p className="truncate text-sm text-muted">{banner.subtitle || "No subtitle"}</p>
                                    <label className="mt-2 flex items-center gap-2 text-xs font-medium text-muted">
                                        <Toggle checked={banner.isActive} onChange={() => handleToggleActive(banner)} label="Active" />
                                        {banner.isActive ? "Showing" : "Hidden"}
                                    </label>
                                </div>
                                <div className="-mr-2 flex">
                                    <button onClick={() => handleEdit(banner)} className="a-icon-btn" title="Edit"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => handleDelete(banner.id || banner._id)} className="a-icon-btn-danger" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
};

export default ManageBanners;
