import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { getSiteSettings, updateSiteSettings } from "../services/siteSettingsService";
import { getImageUrl } from "../utils/imageUtils";
import { AlertCircle, BookOpen, Building2, CheckCircle, Image, Loader2, LucideIcon, MapPin, Phone, Save, Share2, Sparkles, Upload } from "lucide-react";
import { PageLoader } from "../components/ui";
import { setBrand } from "../hooks/useBrand";

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
      setBrand({ companyName: updated.companyName || "", logoUrl: getImageUrl(updated.logoUrl) });
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

  type Key = keyof typeof settings;

  // Plain render helpers (not components) so inputs keep focus while typing
  const field = (name: Key, label: string, opts: { type?: string; placeholder?: string; hint?: string; required?: boolean; rows?: number; wide?: boolean } = {}) => (
    <div className={opts.wide ? "sm:col-span-2" : ""}>
      <label htmlFor={name} className="a-label">{label}</label>
      {opts.rows ? (
        <textarea id={name} name={name} rows={opts.rows} value={settings[name]} onChange={handleChange} placeholder={opts.placeholder} className="a-input resize-y" />
      ) : (
        <input id={name} name={name} type={opts.type || "text"} value={settings[name]} onChange={handleChange} placeholder={opts.placeholder} required={opts.required} className="a-input" />
      )}
      {opts.hint && <p className="mt-1 text-xs text-muted">{opts.hint}</p>}
    </div>
  );

  const section = (icon: LucideIcon, title: string, text: string, body: React.ReactNode) => {
    const Icon = icon;
    return (
      <section className="a-card p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper"><Icon className="h-[18px] w-[18px]" /></span>
          <div>
            <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
            <p className="text-sm text-muted">{text}</p>
          </div>
        </div>
        {body}
      </section>
    );
  };

  const showcase = (n: 1 | 2, preview: string, inputRef: React.RefObject<HTMLInputElement>, onFile: (e: React.ChangeEvent<HTMLInputElement>) => void, setPreview: (v: string) => void) => {
    const name = `aboutImage${n}` as Key;
    return (
      <div className="space-y-2">
        <p className="a-label">Showcase image {n}</p>
        <button type="button" onClick={() => inputRef.current?.click()}
          className="group relative block h-40 w-full overflow-hidden rounded-2xl border border-line bg-paper">
          {preview ? <img src={preview} alt={`Showcase ${n}`} className="h-full w-full object-cover" /> : <span className="text-sm text-muted">No image</span>}
          <span className="a-badge absolute bottom-2 right-2 bg-white/90 text-ink shadow"><Upload className="h-3 w-3" /> Change</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <input name={name} type="text" value={settings[name]} onChange={(e) => { handleChange(e); setPreview(e.target.value); }} className="a-input" placeholder="…or paste an image URL" />
      </div>
    );
  };

  if (loading) {
    return <AdminLayout title="Site Settings"><PageLoader /></AdminLayout>;
  }

  return (
    <AdminLayout title="Site Settings">
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-5 pb-24">
        <p className="text-sm text-muted">Brand, contact details, home page story and social links used across the website and invoices.</p>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {section(Building2, "Brand", "Your logo appears in the admin, on the website and on printed invoices.", (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-paper">
              {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1.5" /> : <span className="text-xs text-muted">No logo</span>}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                <button type="button" onClick={() => logoInputRef.current?.click()} className="a-btn-outline"><Upload className="h-4 w-4" /> Upload logo</button>
                <p className="mt-1.5 text-xs text-muted">PNG, JPG or WebP. A square image of at least 200×200 px works best.</p>
              </div>
              {field("companyName", "Company name *", { required: true, placeholder: "e.g. Astitva Creations" })}
            </div>
          </div>
        ))}

        {section(BookOpen, "Brand story", "The story section, its two images and four feature cards on the home page.", (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {showcase(1, aboutImage1Preview, aboutImage1InputRef, handleAboutImage1Change, setAboutImage1Preview)}
              {showcase(2, aboutImage2Preview, aboutImage2InputRef, handleAboutImage2Change, setAboutImage2Preview)}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field("aboutSubtitle", "Section subtitle", { placeholder: "OUR BRAND STORY" })}
              {field("aboutTitle", "Headline", { placeholder: "Crafting Premium Custom Apparel…" })}
              {field("aboutDescription", "Story", { rows: 3, wide: true, placeholder: "At Astitva Creations, we…" })}
            </div>
            <div>
              <p className="a-label flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Feature cards</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([1, 2, 3, 4] as const).map(n => (
                  <div key={n} className="space-y-2 rounded-xl border border-line bg-paper/50 p-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Feature {n}</span>
                    <input name={`feature${n}Title`} type="text" value={settings[`feature${n}Title` as Key]} onChange={handleChange} className="a-input font-semibold" placeholder="Title" aria-label={`Feature ${n} title`} />
                    <input name={`feature${n}Desc`} type="text" value={settings[`feature${n}Desc` as Key]} onChange={handleChange} className="a-input" placeholder="Short description" aria-label={`Feature ${n} description`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {section(Phone, "Contact details", "Shown on the website, in WhatsApp links and on invoices.", (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("whatsappNumber", "WhatsApp number", { placeholder: "919876543210", hint: "With country code, no + or spaces." })}
            {field("phone", "Phone number", { placeholder: "+91 98765 43210" })}
            {field("email", "Email address", { type: "email", placeholder: "info@yourcompany.com" })}
            {field("address", "Store address", { placeholder: "Street, City, State – PIN" })}
          </div>
        ))}

        {section(Share2, "Social media", "Links shown in the website footer. Leave blank to hide.", (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("instagramUrl", "Instagram", { type: "url", placeholder: "https://instagram.com/yourpage" })}
            {field("facebookUrl", "Facebook", { type: "url", placeholder: "https://facebook.com/yourpage" })}
            {field("twitterUrl", "X / Twitter", { type: "url", placeholder: "https://x.com/yourpage" })}
            {field("youtubeUrl", "YouTube", { type: "url", placeholder: "https://youtube.com/@yourchannel" })}
          </div>
        ))}

        {section(MapPin, "Google Maps", "Map shown on the contact page.", (
          field("googleMapsEmbed", "Embed URL", { rows: 2, placeholder: "https://www.google.com/maps/embed?pb=…", hint: "Google Maps → Share → Embed a map → copy only the src URL." })
        ))}

        {/* Save bar stays in reach on long pages and on phones */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 pt-3 pb-safe backdrop-blur lg:left-[272px]">
          <div className="flex max-w-4xl items-center justify-between gap-3 sm:px-4">
            <p className="flex min-w-0 items-center gap-1.5 truncate text-sm">
              {saved ? <><CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" /> <span className="text-emerald-700">Settings saved</span></>
                : <><Image className="h-4 w-4 shrink-0 text-muted" /> <span className="text-muted">Changes go live as soon as you save.</span></>}
            </p>
            <button type="submit" disabled={saving} className="a-btn-primary shrink-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default SiteSettings;
