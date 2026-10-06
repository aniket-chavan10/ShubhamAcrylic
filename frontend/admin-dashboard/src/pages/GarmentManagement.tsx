import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, CheckCircle2, Eye, EyeOff, ImageUp, Loader2, Plus, Save, Shirt, Trash2, X,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import {
  deleteGarment, fetchGarments, Garment, GarmentColor, GarmentSize, GarmentStyle, Placement, saveGarment,
} from "../services/garmentService";
import { MOCKUP_H, MOCKUP_W, renderMockup } from "../utils/mockups";
import { getImageUrl } from "../utils/imageUtils";
import { inr } from "../utils/format";

const STYLES: { value: GarmentStyle; label: string }[] = [
  { value: "hoodie", label: "Hoodie" },
  { value: "oversized-tee", label: "Oversized T-shirt" },
  { value: "polo", label: "Polo T-shirt" },
];

const PRESET_COLORS: GarmentColor[] = [
  { name: "Jet Black", hex: "#141414" }, { name: "Pure White", hex: "#fafafa" }, { name: "Off White", hex: "#f3f1ea" },
  { name: "Grey Melange", hex: "#a3a3a3" }, { name: "Charcoal", hex: "#3a3a3c" }, { name: "Navy", hex: "#1f2a44" },
  { name: "Royal Blue", hex: "#2747a3" }, { name: "Sky Blue", hex: "#8cb8e0" }, { name: "Red", hex: "#c62828" },
  { name: "Maroon", hex: "#6d1b2b" }, { name: "Bottle Green", hex: "#1e4d3a" }, { name: "Olive", hex: "#5b6236" },
  { name: "Beige", hex: "#d8c7a8" }, { name: "Mustard", hex: "#d4a72c" }, { name: "Lavender", hex: "#b9a7d6" },
  { name: "Baby Pink", hex: "#f2c4ce" },
];

type Draft = Omit<Garment, "id" | "basePrice"> & { id: number | null; basePrice: string };

const blankDraft = (): Draft => ({
  id: null,
  key: "",
  style: "oversized-tee",
  name: "",
  tagline: "",
  description: "",
  fabric: "",
  basePrice: "0",
  colors: [{ name: "Jet Black", hex: "#141414" }, { name: "Pure White", hex: "#fafafa" }],
  sizes: ["S", "M", "L", "XL", "XXL"].map(label => ({ label, extra: 0 })),
  placements: [
    { key: "chest", label: "Left Chest (over heart)", view: "front", price: 0, x: 0.56, y: 0.27, w: 0.14, h: 0.12, enabled: true },
    { key: "front", label: "Front / Stomach – Large", view: "front", price: 0, x: 0.33, y: 0.42, w: 0.34, h: 0.36, enabled: true },
    { key: "back", label: "Full Back", view: "back", price: 0, x: 0.3, y: 0.22, w: 0.4, h: 0.5, enabled: true },
  ],
  mockupFront: null,
  mockupBack: null,
  isActive: true,
  sortOrder: 0,
});

const toDraft = (g: Garment): Draft => ({ ...g, basePrice: String(Number(g.basePrice) || 0) });
const pct = (n: number) => Math.round(n * 1000) / 10;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// ── Mockup preview with draggable print areas ─────────────────────────────────
function ZonePreview({ draft, view, color, frontFile, backFile, onChange, selected, onSelect }: {
  draft: Draft;
  view: "front" | "back";
  color: string;
  frontFile: File | null;
  backFile: File | null;
  onChange: (index: number, patch: Partial<Placement>) => void;
  selected: number | null;
  onSelect: (index: number) => void;
}) {
  const [src, setSrc] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ index: number; mode: "move" | "resize"; startX: number; startY: number; orig: Placement } | null>(null);

  const localFile = view === "front" ? frontFile : backFile;
  const remote = view === "front" ? draft.mockupFront : draft.mockupBack;

  useEffect(() => {
    let alive = true;
    let objectUrl = "";
    if (localFile) objectUrl = URL.createObjectURL(localFile);
    const photo = objectUrl || remote || null;
    renderMockup({ style: draft.style, mockupFront: view === "front" ? photo : null, mockupBack: view === "back" ? photo : null }, view, color, getImageUrl)
      .then(c => { if (alive) setSrc(c.toDataURL("image/png")); })
      .catch(() => { if (alive) setSrc(""); });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [draft.style, view, color, localFile, remote]);

  const onPointerDown = (e: React.PointerEvent, index: number, mode: "move" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(index);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { index, mode, startX: e.clientX, startY: e.clientY, orig: draft.placements[index] };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = boxRef.current?.getBoundingClientRect();
    if (!d || !box) return;
    const dx = (e.clientX - d.startX) / box.width;
    const dy = (e.clientY - d.startY) / box.height;
    const o = d.orig;
    if (d.mode === "move") {
      onChange(d.index, { x: clamp01(Math.min(o.x + dx, 1 - o.w)), y: clamp01(Math.min(o.y + dy, 1 - o.h)) });
    } else {
      onChange(d.index, { w: Math.max(0.03, Math.min(o.w + dx, 1 - o.x)), h: Math.max(0.03, Math.min(o.h + dy, 1 - o.y)) });
    }
  };
  const onPointerUp = () => { drag.current = null; };

  return (
    <div ref={boxRef} className="relative w-full touch-none select-none overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_35%,#fff,#ece9e2)]"
      style={{ aspectRatio: `${MOCKUP_W} / ${MOCKUP_H}` }} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      {src ? <img src={src} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
        : <div className="absolute inset-0 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>}
      {draft.placements.map((p, i) => p.view === view && (
        <div
          key={i}
          onPointerDown={(e) => onPointerDown(e, i, "move")}
          className={`absolute cursor-move rounded-md border-2 border-dashed ${selected === i ? "border-accent bg-accent/15" : "border-accent/60 bg-accent/5"} ${p.enabled ? "" : "opacity-40"}`}
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${p.w * 100}%`, height: `${p.h * 100}%` }}
        >
          <span className="pointer-events-none absolute -top-5 left-0 whitespace-nowrap rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            {p.label || p.key} · {inr(p.price)}
          </span>
          <span onPointerDown={(e) => onPointerDown(e, i, "resize")}
            className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-white bg-accent shadow" />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const GarmentManagement = () => {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [removeFront, setRemoveFront] = useState(false);
  const [removeBack, setRemoveBack] = useState(false);
  const [previewColor, setPreviewColor] = useState("#141414");
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = async (selectId?: number) => {
    try {
      const list = await fetchGarments();
      setGarments(list);
      const pick = list.find(g => g.id === selectId) ?? list[0];
      if (pick && (selectId !== undefined || !draft)) openGarment(pick);
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openGarment = (g: Garment | null) => {
    const d = g ? toDraft(g) : blankDraft();
    setDraft(d);
    setFrontFile(null);
    setBackFile(null);
    setRemoveFront(false);
    setRemoveBack(false);
    setSelectedZone(null);
    setPreviewColor(d.colors[0]?.hex ?? "#141414");
    setMessage(null);
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(d => (d ? { ...d, [key]: value } : d));
  const setColor = (i: number, patch: Partial<GarmentColor>) =>
    setDraft(d => d && { ...d, colors: d.colors.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const setSize = (i: number, patch: Partial<GarmentSize>) =>
    setDraft(d => d && { ...d, sizes: d.sizes.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const setPlacement = (i: number, patch: Partial<Placement>) =>
    setDraft(d => d && { ...d, placements: d.placements.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  const example = useMemo(() => {
    if (!draft) return null;
    const base = Number(draft.basePrice) || 0;
    const front = draft.placements.find(p => p.enabled && p.view === "front" && p.w * p.h > 0.05) ?? draft.placements.find(p => p.enabled);
    return front ? { label: front.label, base, print: Number(front.price) || 0 } : null;
  }, [draft]);

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) { setMessage({ type: "error", text: "Please enter a name." }); return; }
    if (draft.colors.length === 0) { setMessage({ type: "error", text: "Add at least one colour." }); return; }
    if (draft.sizes.length === 0) { setMessage({ type: "error", text: "Add at least one size." }); return; }
    const keys = draft.placements.map(p => p.key.trim());
    if (keys.some(k => !k) || new Set(keys).size !== keys.length) {
      setMessage({ type: "error", text: "Each print placement needs a unique key." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("name", draft.name);
      form.append("key", draft.key || draft.name);
      form.append("style", draft.style);
      form.append("tagline", draft.tagline || "");
      form.append("description", draft.description || "");
      form.append("fabric", draft.fabric || "");
      form.append("basePrice", draft.basePrice);
      form.append("sortOrder", String(draft.sortOrder || 0));
      form.append("isActive", String(draft.isActive));
      form.append("colors", JSON.stringify(draft.colors));
      form.append("sizes", JSON.stringify(draft.sizes));
      form.append("placements", JSON.stringify(draft.placements));
      if (frontFile) form.append("mockupFront", frontFile);
      if (backFile) form.append("mockupBack", backFile);
      if (removeFront && !frontFile) form.append("removeMockupFront", "true");
      if (removeBack && !backFile) form.append("removeMockupBack", "true");
      const saved = await saveGarment(draft.id, form);
      await load(saved.id);
      setMessage({ type: "ok", text: "Saved. Customers will see the new prices immediately." });
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft?.id || !confirm(`Delete "${draft.name}"? Customers will no longer be able to design it.`)) return;
    try {
      await deleteGarment(draft.id);
      setDraft(null);
      await load();
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const shownFront = removeFront ? null : draft?.mockupFront;
  const shownBack = removeBack ? null : draft?.mockupBack;
  const previewDraft = draft ? { ...draft, mockupFront: shownFront, mockupBack: shownBack } : null;

  return (
    <AdminLayout title="Design Studio Pricing">
      <p className="-mt-2 mb-6 max-w-3xl text-sm text-muted">
        Set the garments customers can customise on the website: base price, available colours and sizes, and the price of each print placement.
        The customer sees <b>base price + selected prints + size extra</b> calculated automatically.
      </p>

      {loading ? (
        <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          {/* Garment list */}
          <div className="space-y-3">
            {garments.map(g => (
              <button key={g.id} onClick={() => openGarment(g)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${draft?.id === g.id ? "border-ink bg-white shadow-sm" : "border-line bg-white/60 hover:bg-white"}`}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-paper"><Shirt className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{g.name}</span>
                  <span className="block text-xs text-muted">{inr(g.basePrice)} · {g.colors.length} colours · {g.placements.filter(p => p.enabled).length} prints</span>
                </span>
                {!g.isActive && <EyeOff className="h-4 w-4 text-muted" />}
              </button>
            ))}
            <button onClick={() => openGarment(null)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-3 text-sm font-semibold text-muted hover:border-ink hover:text-ink">
              <Plus className="h-4 w-4" /> Add garment
            </button>
          </div>

          {draft && previewDraft && (
            <div className="space-y-6">
              {message && (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                  {message.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {message.text}
                </div>
              )}

              <div className="grid gap-6 2xl:grid-cols-[1fr_420px]">
                <div className="space-y-6">
                  {/* Basics */}
                  <section className="a-card p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold">{draft.id ? "Garment details" : "New garment"}</h2>
                      <button onClick={() => set("isActive", !draft.isActive)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${draft.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {draft.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {draft.isActive ? "Visible on website" : "Hidden"}
                      </button>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div><label className="a-label">Name</label><input className="a-input" value={draft.name} onChange={e => set("name", e.target.value)} placeholder="Classic Hoodie" /></div>
                      <div>
                        <label className="a-label">Base price (₹)</label>
                        <input className="a-input text-lg font-semibold" type="number" min={0} value={draft.basePrice} onChange={e => set("basePrice", e.target.value)} />
                      </div>
                      <div>
                        <label className="a-label">Mockup drawing</label>
                        <select className="a-input" value={draft.style} onChange={e => set("style", e.target.value as GarmentStyle)}>
                          {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div><label className="a-label">URL key</label><input className="a-input" value={draft.key} onChange={e => set("key", e.target.value)} placeholder="hoodie" /></div>
                      <div><label className="a-label">Tagline</label><input className="a-input" value={draft.tagline} onChange={e => set("tagline", e.target.value)} /></div>
                      <div><label className="a-label">Fabric</label><input className="a-input" value={draft.fabric} onChange={e => set("fabric", e.target.value)} placeholder="320 GSM Cotton Fleece" /></div>
                      <div className="sm:col-span-2"><label className="a-label">Description</label><textarea rows={2} className="a-input resize-none" value={draft.description} onChange={e => set("description", e.target.value)} /></div>
                      <div><label className="a-label">Display order</label><input className="a-input" type="number" value={draft.sortOrder} onChange={e => set("sortOrder", parseInt(e.target.value) || 0)} /></div>
                    </div>
                  </section>

                  {/* Colours */}
                  <section className="a-card p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold">Base colours</h2>
                    <p className="mt-1 text-sm text-muted">Customers can only pick from these colours.</p>
                    <div className="mt-4 space-y-2">
                      {draft.colors.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="color" value={c.hex} onChange={e => setColor(i, { hex: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-white p-1" />
                          <input className="a-input" value={c.name} onChange={e => setColor(i, { name: e.target.value })} placeholder="Colour name" />
                          <input className="a-input w-28 font-mono text-xs uppercase" value={c.hex} onChange={e => setColor(i, { hex: e.target.value })} />
                          <button onClick={() => set("colors", draft.colors.filter((_, j) => j !== i))} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Remove colour"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                    <p className="a-label mt-5">Quick add</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.filter(p => !draft.colors.some(c => c.hex.toLowerCase() === p.hex)).map(p => (
                        <button key={p.hex} onClick={() => set("colors", [...draft.colors, p])}
                          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-xs font-medium hover:border-ink">
                          <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: p.hex }} /> {p.name}
                        </button>
                      ))}
                      <button onClick={() => set("colors", [...draft.colors, { name: "New colour", hex: "#888888" }])}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-xs font-semibold text-muted hover:border-ink hover:text-ink">
                        <Plus className="h-3.5 w-3.5" /> Custom
                      </button>
                    </div>
                  </section>

                  {/* Sizes */}
                  <section className="a-card p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold">Sizes</h2>
                    <p className="mt-1 text-sm text-muted">Add an extra charge for bigger sizes if needed (e.g. XXL +₹50).</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {draft.sizes.map((s, i) => (
                        <div key={i} className="flex items-center gap-1 rounded-xl border border-line bg-white p-1.5">
                          <input className="w-14 rounded-lg bg-paper px-2 py-1.5 text-center text-sm font-semibold outline-none" value={s.label} onChange={e => setSize(i, { label: e.target.value })} />
                          <span className="pl-1 text-xs text-muted">+₹</span>
                          <input className="w-16 rounded-lg px-1 py-1.5 text-sm outline-none" type="number" min={0} value={s.extra} onChange={e => setSize(i, { extra: Number(e.target.value) || 0 })} />
                          <button onClick={() => set("sizes", draft.sizes.filter((_, j) => j !== i))} className="rounded-md p-1 text-muted hover:text-red-600" aria-label="Remove size"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                      <button onClick={() => set("sizes", [...draft.sizes, { label: "", extra: 0 }])} className="rounded-xl border border-dashed border-line px-4 text-sm font-semibold text-muted hover:border-ink hover:text-ink">
                        <Plus className="inline h-4 w-4" /> Size
                      </button>
                    </div>
                  </section>

                  {/* Placements */}
                  <section className="a-card p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-lg font-bold">Print placements & prices</h2>
                        <p className="mt-1 text-sm text-muted">Bigger areas usually cost more. Drag the boxes on the preview to position them.</p>
                      </div>
                      <button onClick={() => set("placements", [...draft.placements, { key: `print-${draft.placements.length + 1}`, label: "New print area", view: "front", price: 0, x: 0.4, y: 0.4, w: 0.2, h: 0.15, enabled: true }])}
                        className="a-btn-outline shrink-0"><Plus className="h-4 w-4" /> Add</button>
                    </div>
                    <div className="mt-5 space-y-3">
                      {draft.placements.map((p, i) => (
                        <div key={i} onClick={() => setSelectedZone(i)}
                          className={`rounded-xl border p-4 transition ${selectedZone === i ? "border-accent bg-accent-soft/30" : "border-line"}`}>
                          <div className="grid gap-3 sm:grid-cols-[1fr_120px_110px_auto] sm:items-end">
                            <div><label className="a-label">Label shown to customer</label><input className="a-input" value={p.label} onChange={e => setPlacement(i, { label: e.target.value })} /></div>
                            <div>
                              <label className="a-label">Side</label>
                              <select className="a-input" value={p.view} onChange={e => setPlacement(i, { view: e.target.value as "front" | "back" })}>
                                <option value="front">Front</option><option value="back">Back</option>
                              </select>
                            </div>
                            <div><label className="a-label">Price (₹)</label><input className="a-input font-semibold" type="number" min={0} value={p.price} onChange={e => setPlacement(i, { price: Number(e.target.value) || 0 })} /></div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setPlacement(i, { enabled: !p.enabled })} title={p.enabled ? "Disable" : "Enable"}
                                className={`rounded-lg p-2.5 ${p.enabled ? "text-emerald-600 hover:bg-emerald-50" : "text-muted hover:bg-paper"}`}>
                                {p.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                              <button onClick={() => set("placements", draft.placements.filter((_, j) => j !== i))} className="rounded-lg p-2.5 text-muted hover:bg-red-50 hover:text-red-600" title="Remove">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
                            <div><label className="a-label">Key</label><input className="a-input px-2 py-1.5 font-mono text-xs" value={p.key} onChange={e => setPlacement(i, { key: e.target.value })} /></div>
                            {(["x", "y", "w", "h"] as const).map(k => (
                              <div key={k}>
                                <label className="a-label">{{ x: "Left %", y: "Top %", w: "Width %", h: "Height %" }[k]}</label>
                                <input className="a-input px-2 py-1.5 text-xs" type="number" step={0.5} value={pct(p[k])} onChange={e => setPlacement(i, { [k]: clamp01((Number(e.target.value) || 0) / 100) } as Partial<Placement>)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {example && (
                      <p className="mt-5 rounded-xl bg-paper px-4 py-3 text-sm">
                        Example: <b>{draft.name || "Garment"}</b> {inr(example.base)} + <b>{example.label}</b> {inr(example.print)} = <b className="text-accent-dark">{inr(example.base + example.print)}</b> per piece
                      </p>
                    )}
                  </section>
                </div>

                {/* Preview & mockups */}
                <div className="space-y-6 2xl:sticky 2xl:top-24 2xl:self-start">
                  <section className="a-card p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold">Live preview</h2>
                      <div className="flex gap-1">
                        {draft.colors.slice(0, 8).map(c => (
                          <button key={c.hex + c.name} onClick={() => setPreviewColor(c.hex)} title={c.name}
                            className={`h-6 w-6 rounded-full ring-1 ring-black/10 ${previewColor === c.hex ? "ring-2 ring-ink ring-offset-1" : ""}`} style={{ backgroundColor: c.hex }} />
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {(["front", "back"] as const).map(v => (
                        <div key={v}>
                          <ZonePreview draft={previewDraft} view={v} color={previewColor} frontFile={frontFile} backFile={backFile}
                            onChange={setPlacement} selected={selectedZone} onSelect={setSelectedZone} />
                          <p className="mt-1.5 text-center text-xs font-semibold uppercase tracking-wider text-muted">{v}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="a-card p-5">
                    <h2 className="font-display text-lg font-bold">Photo mockups <span className="text-xs font-normal text-muted">(optional)</span></h2>
                    <p className="mt-1 text-sm text-muted">Upload a <b>white</b> garment photo on a <b>transparent PNG</b> background ({MOCKUP_W}×{MOCKUP_H}px works best). It will be tinted to every colour automatically. Leave empty to use the built-in drawing.</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {(["front", "back"] as const).map(v => {
                        const file = v === "front" ? frontFile : backFile;
                        const existing = v === "front" ? shownFront : shownBack;
                        return (
                          <div key={v} className="rounded-xl border border-dashed border-line p-3 text-center">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{v}</p>
                            <p className="mt-1 truncate text-xs">{file ? file.name : existing ? "Custom photo" : "Built-in drawing"}</p>
                            <label className="a-btn-outline mt-2 cursor-pointer px-3 py-1.5 text-xs">
                              <ImageUp className="h-3.5 w-3.5" /> Upload
                              <input type="file" accept="image/png,image/webp" className="hidden" onChange={e => {
                                const f = e.target.files?.[0] ?? null;
                                if (v === "front") { setFrontFile(f); setRemoveFront(false); } else { setBackFile(f); setRemoveBack(false); }
                                e.target.value = "";
                              }} />
                            </label>
                            {(file || existing) && (
                              <button className="mt-1 block w-full text-xs text-red-600 hover:underline" onClick={() => {
                                if (v === "front") { setFrontFile(null); setRemoveFront(true); } else { setBackFile(null); setRemoveBack(true); }
                              }}>Use built-in</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>

              {/* Save bar */}
              <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur">
                {draft.id ? (
                  <button onClick={remove} className="a-btn text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
                ) : <span />}
                <button onClick={save} disabled={saving} className="a-btn-accent px-6">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default GarmentManagement;
