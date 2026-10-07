import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Boxes, CheckCircle2, History, MessageCircle, Minus, Package, Pencil, Plus, Search, ShoppingCart, Trash2,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { EmptyState, PageLoader } from "../components/ui";
import { HistoryModal, MaterialModal, MovementList, MovementModal, PurchaseModal } from "../components/inventory/InventoryModals";
import { fetchGarments, Garment } from "../services/garmentService";
import {
  buyListText, CATEGORIES, deleteMaterial, fetchMaterials, fetchMovements, InventorySummary, RawMaterial, StockMovement, StockStatus,
} from "../services/inventoryService";
import { useBrand } from "../hooks/useBrand";
import { inr } from "../utils/format";
import { refreshStockAlerts } from "../hooks/useStockAlerts";

type Dialog =
  | { kind: "material"; material: RawMaterial | null }
  | { kind: "movement"; material: RawMaterial; type: "purchase" | "usage" | "adjustment" }
  | { kind: "purchase"; prefill?: RawMaterial[] }
  | { kind: "history"; material: RawMaterial }
  | null;

const STATUS: Record<StockStatus, { label: string; tone: string; bar: string }> = {
  ok: { label: "In stock", tone: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  low: { label: "Low", tone: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
  out: { label: "Out", tone: "bg-red-50 text-red-700", bar: "bg-red-500" },
};

const fmt = (n: number | string) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const categoryLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label ?? v;

/** Stock level relative to the alert level (full bar = 3× the alert level) */
const StockBar = ({ m }: { m: RawMaterial }) => {
  const level = Number(m.reorderLevel) || 1;
  const pct = Math.max(4, Math.min(100, (Math.max(0, Number(m.quantity)) / (level * 3)) * 100));
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-paper-deep">
      <div className={`h-full rounded-full ${STATUS[m.status].bar}`} style={{ width: `${pct}%` }} />
      <span className="absolute top-0 h-full w-px bg-ink/40" style={{ left: "33.3%" }} title="Alert level" />
    </div>
  );
};

const Inventory = () => {
  const { companyName } = useBrand();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({ total: 0, low: 0, out: 0, value: 0 });
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"stock" | "history">("stock");
  const [history, setHistory] = useState<StockMovement[] | null>(null);
  const [filter, setFilter] = useState<"" | "reorder" | "out">("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await fetchMaterials();
      setMaterials(data.materials);
      setSummary(data.summary);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchGarments().then(setGarments).catch(() => undefined);
  }, [load]);

  useEffect(() => {
    if (tab === "history") fetchMovements(undefined, 200).then(setHistory).catch(err => setError(err.message));
  }, [tab]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const saved = (message: string) => {
    setDialog(null);
    setToast(message);
    load();
    refreshStockAlerts();
    if (tab === "history") fetchMovements(undefined, 200).then(setHistory).catch(() => undefined);
  };

  const remove = async (m: RawMaterial) => {
    if (!confirm(`Delete "${[m.name, m.color, m.size].filter(Boolean).join(" · ")}" and its stock history?`)) return;
    try {
      await deleteMaterial(m.id);
      saved("Material deleted");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const reorderItems = useMemo(() => materials.filter(m => m.isActive && m.status !== "ok"), [materials]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials.filter(m =>
      (!category || m.category === category) &&
      (!filter || (filter === "out" ? m.status === "out" : m.status !== "ok" && m.isActive)) &&
      (!q || [m.name, m.color, m.size, m.sku, m.supplier].some(v => String(v || "").toLowerCase().includes(q))));
  }, [materials, category, filter, query]);

  // Group variants of the same material (e.g. all hoodie colours & sizes)
  const groups = useMemo(() => {
    const map = new Map<string, RawMaterial[]>();
    visible.forEach(m => map.set(m.name, [...(map.get(m.name) || []), m]));
    return [...map.entries()];
  }, [visible]);

  const shareBuyList = () => {
    const text = buyListText(reorderItems, companyName);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const rowActions = (m: RawMaterial) => (
    <div className="flex shrink-0 items-center gap-0.5">
      <button onClick={() => setDialog({ kind: "movement", material: m, type: "purchase" })} className="a-icon-btn text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700" title="Add stock" aria-label="Add stock"><Plus className="h-4 w-4" /></button>
      <button onClick={() => setDialog({ kind: "movement", material: m, type: "usage" })} className="a-icon-btn" title="Use" aria-label="Use stock"><Minus className="h-4 w-4" /></button>
      <button onClick={() => setDialog({ kind: "history", material: m })} className="a-icon-btn hidden sm:inline-grid" title="History" aria-label="History"><History className="h-4 w-4" /></button>
      <button onClick={() => setDialog({ kind: "material", material: m })} className="a-icon-btn" title="Edit" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
    </div>
  );

  return (
    <AdminLayout
      title="Raw Materials"
      actions={<>
        <button onClick={() => setDialog({ kind: "material", material: null })} className="a-btn-outline hidden sm:inline-flex"><Plus className="h-4 w-4" /> Add material</button>
        <button onClick={() => setDialog({ kind: "purchase" })} className="a-btn-accent" disabled={!materials.length}><ShoppingCart className="h-4 w-4" /> <span className="hidden sm:inline">Record purchase</span></button>
      </>}
    >
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="a-card p-4 sm:p-5"><p className="a-label">Items tracked</p><p className="font-display text-2xl font-bold sm:text-3xl">{summary.total}</p></div>
          <button onClick={() => setFilter(f => (f === "reorder" ? "" : "reorder"))} className={`a-card p-4 text-left transition hover:border-ink sm:p-5 ${filter === "reorder" ? "border-ink" : ""}`}>
            <p className="a-label">Low stock</p><p className="font-display text-2xl font-bold text-amber-600 sm:text-3xl">{summary.low}</p>
          </button>
          <button onClick={() => setFilter(f => (f === "out" ? "" : "out"))} className={`a-card p-4 text-left transition hover:border-ink sm:p-5 ${filter === "out" ? "border-ink" : ""}`}>
            <p className="a-label">Out of stock</p><p className="font-display text-2xl font-bold text-red-600 sm:text-3xl">{summary.out}</p>
          </button>
          <div className="a-card p-4 sm:p-5"><p className="a-label">Stock value</p><p className="truncate font-display text-2xl font-bold sm:text-3xl">{inr(summary.value)}</p><p className="text-xs text-muted">at average cost</p></div>
        </div>

        {/* Need to buy */}
        {reorderItems.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span><b>{reorderItems.length} item{reorderItems.length === 1 ? "" : "s"} need buying.</b> {reorderItems.slice(0, 3).map(m => [m.name, m.color, m.size].filter(Boolean).join(" ")).join(", ")}{reorderItems.length > 3 ? "…" : ""}</span>
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button onClick={shareBuyList} className="a-btn bg-[#25D366] px-3 py-2 text-white hover:bg-[#1ebe5a]"><MessageCircle className="h-4 w-4" /> Send list</button>
              <button onClick={() => setDialog({ kind: "purchase", prefill: reorderItems })} className="a-btn-primary px-3 py-2"><ShoppingCart className="h-4 w-4" /> Buy these</button>
            </div>
          </div>
        )}

        {/* Tabs & filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            <button onClick={() => setTab("stock")} className={tab === "stock" ? "a-chip-active" : "a-chip"}>Stock</button>
            <button onClick={() => setTab("history")} className={tab === "history" ? "a-chip-active" : "a-chip"}>History</button>
            <button onClick={() => setDialog({ kind: "material", material: null })} className="a-chip ml-auto inline-flex items-center gap-1 sm:hidden"><Plus className="h-4 w-4" /> Add</button>
          </div>
          {tab === "stock" && (
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <label className="relative col-span-2 sm:w-64">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input className="a-input pl-10" placeholder="Search name, colour, supplier…" value={query} onChange={e => setQuery(e.target.value)} />
              </label>
              <select className="a-select sm:w-44" value={category} onChange={e => setCategory(e.target.value)} aria-label="Type">
                <option value="">All types</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select className="a-select sm:w-40" value={filter} onChange={e => setFilter(e.target.value as typeof filter)} aria-label="Stock">
                <option value="">All stock</option>
                <option value="reorder">Need to buy</option>
                <option value="out">Out of stock</option>
              </select>
            </div>
          )}
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {tab === "history" ? (
          <div className="a-card px-4 sm:px-5">
            {history ? <MovementList movements={history} showMaterial /> : <PageLoader className="h-40" />}
          </div>
        ) : loading ? (
          <div className="a-card"><PageLoader /></div>
        ) : materials.length === 0 ? (
          <div className="a-card">
            <EmptyState icon={Boxes} title="No raw materials yet" text="Add the plain garments, inks and packaging you buy. Pick a design studio garment to create every colour and size in one go.">
              <button onClick={() => setDialog({ kind: "material", material: null })} className="a-btn-primary"><Plus className="h-4 w-4" /> Add material</button>
            </EmptyState>
          </div>
        ) : groups.length === 0 ? (
          <div className="a-card"><EmptyState icon={CheckCircle2} title="Nothing here" text="No materials match these filters." /></div>
        ) : (
          <div className="space-y-4">
            {groups.map(([name, items]) => {
              const total = items.reduce((s, m) => s + Number(m.quantity), 0);
              const alerts = items.filter(m => m.status !== "ok").length;
              return (
                <section key={name} className="a-card overflow-hidden">
                  <header className="flex items-center justify-between gap-3 border-b border-line bg-paper/50 px-4 py-3 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-line"><Package className="h-[18px] w-[18px]" /></span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{name}</h3>
                        <p className="text-xs text-muted">{categoryLabel(items[0].category)} · {items.length} item{items.length === 1 ? "" : "s"} · {fmt(total)} {items[0].unit} total</p>
                      </div>
                    </div>
                    {alerts > 0 && <span className="a-badge bg-amber-50 text-amber-700">{alerts} to buy</span>}
                  </header>
                  <ul className="divide-y divide-line">
                    {items.map(m => (
                      <li key={m.id} className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${m.isActive ? "" : "opacity-50"}`}>
                        <span className="h-8 w-8 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: m.colorHex || "repeating-linear-gradient(45deg,#f5f3ee,#f5f3ee 4px,#ebe8e0 4px,#ebe8e0 8px)" }} />
                        <button onClick={() => setDialog({ kind: "history", material: m })} className="min-w-0 flex-1 text-left" title="Show history">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold">{[m.color, m.size].filter(Boolean).join(" · ") || m.name}</p>
                            {!m.isActive && <span className="a-badge bg-paper text-muted">Inactive</span>}
                          </div>
                          <div className="mt-1.5 flex items-center gap-3">
                            <div className="w-24 sm:w-40"><StockBar m={m} /></div>
                            <p className="hidden truncate text-xs text-muted sm:block">alert at {fmt(m.reorderLevel)}{Number(m.costPrice) ? ` · ${inr(m.costPrice)}/${m.unit}` : ""}{m.supplier ? ` · ${m.supplier}` : ""}</p>
                          </div>
                        </button>
                        <div className="shrink-0 text-right">
                          <p className={`font-display text-lg font-bold leading-tight ${m.status === "out" ? "text-red-600" : m.status === "low" ? "text-amber-600" : ""}`}>{fmt(m.quantity)}</p>
                          <p className="text-[11px] text-muted">{m.unit}</p>
                        </div>
                        <span className={`a-badge hidden w-16 justify-center md:inline-flex ${STATUS[m.status].tone}`}>{STATUS[m.status].label}</span>
                        {rowActions(m)}
                        <button onClick={() => remove(m)} className="a-icon-btn-danger hidden lg:inline-grid" title="Delete" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-2xl lg:left-[272px]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> {toast}
        </div>
      )}

      {dialog?.kind === "material" && <MaterialModal material={dialog.material} garments={garments} onClose={() => setDialog(null)} onSaved={saved} onDelete={remove} />}
      {dialog?.kind === "movement" && <MovementModal material={dialog.material} initialType={dialog.type} onClose={() => setDialog(null)} onSaved={saved} />}
      {dialog?.kind === "purchase" && <PurchaseModal materials={materials} prefill={dialog.prefill} onClose={() => setDialog(null)} onSaved={saved} />}
      {dialog?.kind === "history" && <HistoryModal material={dialog.material} onClose={() => setDialog(null)} />}
    </AdminLayout>
  );
};

export default Inventory;
