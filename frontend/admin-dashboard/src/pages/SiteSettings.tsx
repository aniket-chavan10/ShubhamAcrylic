import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { getSiteSettings, updateSiteSettings } from "../services/siteSettingsService";
import { getImageUrl } from "../utils/imageUtils";
import { Save, Building2, MessageCircle, Mail, Phone, MapPin, ImagePlus, CheckCircle, AlertCircle } from "lucide-react";

const SiteSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    companyName: "",
    whatsappNumber: "",
    email: "",
    phone: "",
    address: "",
    googleMapsEmbed: "",
    logoUrl: "",
  });
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSiteSettings();
      setSettings({
        companyName: data.companyName || "",
        whatsappNumber: data.whatsappNumber || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        googleMapsEmbed: data.googleMapsEmbed || "",
        logoUrl: data.logoUrl || "",
      });
      setLogoPreview(getImageUrl(data.logoUrl));
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const formData = new FormData();
      Object.entries(settings).forEach(([key, val]) => {
        if (key !== "logoUrl") formData.append(key, val);
      });
      if (logoFile) formData.append("logo", logoFile);

      const updated = await updateSiteSettings(formData);
      setSettings({
        companyName: updated.companyName || "",
        whatsappNumber: updated.whatsappNumber || "",
        email: updated.email || "",
        phone: updated.phone || "",
        address: updated.address || "",
        googleMapsEmbed: updated.googleMapsEmbed || "",
        logoUrl: updated.logoUrl || "",
      });
      setLogoPreview(getImageUrl(updated.logoUrl));
      setLogoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="inline-block w-1 h-8 rounded-full bg-indigo-600" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Site Settings</h2>
            <p className="text-gray-500 text-sm mt-0.5">Company info, WhatsApp number, logo and contact details</p>
          </div>
        </div>

        {saved && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-semibold text-sm">
            <CheckCircle size={18} /> Settings saved successfully!
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 space-y-8">

          {/* Company Logo */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ImagePlus size={18} className="text-indigo-600" /> Company Logo
            </h3>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-xs text-gray-400 text-center px-2">No logo</span>
                )}
              </div>
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-lg text-sm hover:bg-indigo-100 transition"
                >
                  Upload Logo
                </button>
                <p className="text-xs text-gray-400 mt-2">PNG, JPG or WebP. Recommended: 200×200px</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Company Information
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name *</label>
                <input
                  name="companyName"
                  type="text"
                  value={settings.companyName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  placeholder="e.g. Shubham Tees"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Phone size={18} className="text-indigo-600" /> Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <MessageCircle size={13} className="text-emerald-600" /> WhatsApp Number
                </label>
                <input
                  name="whatsappNumber"
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="91XXXXXXXXXX (with country code, no +)"
                />
                <p className="text-xs text-gray-400 mt-1">Example: 919876543210 (for +91 9876543210)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Phone size={13} className="text-indigo-600" /> Phone Number
                </label>
                <input
                  name="phone"
                  type="text"
                  value={settings.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Mail size={13} className="text-indigo-600" /> Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={settings.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="info@yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin size={13} className="text-indigo-600" /> Store Address
                </label>
                <input
                  name="address"
                  type="text"
                  value={settings.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Street, City, State - PIN"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Google Maps */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-600" /> Google Maps Embed
            </h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Google Maps Embed URL</label>
              <textarea
                name="googleMapsEmbed"
                value={settings.googleMapsEmbed}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Google Maps → Share → Embed a map → Copy the src URL only
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SiteSettings;
