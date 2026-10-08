import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck, Download, FileText, Mail, MessageCircle, Phone, Search, ShoppingBag, Trash2, X,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { refreshStockAlerts } from "../hooks/useStockAlerts";
import { PageLoader } from "../components/ui";
import {
  deleteOrder, fetchOrders, fetchOrderStats, Order, ORDER_STATUSES, OrderStatus, updateOrder,
} from "../services/orderService";
import { getImageUrl } from "../utils/imageUtils";
import { getSiteSettings } from "../services/siteSettingsService";
import { formatDateTime, inr } from "../utils/format";
import { orderMessage, StoreDetails, waLink } from "../utils/whatsapp";
import { downloadFile, extOf } from "../utils/download";

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const s = ORDER_STATUSES.find(x => x.value === status) ?? ORDER_STATUSES[0];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.tone}`}>{s.label}</span>;
};

function OrderDrawer({ order, store, onClose, onChanged, onDeleted }: {
  order: Order;
  store: StoreDetails;
  onClose: () => void;
  onChanged: (o: Order) => void;
  onDeleted: (id: number) => void;
}) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState(order.adminNotes || "");
  const [saving, setSaving] = useState(false);
  const [stockNote, setStockNote] = useState("");
  // Pixel size of each uploaded artwork, so print quality can be judged at a glance
  const [artSize, setArtSize] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState(false);

  useEffect(() => setNotes(order.adminNotes || ""), [order.id, order.adminNotes]);
  useEffect(() => setStockNote(""), [order.id]);

  const patch = async (data: { status?: OrderStatus; adminNotes?: string }) => {
    setSaving(true);
    try {
      const updated = await updateOrder(order.id, data);
      // Linked raw material is deducted / returned automatically
      if (updated.stock?.length) {
        setStockNote(updated.stock.map(s => `${s.material}: ${s.change > 0 ? "+" : "−"}${Math.abs(s.change)} ${s.unit} (now ${s.balance})`).join(" · "));
        refreshStockAlerts();
      } else if (data.status) setStockNote("");
      onChanged(updated);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return;
    try {
      await deleteOrder(order.id);
      onDeleted(order.id);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const wa = waLink(order.phone, orderMessage(order, store));
  const artworkName = (p: Order["prints"][number]) => `${order.orderNumber}_${p.view}_${p.key}${extOf(p.artworkUrl)}`;
  const downloadAll = async () => {
    setDownloading(true);
    try {
      for (const p of order.prints) await downloadFile(getImageUrl(p.artworkUrl), artworkName(p));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-paper shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
            <h2 className="font-display text-xl font-bold">{order.orderNumber}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-paper" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
          {/* Status */}
          <div className="a-card p-4">
            <p className="a-label">Status</p>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map(s => (
                <button key={s.value} disabled={saving} onClick={() => patch({ status: s.value })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${order.status === s.value ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}>
                  {s.label}
                </button>
              ))}
            </div>
            {stockNote && <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-xs"><b>Stock updated</b> · {stockNote}</p>}
          </div>

          {/* Previews */}
          <div className="grid grid-cols-2 gap-3">
            {(["front", "back"] as const).map(v => order.previews?.[v] ? (
              <a key={v} href={getImageUrl(order.previews[v])} target="_blank" rel="noreferrer" className="a-card overflow-hidden">
                <img src={getImageUrl(order.previews[v])} alt={`${v} preview`} className="w-full" />
                <p className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted">{v}</p>
              </a>
            ) : (
              <div key={v} className="a-card grid place-items-center p-6 text-xs text-muted">No {v} print</div>
            ))}
          </div>

          {/* Product */}
          <div className="a-card divide-y divide-line">
            <div className="flex items-center gap-3 p-4">
              <span className="h-10 w-10 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: order.colorHex || "#fff" }} />
              <div className="flex-1">
                <p className="font-semibold">{order.garmentName}</p>
                <p className="text-sm text-muted">{order.colorName} · Size {order.size} · Qty {order.quantity}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 bg-paper/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Print files</p>
                <p className="text-xs text-muted">The customer's original file for each print area, separate from the mockup.</p>
              </div>
              <button onClick={downloadAll} disabled={downloading} className="a-btn-outline px-3 py-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> {downloading ? "Downloading…" : order.prints.length > 1 ? `Download all (${order.prints.length})` : "Download"}
              </button>
            </div>
            {order.prints.map(p => (
              <div key={p.key} className="flex items-center gap-3 p-4">
                <a href={getImageUrl(p.artworkUrl)} target="_blank" rel="noreferrer" className="shrink-0">
                  <img
                    src={getImageUrl(p.artworkUrl)}
                    alt=""
                    onLoad={e => { const { naturalWidth: w, naturalHeight: h } = e.currentTarget; setArtSize(s => ({ ...s, [p.key]: `${w}×${h} px` })); }}
                    className="h-14 w-14 rounded-lg bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:12px_12px] object-contain p-1 ring-1 ring-line"
                  />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.label} <span className="font-normal capitalize text-muted">· {p.view}</span></p>
                  <p className="truncate text-xs text-muted">
                    {p.kind === "text" ? `Text “${p.text}” · ${p.font} · ${p.color}` : "Uploaded image"}{artSize[p.key] ? ` · ${artSize[p.key]}` : ""}
                  </p>
                  <p className="truncate text-xs text-muted">
                    Size {Math.round(p.transform.scale * 100)}% of print area{p.transform.angle ? ` · rotated ${p.transform.angle}°` : ""}
                  </p>
                </div>
                <button onClick={() => downloadFile(getImageUrl(p.artworkUrl), artworkName(p))} className="a-btn-outline px-3 py-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> {extOf(p.artworkUrl).slice(1).toUpperCase()}
                </button>
              </div>
            ))}
            <div className="space-y-1.5 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Base</span><span>{inr(order.basePrice)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Prints</span><span>+{inr(order.printsPrice)}</span></div>
              {Number(order.sizeExtra) > 0 && <div className="flex justify-between"><span className="text-muted">Size extra</span><span>+{inr(order.sizeExtra)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Per piece × {order.quantity}</span><span>{inr(order.unitPrice)}</span></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{inr(order.total)}</span></div>
            </div>
          </div>

          {/* Customer */}
          <div className="a-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{order.customerName}</p>
              {order.emailVerified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Email verified</span>}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-muted">{[order.address, [order.city, order.pincode].filter(Boolean).join(" - ")].filter(Boolean).join("\n")}</p>
            {order.notes && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"><b>Customer note:</b> {order.notes}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={wa} target="_blank" rel="noreferrer" className="a-btn bg-[#25D366] text-white hover:bg-[#1ebe5a]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              <a href={`tel:${order.phone}`} className="a-btn-outline"><Phone className="h-4 w-4" /> {order.phone}</a>
              <a href={`mailto:${order.email}`} className="a-btn-outline"><Mail className="h-4 w-4" /> Email</a>
            </div>
          </div>

          {/* Notes */}
          <div className="a-card p-4">
            <label className="a-label">Internal notes</label>
            <textarea rows={3} className="a-input resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment received via UPI, courier AWB…" />
            <button disabled={saving || notes === (order.adminNotes || "")} onClick={() => patch({ adminNotes: notes })} className="a-btn-primary mt-2">Save notes</button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={remove} className="a-btn text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete order</button>
            <button onClick={() => navigate(`/invoices/new?order=${order.id}`)} className="a-btn-accent"><FileText className="h-4 w-4" /> Create invoice</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<{ total: number; revenue: number; byStatus: Partial<Record<OrderStatus, number>> } | null>(null);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [store, setStore] = useState<StoreDetails>({});

  useEffect(() => { getSiteSettings().then(setStore).catch(() => undefined); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([fetchOrders({ page, status, q: query.trim() }), fetchOrderStats()]);
      setOrders(list.orders);
      setPages(list.pages || 1);
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, status, query]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const onChanged = (o: Order) => {
    setSelected(o);
    setOrders(list => list.map(x => (x.id === o.id ? o : x)));
    fetchOrderStats().then(setStats).catch(() => undefined);
  };

  return (
    <AdminLayout title="Website Orders">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="a-card p-4 sm:p-5"><p className="a-label">Total orders</p><p className="font-display text-3xl font-bold">{stats?.total ?? "—"}</p></div>
        <div className="a-card p-4 sm:p-5"><p className="a-label">Awaiting action</p><p className="font-display text-3xl font-bold text-accent">{stats?.byStatus.new ?? 0}</p></div>
        <div className="a-card col-span-2 p-4 sm:col-span-1 sm:p-5"><p className="a-label">Order value (excl. cancelled)</p><p className="font-display text-3xl font-bold">{inr(stats?.revenue ?? 0)}</p></div>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ value: "" as const, label: "All" }, ...ORDER_STATUSES].map(s => {
            const count = s.value ? stats?.byStatus[s.value as OrderStatus] : undefined;
            return (
              <button key={s.value} onClick={() => { setStatus(s.value); setPage(1); }}
                className={`shrink-0 ${status === s.value ? "a-chip-active" : "a-chip"}`}>
                {s.label}
                {count ? <span className="ml-1.5 opacity-60">{count}</span> : null}
              </button>
            );
          })}
        </div>
        <label className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="a-input pl-10" placeholder="Search order no, name, phone…" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
        </label>
      </div>

      <div className="a-card mt-4 overflow-hidden">
        {loading && orders.length === 0 ? (
          <PageLoader className="h-48" />
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted" strokeWidth={1.25} />
            <p className="mt-3 font-semibold">No orders yet</p>
            <p className="text-sm text-muted">Orders from the website design studio will appear here.</p>
          </div>
        ) : (
          <>
          {/* Phones: cards */}
          <ul className="divide-y divide-line md:hidden">
            {orders.map(o => (
              <li key={o.id}>
                <button onClick={() => setSelected(o)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-paper/60">
                  {o.previews?.front
                    ? <img src={getImageUrl(o.previews.front)} alt="" className="h-14 w-12 shrink-0 rounded-lg bg-paper object-cover" />
                    : <span className="h-14 w-12 shrink-0 rounded-lg bg-paper" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold">{o.customerName}</p>
                      <p className="shrink-0 font-semibold">{inr(o.total)}</p>
                    </div>
                    <p className="truncate text-xs text-muted">{o.orderNumber} · {formatDateTime(o.createdAt)}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted">{o.garmentName} × {o.quantity} · {o.size}</p>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line bg-paper/60 text-left text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map(o => (
                  <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer transition hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {o.previews?.front
                          ? <img src={getImageUrl(o.previews.front)} alt="" className="h-12 w-11 rounded-lg bg-paper object-cover" />
                          : <span className="h-12 w-11 rounded-lg bg-paper" />}
                        <div>
                          <p className="font-semibold">{o.orderNumber}</p>
                          <p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><p className="font-medium">{o.customerName}</p><p className="text-xs text-muted">{o.phone}</p></td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.garmentName} <span className="text-muted">× {o.quantity}</span></p>
                      <p className="text-xs text-muted">{o.colorName} · {o.size} · {o.prints.map(p => p.label.split(" ")[0]).join(", ")}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{inr(o.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm sm:justify-end">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="a-btn-outline px-3 py-1.5">Previous</button>
          <span className="text-muted">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="a-btn-outline px-3 py-1.5">Next</button>
        </div>
      )}

      {selected && (
        <OrderDrawer
          order={selected}
          store={store}
          onClose={() => setSelected(null)}
          onChanged={onChanged}
          onDeleted={(id) => { setSelected(null); setOrders(list => list.filter(o => o.id !== id)); load(); }}
        />
      )}
    </AdminLayout>
  );
};

export default OrderManagement;
