import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { getSiteSettings, updateSiteSettings } from "../services/siteSettingsService";
import { getImageUrl } from "../utils/imageUtils";
import { Save, Building2, MessageCircle, Mail, Phone, MapPin, ImagePlus, CheckCircle, AlertCircle, Share2, BookOpen, Sparkles, Image } from "lucide-react";

const SiteSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    companyName: "",
    whatsappNumber: "",
    email: "",
    phone: "",
    address: "",
    googleMapsEmbed: "",
    logoUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    twitterUrl: "",
    youtubeUrl: "",
    // Brand Story & Highlights
    aboutSubtitle: "",
    aboutTitle: "",
    aboutDescription: "",
    aboutImage1: "",
    aboutImage2: "",
    feature1Title: "",
    feature1Desc: "",
    feature2Title: "",
    feature2Desc: "",
    feature3Title: "",
    feature3Desc: "",
    feature4Title: "",
    feature4Desc: "",
  });
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [aboutImage1Preview, setAboutImage1Preview] = useState<string>("");
  const [aboutImage1File, setAboutImage1File] = useState<File | null>(null);

  const [aboutImage2Preview, setAboutImage2Preview] = useState<string>("");
  const [aboutImage2File, setAboutImage2File] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const aboutImage1InputRef = useRef<HTMLInputElement>(null);
  const aboutImage2InputRef = useRef<HTMLInputElement>(null);

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
        instagramUrl: data.instagramUrl || "",
        facebookUrl: data.facebookUrl || "",
        twitterUrl: data.twitterUrl || "",
        youtubeUrl: data.youtubeUrl || "",

        aboutSubtitle: data.aboutSubtitle || "OUR BRAND STORY",
        aboutTitle: data.aboutTitle || "Crafting Premium Custom Apparel & T-Shirt Designs",
        aboutDescription: data.aboutDescription || "At Astitva Creations, we transform organic cotton and premium fabrics into high-impact oversized t-shirts, custom graphic tees, hoodies, and corporate merchandise. Engineered with state-of-the-art screen printing, DTG precision, and bio-wash softness.",
        aboutImage1: data.aboutImage1 || "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop",
        aboutImage2: data.aboutImage2 || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop",
        feature1Title: data.feature1Title || "Heavyweight Cotton",
        feature1Desc: data.feature1Desc || "180 to 350 GSM pre-shrunk combed cotton for maximum durability.",
        feature2Title: data.feature2Title || "Precision DTG & Screen Printing",
        feature2Desc: data.feature2Desc || "Vibrant, crack-resistant eco-friendly prints with high detail.",
        feature3Title: data.feature3Title || "Bio-Washed & Pre-Shrunk",
        feature3Desc: data.feature3Desc || "Ultra-soft fabric feel with zero color fading or shrinkage.",
        feature4Title: data.feature4Title || "Custom Apparel & Bulk Orders",
        feature4Desc: data.feature4Desc || "Bespoke oversized fits, custom embroidery, and corporate branding.",
      });

      setLogoPreview(getImageUrl(data.logoUrl));
      setAboutImage1Preview(getImageUrl(data.aboutImage1 || "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop"));
      setAboutImage2Preview(getImageUrl(data.aboutImage2 || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop"));
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

  const handleAboutImage1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAboutImage1File(file);
    const reader = new FileReader();
    reader.onloadend = () => setAboutImage1Preview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAboutImage2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAboutImage2File(file);
    const reader = new FileReader();
    reader.onloadend = () => setAboutImage2Preview(reader.result as string);
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
        if (key !== "logoUrl" && key !== "aboutImage1" && key !== "aboutImage2") {
          formData.append(key, val);
        }
      });
      if (logoFile) formData.append("logo", logoFile);
      if (aboutImage1File) formData.append("aboutImage1", aboutImage1File);
      if (aboutImage2File) formData.append("aboutImage2", aboutImage2File);

      // If user pasted image URLs directly
      if (settings.aboutImage1 && !aboutImage1File) formData.append("aboutImage1", settings.aboutImage1);
      if (settings.aboutImage2 && !aboutImage2File) formData.append("aboutImage2", settings.aboutImage2);

      const updated = await updateSiteSettings(formData);
      setSettings({
        companyName: updated.companyName || "",
        whatsappNumber: updated.whatsappNumber || "",
        email: updated.email || "",
        phone: updated.phone || "",
        address: updated.address || "",
        googleMapsEmbed: updated.googleMapsEmbed || "",
        logoUrl: updated.logoUrl || "",
        instagramUrl: updated.instagramUrl || "",
        facebookUrl: updated.facebookUrl || "",
        twitterUrl: updated.twitterUrl || "",
        youtubeUrl: updated.youtubeUrl || "",

        aboutSubtitle: updated.aboutSubtitle || "",
        aboutTitle: updated.aboutTitle || "",
        aboutDescription: updated.aboutDescription || "",
        aboutImage1: updated.aboutImage1 || "",
        aboutImage2: updated.aboutImage2 || "",
        feature1Title: updated.feature1Title || "",
        feature1Desc: updated.feature1Desc || "",
        feature2Title: updated.feature2Title || "",
        feature2Desc: updated.feature2Desc || "",
        feature3Title: updated.feature3Title || "",
        feature3Desc: updated.feature3Desc || "",
        feature4Title: updated.feature4Title || "",
        feature4Desc: updated.feature4Desc || "",
      });

      setLogoPreview(getImageUrl(updated.logoUrl));
      setAboutImage1Preview(getImageUrl(updated.aboutImage1));
      setAboutImage2Preview(getImageUrl(updated.aboutImage2));

      setLogoFile(null);
      setAboutImage1File(null);
      setAboutImage2File(null);

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
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="inline-block w-1 h-8 rounded-full bg-indigo-600" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Site Settings</h2>
            <p className="text-gray-500 text-sm mt-0.5">Manage brand story, company info, logo, images, and social links</p>
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
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
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
                  placeholder="e.g. Astitva Creations"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* OUR BRAND STORY & HIGHLIGHTS */}
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" /> Our Brand Story & Images
            </h3>
            <p className="text-xs text-gray-500">Edit the Brand Story section, text content, and 2 showcase images displayed on your homepage.</p>

            {/* Brand Story Images Upload */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Image size={16} className="text-indigo-600" /> Brand Story Showcase Images (Upload or Paste URL)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Image 1 */}
                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Showcase Image 1</span>
                  <div className="w-full h-36 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                    {aboutImage1Preview ? (
                      <img src={aboutImage1Preview} alt="Showcase 1" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                  </div>
                  <div>
                    <input ref={aboutImage1InputRef} type="file" accept="image/*" onChange={handleAboutImage1Change} className="hidden" />
                    <button
                      type="button"
                      onClick={() => aboutImage1InputRef.current?.click()}
                      className="w-full py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-lg text-xs hover:bg-indigo-100 transition"
                    >
                      Upload Image 1 File
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Or paste Image 1 URL:</label>
                    <input
                      name="aboutImage1"
                      type="text"
                      value={settings.aboutImage1}
                      onChange={(e) => {
                        handleChange(e);
                        setAboutImage1Preview(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1 text-xs outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Image 2 */}
                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Showcase Image 2</span>
                  <div className="w-full h-36 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                    {aboutImage2Preview ? (
                      <img src={aboutImage2Preview} alt="Showcase 2" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                  </div>
                  <div>
                    <input ref={aboutImage2InputRef} type="file" accept="image/*" onChange={handleAboutImage2Change} className="hidden" />
                    <button
                      type="button"
                      onClick={() => aboutImage2InputRef.current?.click()}
                      className="w-full py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-lg text-xs hover:bg-indigo-100 transition"
                    >
                      Upload Image 2 File
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Or paste Image 2 URL:</label>
                    <input
                      name="aboutImage2"
                      type="text"
                      value={settings.aboutImage2}
                      onChange={(e) => {
                        handleChange(e);
                        setAboutImage2Preview(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1 text-xs outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Section Subtitle</label>
                <input
                  name="aboutSubtitle"
                  type="text"
                  value={settings.aboutSubtitle}
                  onChange={handleChange}
                  className="w-full border border-gray-300 bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="OUR BRAND STORY"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Main Headline / Title</label>
                <input
                  name="aboutTitle"
                  type="text"
                  value={settings.aboutTitle}
                  onChange={handleChange}
                  className="w-full border border-gray-300 bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Crafting Premium Custom Apparel & T-Shirt Designs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Brand Story Description</label>
              <textarea
                name="aboutDescription"
                value={settings.aboutDescription}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="At Astitva Creations, we transform organic cotton..."
              />
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" /> 4 Feature Cards
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Feature 1</span>
                  <input
                    name="feature1Title"
                    type="text"
                    value={settings.feature1Title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold outline-none"
                    placeholder="Feature 1 Title"
                  />
                  <input
                    name="feature1Desc"
                    type="text"
                    value={settings.feature1Desc}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none"
                    placeholder="Feature 1 Description"
                  />
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Feature 2</span>
                  <input
                    name="feature2Title"
                    type="text"
                    value={settings.feature2Title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold outline-none"
                    placeholder="Feature 2 Title"
                  />
                  <input
                    name="feature2Desc"
                    type="text"
                    value={settings.feature2Desc}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none"
                    placeholder="Feature 2 Description"
                  />
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Feature 3</span>
                  <input
                    name="feature3Title"
                    type="text"
                    value={settings.feature3Title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold outline-none"
                    placeholder="Feature 3 Title"
                  />
                  <input
                    name="feature3Desc"
                    type="text"
                    value={settings.feature3Desc}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none"
                    placeholder="Feature 3 Description"
                  />
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Feature 4</span>
                  <input
                    name="feature4Title"
                    type="text"
                    value={settings.feature4Title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold outline-none"
                    placeholder="Feature 4 Title"
                  />
                  <input
                    name="feature4Desc"
                    type="text"
                    value={settings.feature4Desc}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none"
                    placeholder="Feature 4 Description"
                  />
                </div>
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

          {/* Social Media Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Share2 size={18} className="text-indigo-600" /> Social Media Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Instagram URL</label>
                <input
                  name="instagramUrl"
                  type="url"
                  value={settings.instagramUrl}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="https://instagram.com/yourpage"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Facebook URL</label>
                <input
                  name="facebookUrl"
                  type="url"
                  value={settings.facebookUrl}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Twitter URL</label>
                <input
                  name="twitterUrl"
                  type="url"
                  value={settings.twitterUrl}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="https://twitter.com/yourpage"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube URL</label>
                <input
                  name="youtubeUrl"
                  type="url"
                  value={settings.youtubeUrl}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="https://youtube.com/@yourchannel"
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
