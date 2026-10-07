import { FC, useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Modal, PageLoader, Toggle } from "../ui";
import type { Garment } from "../../services/garmentService";
import {
  addMovement, bulkCreateMaterials, CATEGORIES, fetchMovements, materialLabel, MOVEMENT_LABELS, MovementType,
  RawMaterial, recordPurchase, saveMaterial, StockMovement,
} from "../../services/inventoryService";
import { formatDate, inr } from "../../utils/format";

const today = () => new Date().toISOString().slice(0, 10);
const qtyText = (n: number | string, unit: string) => `${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${unit}`;
const ErrorNote = ({ text }: { text: string }) => (text ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{text}</p> : null);

// ── Add / edit material ──────────────────────────────────────────────────────
interface MaterialForm {
  name: string; category: string; unit: string; color: string; colorHex: string; size: string; sku: string;
  reorderLevel: string; reorderQty: string; costPrice: string; supplier: string; notes: string;
  garmentId: string; isActive: boolean; openingStock: string;
}

const blankForm = (): MaterialForm => ({
  name: "", category: "garment", unit: "pcs", color: "", colorHex: "", size: "", sku: "",
  reorderLevel: "10", reorderQty: "", costPrice: "", supplier: "", notes: "", garmentId: "", isActive: true, openingStock: "",
});

export const MaterialModal: FC<{
  material: RawMaterial | null;
  garments: Garment[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onDelete?: (m: RawMaterial) => void;
}> = ({ material, garments, onClose, onSaved, onDelete }) => {
  const editing = !!material;
  const [form, setForm] = useState<MaterialForm>(() => material ? {
    ...blankForm(),
    ...Object.fromEntries(Object.entries(material).map(([k, v]) => [k, v === null || v === undefined ? "" : typeof v === "boolean" ? v : String(v)])),
    garmentId: material.garmentId ? String(material.garmentId) : "",
    reorderQty: Number(material.reorderQty) ? String(Number(material.reorderQty)) : "",
    costPrice: Number(material.costPrice) ? String(Number(material.costPrice)) : "",
    reorderLevel: String(Number(material.reorderLevel)),
  } as MaterialForm : blankForm());
  // Variant mode: one row per selected colour × size
  const [variants, setVariants] = useState(!editing);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [extraColor, setExtraColor] = useState("");
  const [extraSizes, setExtraSizes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof MaterialForm>(k: K, v: MaterialForm[K]) => setForm(f => ({ ...f, [k]: v }));
  const garment = garments.find(g => String(g.id) === form.garmentId);

  // Picking a garment fills in a sensible name and offers its colours & sizes
  const pickGarment = (id: string) => {
    const g = garments.find(x => String(x.id) === id);
    setForm(f => ({ ...f, garmentId: id, category: g ? "garment" : f.category, name: g && !f.name ? `Plain ${g.name}` : f.name }));
    if (g && variants) {
      setColors(g.colors.map(c => ({ name: c.name, hex: c.hex })));
      setSizes(g.sizes.map(s => s.label));
    }
  };

  const colorOptions = useMemo(() => {
    const list = garment ? garment.colors.map(c => ({ name: c.name, hex: c.hex })) : [];
    colors.forEach(c => { if (!list.some(x => x.name === c.name)) list.push(c); });
    return list;
  }, [garment, colors]);
  const sizeOptions = useMemo(() => {
    const list = garment ? garment.sizes.map(s => s.label) : ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
    sizes.forEach(s => { if (!list.includes(s)) list.push(s); });
    return list;
  }, [garment, sizes]);

  const toggle = <T,>(list: T[], item: T, eq: (a: T, b: T) => boolean) =>
    list.some(x => eq(x, item)) ? list.filter(x => !eq(x, item)) : [...list, item];

  const combos = variants
    ? (colors.length ? colors : [{ name: "", hex: "" }]).flatMap(c => (sizes.length ? sizes : [""]).map(s => ({ color: c.name, colorHex: c.hex, size: s })))
    : [];

  const shared = () => ({
    name: form.name, category: form.category, unit: form.unit, sku: form.sku,
    reorderLevel: form.reorderLevel, reorderQty: form.reorderQty, costPrice: form.costPrice,
    supplier: form.supplier, notes: form.notes, garmentId: form.garmentId || null,
  });

  const save = async () => {
    setError("");
    if (!form.name.trim()) { setError("Enter a material name."); return; }
    setSaving(true);
    try {
      if (variants) {
        if (combos.length > 300) throw new Error("That is more than 300 variants — select fewer colours or sizes.");
        const res = await bulkCreateMaterials(combos.map(c => ({ ...shared(), ...c, openingStock: form.openingStock })));
        onSaved(`${res.created.length} material${res.created.length === 1 ? "" : "s"} added${res.skipped ? ` · ${res.skipped} already existed` : ""}`);
      } else {
        await saveMaterial(material?.id ?? null, {
          ...shared(), color: form.color, colorHex: form.colorHex, size: form.size,
          ...(editing ? { isActive: form.isActive } : { openingStock: form.openingStock }),
        });
        onSaved(editing ? "Material updated" : "Material added");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const input = (k: keyof MaterialForm, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="a-label" htmlFor={`mat-${k}`}>{label}</label>
      <input id={`mat-${k}`} className="a-input" value={form[k] as string} onChange={e => set(k, e.target.value as never)} {...props} />
    </div>
  );

  return (
    <Modal
      title={editing ? "Edit material" : "Add raw material"}
      onClose={onClose}
      size="lg"
      footer={<>
        {material && onDelete && <button onClick={() => onDelete(material)} className="a-btn-ghost mr-auto text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /> Delete</button>}
        <button onClick={onClose} className="a-btn-outline">Cancel</button>
        <button onClick={save} disabled={saving || (variants && combos.length === 0)} className="a-btn-primary">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : variants ? `Add ${combos.length} item${combos.length === 1 ? "" : "s"}` : "Add material"}
        </button>
      </>}
    >
      <div className="space-y-5">
        <ErrorNote text={error} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="a-label" htmlFor="mat-garment">Design studio garment (optional)</label>
            <select id="mat-garment" className="a-select" value={form.garmentId} onChange={e => pickGarment(e.target.value)}>
              <option value="">Not linked</option>
              {garments.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-muted">Linked materials are deducted automatically when a website order for that colour & size goes into production.</p>
          </div>
          {input("name", "Material name *", { placeholder: "e.g. Plain Hoodie 320 GSM" })}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="a-label" htmlFor="mat-category">Type</label>
              <select id="mat-category" className="a-select" value={form.category} onChange={e => set("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {input("unit", "Unit", { placeholder: "pcs, kg, ml…", list: "mat-units" })}
            <datalist id="mat-units">{["pcs", "kg", "g", "litre", "ml", "metre", "roll", "box"].map(u => <option key={u} value={u} />)}</datalist>
          </div>
        </div>

        {!editing && (
          <label className="flex items-center gap-3 text-sm font-medium">
            <Toggle checked={variants} onChange={setVariants} label="Several colours and sizes" />
            Add several colours / sizes at once
          </label>
        )}

        {variants ? (
          <div className="space-y-4 rounded-2xl border border-line bg-paper/50 p-4">
            <div>
              <p className="a-label">Colours</p>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(c => {
                  const on = colors.some(x => x.name === c.name);
                  return (
                    <button key={c.name} type="button" onClick={() => setColors(list => toggle(list, c, (a, b) => a.name === b.name))}
                      className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-semibold transition ${on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}>
                      <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex || "#fff" }} /> {c.name}
                    </button>
                  );
                })}
                <form className="flex gap-1" onSubmit={e => { e.preventDefault(); const n = extraColor.trim(); if (n) { setColors(l => [...l, { name: n, hex: "" }]); setExtraColor(""); } }}>
                  <input className="a-input w-32 py-1.5 text-xs" placeholder="Other colour" value={extraColor} onChange={e => setExtraColor(e.target.value)} aria-label="Add colour" />
                  <button className="a-icon-btn h-8 w-8" aria-label="Add colour"><Plus className="h-4 w-4" /></button>
                </form>
              </div>
              <p className="mt-1 text-xs text-muted">Leave empty for a material without colours (e.g. ink, packaging).</p>
            </div>
            <div>
              <p className="a-label">Sizes</p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map(s => (
                  <button key={s} type="button" onClick={() => setSizes(list => toggle(list, s, (a, b) => a === b))}
                    className={`min-w-11 rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${sizes.includes(s) ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}>
                    {s}
                  </button>
                ))}
                <form className="flex gap-1" onSubmit={e => { e.preventDefault(); const add = extraSizes.split(",").map(x => x.trim()).filter(Boolean); if (add.length) { setSizes(l => [...l, ...add.filter(a => !l.includes(a))]); setExtraSizes(""); } }}>
                  <input className="a-input w-28 py-1.5 text-xs" placeholder="Other size" value={extraSizes} onChange={e => setExtraSizes(e.target.value)} aria-label="Add size" />
                  <button className="a-icon-btn h-8 w-8" aria-label="Add size"><Plus className="h-4 w-4" /></button>
                </form>
              </div>
            </div>
            <p className="text-sm font-medium">{combos.length} item{combos.length === 1 ? "" : "s"} will be created{combos.length > 1 ? " (one per colour × size)" : ""}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="a-label" htmlFor="mat-color">Colour</label>
              <div className="flex gap-2">
                <input type="color" aria-label="Colour swatch" value={form.colorHex || "#ffffff"} onChange={e => set("colorHex", e.target.value)} className="h-[42px] w-11 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1" />
                <input id="mat-color" className="a-input" list="mat-colors" value={form.color} onChange={e => {
                  const v = e.target.value;
                  const match = garment?.colors.find(c => c.name === v);
                  setForm(f => ({ ...f, color: v, colorHex: match ? match.hex : f.colorHex }));
                }} placeholder="Jet Black" />
                <datalist id="mat-colors">{garment?.colors.map(c => <option key={c.name} value={c.name} />)}</datalist>
              </div>
            </div>
            {input("size", "Size", { placeholder: "L", list: "mat-sizes" })}
            <datalist id="mat-sizes">{sizeOptions.map(s => <option key={s} value={s} />)}</datalist>
            {input("sku", "SKU / code", { placeholder: "Optional" })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {input("reorderLevel", "Alert at or below", { type: "number", min: 0, inputMode: "decimal" })}
          {input("reorderQty", "Usual buy qty", { type: "number", min: 0, inputMode: "decimal", placeholder: "Auto" })}
          {input("costPrice", "Cost / unit (₹)", { type: "number", min: 0, inputMode: "decimal" })}
          {!editing && input("openingStock", variants ? "Opening stock each" : "Opening stock", { type: "number", min: 0, inputMode: "decimal", placeholder: "0" })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {input("supplier", "Supplier", { placeholder: "Who you usually buy from" })}
          {input("notes", "Notes", { placeholder: "GSM, fabric, rack no.…" })}
        </div>

        {editing && (
          <label className="flex items-center gap-3 text-sm font-medium">
            <Toggle checked={form.isActive} onChange={v => set("isActive", v)} label="Active" />
            Active (inactive items are hidden from alerts)
          </label>
        )}
        {editing && <p className="text-xs text-muted">To change the stock quantity, use Add stock, Use or Stock count — so every change is in the history.</p>}
      </div>
    </Modal>
  );
};

// ── Single stock entry ───────────────────────────────────────────────────────
type EntryType = Exclude<MovementType, "order">;

export const MovementModal: FC<{
  material: RawMaterial;
  initialType: EntryType;
  onClose: () => void;
  onSaved: (message: string) => void;
}> = ({ material, initialType, onClose, onSaved }) => {
  const [type, setType] = useState<EntryType>(initialType);
  const current = Number(material.quantity) || 0;
  const [quantity, setQuantity] = useState(initialType === "adjustment" ? String(current) : "");
  const [unitCost, setUnitCost] = useState(Number(material.costPrice) ? String(Number(material.costPrice)) : "");
  const [supplier, setSupplier] = useState(material.supplier || "");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const qty = Number(quantity) || 0;
  const after = type === "purchase" ? current + qty : type === "usage" ? current - qty : qty;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await addMovement(material.id, { type, quantity: qty, unitCost: type === "purchase" ? unitCost : undefined, supplier, reference, note, date });
      onSaved(`${MOVEMENT_LABELS[type]} saved · ${materialLabel(material)} now ${qtyText(after, material.unit)}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const types: { value: EntryType; label: string }[] = [
    { value: "purchase", label: "Add stock" }, { value: "usage", label: "Use" }, { value: "adjustment", label: "Stock count" },
  ];

  return (
    <Modal
      title={materialLabel(material)}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="a-btn-outline">Cancel</button>
        <button onClick={save} disabled={saving || (type !== "adjustment" && qty <= 0)} className={type === "usage" ? "a-btn-primary" : "a-btn-accent"}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
      </>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 rounded-xl border border-line bg-paper p-1">
          {types.map(t => (
            <button key={t.value} onClick={() => { setType(t.value); setQuantity(t.value === "adjustment" ? String(current) : ""); }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${type === t.value ? "bg-white shadow-sm" : "text-muted hover:text-ink"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <ErrorNote text={error} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="a-label" htmlFor="mv-qty">{type === "adjustment" ? `Counted stock (${material.unit})` : `Quantity (${material.unit})`}</label>
            <input id="mv-qty" autoFocus className="a-input text-lg font-semibold" type="number" min={0} inputMode="decimal" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="a-label" htmlFor="mv-date">Date</label>
            <input id="mv-date" className="a-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {type === "purchase" && (
            <>
              <div>
                <label className="a-label" htmlFor="mv-cost">Cost / unit (₹)</label>
                <input id="mv-cost" className="a-input" type="number" min={0} inputMode="decimal" value={unitCost} onChange={e => setUnitCost(e.target.value)} />
              </div>
              <div>
                <label className="a-label" htmlFor="mv-ref">Bill no.</label>
                <input id="mv-ref" className="a-input" value={reference} onChange={e => setReference(e.target.value)} placeholder="Optional" />
              </div>
              <div className="col-span-2">
                <label className="a-label" htmlFor="mv-sup">Supplier</label>
                <input id="mv-sup" className="a-input" value={supplier} onChange={e => setSupplier(e.target.value)} />
              </div>
            </>
          )}
          <div className="col-span-2">
            <label className="a-label" htmlFor="mv-note">Note</label>
            <input id="mv-note" className="a-input" value={note} onChange={e => setNote(e.target.value)}
              placeholder={type === "usage" ? "e.g. Walk-in order for Rahul" : type === "adjustment" ? "e.g. Monthly count, 2 damaged" : "Optional"} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-paper px-4 py-3 text-sm">
          <span className="text-muted">Stock now <b className="text-ink">{qtyText(current, material.unit)}</b></span>
          <span className="text-muted">After <b className={after < 0 ? "text-red-600" : "text-ink"}>{qtyText(after, material.unit)}</b></span>
        </div>
        {type === "purchase" && qty > 0 && Number(unitCost) > 0 && <p className="text-right text-sm text-muted">Purchase value <b className="text-ink">{inr(qty * Number(unitCost), true)}</b></p>}
      </div>
    </Modal>
  );
};

// ── Multi-line purchase (one supplier bill) ──────────────────────────────────
interface Line { materialId: string; quantity: string; unitCost: string }

export const PurchaseModal: FC<{
  materials: RawMaterial[];
  prefill?: RawMaterial[];
  onClose: () => void;
  onSaved: (message: string) => void;
}> = ({ materials, prefill = [], onClose, onSaved }) => {
  const byId = useMemo(() => new Map(materials.map(m => [String(m.id), m])), [materials]);
  const lineFor = (m?: RawMaterial): Line => ({
    materialId: m ? String(m.id) : "",
    quantity: m && m.suggestedBuy ? String(m.suggestedBuy) : "",
    unitCost: m && Number(m.costPrice) ? String(Number(m.costPrice)) : "",
  });
  const [lines, setLines] = useState<Line[]>(() => (prefill.length ? prefill.map(lineFor) : [lineFor()]));
  const [date, setDate] = useState(today());
  const [supplier, setSupplier] = useState(() => prefill.find(m => m.supplier)?.supplier || "");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const groups = useMemo(() => {
    const map = new Map<string, RawMaterial[]>();
    materials.filter(m => m.isActive).forEach(m => map.set(m.name, [...(map.get(m.name) || []), m]));
    return [...map.entries()];
  }, [materials]);

  const setLine = (i: number, patch: Partial<Line>) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const pick = (i: number, id: string) => {
    const m = byId.get(id);
    setLine(i, { materialId: id, unitCost: lines[i].unitCost || (m && Number(m.costPrice) ? String(Number(m.costPrice)) : "") });
  };
  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);
  const valid = lines.filter(l => l.materialId && Number(l.quantity) > 0);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await recordPurchase({
        date, supplier, reference, note,
        items: valid.map(l => ({ materialId: Number(l.materialId), quantity: Number(l.quantity), unitCost: l.unitCost === "" ? "" : Number(l.unitCost) })),
      });
      onSaved(`Purchase saved · ${res.count} item${res.count === 1 ? "" : "s"}${res.total ? ` · ${inr(res.total, true)}` : ""}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Record purchase"
      onClose={onClose}
      size="xl"
      footer={<>
        <span className="mr-auto self-center text-sm text-muted">Total <b className="text-lg text-ink">{inr(total, true)}</b></span>
        <button onClick={onClose} className="a-btn-outline">Cancel</button>
        <button onClick={save} disabled={saving || valid.length === 0} className="a-btn-accent">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />} Save purchase
        </button>
      </>}
    >
      <div className="space-y-5">
        <ErrorNote text={error} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2">
            <label className="a-label" htmlFor="pu-sup">Supplier</label>
            <input id="pu-sup" className="a-input" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Tirupur Knits" />
          </div>
          <div>
            <label className="a-label" htmlFor="pu-ref">Bill no.</label>
            <input id="pu-ref" className="a-input" value={reference} onChange={e => setReference(e.target.value)} />
          </div>
          <div>
            <label className="a-label" htmlFor="pu-date">Date</label>
            <input id="pu-date" className="a-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="mb-1 hidden grid-cols-[1fr_96px_110px_100px_36px] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted sm:grid">
            <span>Material</span><span>Qty</span><span>Cost / unit ₹</span><span className="text-right">Amount</span><span />
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => {
              const m = byId.get(l.materialId);
              return (
                <div key={i} className="grid grid-cols-6 gap-2 rounded-xl bg-paper/60 p-3 sm:grid-cols-[1fr_96px_110px_100px_36px] sm:items-center sm:bg-transparent sm:p-0">
                  <select className="a-select col-span-6 sm:col-span-1" value={l.materialId} onChange={e => pick(i, e.target.value)} aria-label="Material">
                    <option value="">Choose material…</option>
                    {groups.map(([name, items]) => (
                      <optgroup key={name} label={name}>
                        {items.map(it => <option key={it.id} value={it.id}>{[it.color, it.size].filter(Boolean).join(" · ") || it.name} ({Number(it.quantity)} {it.unit})</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <input className="a-input col-span-2 sm:col-span-1" type="number" min={0} inputMode="decimal" placeholder={`Qty${m ? ` (${m.unit})` : ""}`} value={l.quantity} onChange={e => setLine(i, { quantity: e.target.value })} aria-label="Quantity" />
                  <input className="a-input col-span-2 sm:col-span-1" type="number" min={0} inputMode="decimal" placeholder="Cost ₹" value={l.unitCost} onChange={e => setLine(i, { unitCost: e.target.value })} aria-label="Cost per unit" />
                  <p className="col-span-1 self-center text-right text-sm font-semibold sm:col-span-1">{inr((Number(l.quantity) || 0) * (Number(l.unitCost) || 0))}</p>
                  <button onClick={() => setLines(ls => (ls.length > 1 ? ls.filter((_, j) => j !== i) : [lineFor()]))} className="a-icon-btn-danger col-span-1 justify-self-end" aria-label="Remove line">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={() => setLines(ls => [...ls, lineFor()])} className="a-btn-outline mt-3"><Plus className="h-4 w-4" /> Add line</button>
        </div>

        <div>
          <label className="a-label" htmlFor="pu-note">Note</label>
          <input id="pu-note" className="a-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional" />
        </div>
      </div>
    </Modal>
  );
};

// ── History ──────────────────────────────────────────────────────────────────
export const MovementList: FC<{ movements: StockMovement[]; showMaterial?: boolean }> = ({ movements, showMaterial = false }) => {
  if (!movements.length) return <p className="py-10 text-center text-sm text-muted">No stock entries yet.</p>;
  return (
    <ul className="divide-y divide-line">
      {movements.map(mv => {
        const change = Number(mv.change);
        const unit = mv.material?.unit || "";
        return (
          <li key={mv.id} className="flex items-start gap-3 py-3">
            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {change >= 0 ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">
                  {MOVEMENT_LABELS[mv.type]}
                  {showMaterial && mv.material && <span className="font-normal text-muted"> · {materialLabel(mv.material)}</span>}
                </p>
                <p className={`shrink-0 text-sm font-bold ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>{change >= 0 ? "+" : "−"}{qtyText(Math.abs(change), unit)}</p>
              </div>
              <p className="text-xs text-muted">
                {[formatDate(mv.date), mv.supplier, mv.reference && `Ref ${mv.reference}`, mv.unitCost ? `${inr(mv.unitCost, true)}/unit` : ""].filter(Boolean).join(" · ")}
              </p>
              {mv.note && <p className="mt-0.5 text-xs">{mv.note}</p>}
            </div>
            <p className="shrink-0 pt-0.5 text-xs text-muted">bal. {Number(mv.balanceAfter)}</p>
          </li>
        );
      })}
    </ul>
  );
};

export const HistoryModal: FC<{ material: RawMaterial; onClose: () => void }> = ({ material, onClose }) => {
  const [movements, setMovements] = useState<StockMovement[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchMovements(material.id, 200).then(setMovements).catch(err => setError(err.message));
  }, [material.id]);
  return (
    <Modal title={`History · ${materialLabel(material)}`} onClose={onClose} size="lg">
      <ErrorNote text={error} />
      {movements ? <MovementList movements={movements.map(m => ({ ...m, material: m.material ?? material }))} /> : !error && <PageLoader className="h-40" />}
    </Modal>
  );
};
