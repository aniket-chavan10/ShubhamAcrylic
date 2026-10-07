import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Printer, Save, Target, Trash2 } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { PageLoader } from "../components/ui";
import { fetchInvoice, fetchNextInvoiceNumber, InvoiceStatus, saveInvoice } from "../services/invoiceService";
import { fetchOrder } from "../services/orderService";
import { fetchGarments } from "../services/garmentService";
import { fetchProducts } from "../services/productService";
import { getSiteSettings } from "../services/siteSettingsService";
import { computeTotals, discountForTarget, InvoiceItem, lineAmount } from "../utils/invoiceMath";
import { amountInWords } from "../utils/numberToWords";
import { inr } from "../utils/format";

const today = () => new Date().toISOString().slice(0, 10);
const blankItem = (): InvoiceItem => ({ description: "", hsn: "", unit: "pcs", qty: 1, rate: 0, discountPct: 0 });
const GST_PRESETS = [0, 5, 12, 18];

interface Suggestion { label: string; rate: number }

const InvoiceEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const orderId = search.get("order");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [target, setTarget] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState("");
  const [source, setSource] = useState<"website" | "manual">("manual");
  const [linkedOrder, setLinkedOrder] = useState<number | null>(null);
  const [customer, setCustomer] = useState({ customerName: "", customerPhone: "", customerEmail: "", customerAddress: "", customerGstin: "" });
  const [items, setItems] = useState<InvoiceItem[]>([blankItem()]);
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [taxMode, setTaxMode] = useState<"cgst_sgst" | "igst">("cgst_sgst");
  const [shipping, setShipping] = useState(0);
  const [roundOff, setRoundOff] = useState(true);
  const [amountPaid, setAmountPaid] = useState(0);
  const [status, setStatus] = useState<InvoiceStatus>("unpaid");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [settings, garments, products] = await Promise.all([
          getSiteSettings().catch(() => ({})),
          fetchGarments().catch(() => []),
          fetchProducts().catch(() => ({ products: [] })),
        ]);
        const productList: { name: string; price: number | string }[] = Array.isArray(products) ? products : products.products || [];
        const garmentList: { name: string; basePrice: number | string }[] = garments;
        setSuggestions([
          ...garmentList.map(g => ({ label: `Custom ${g.name}`, rate: Number(g.basePrice) || 0 })),
          ...productList.map(p => ({ label: p.name, rate: Number(p.price) || 0 })),
        ]);

        if (id) {
          const inv = await fetchInvoice(id);
          setInvoiceNumber(inv.invoiceNumber);
          setInvoiceDate(inv.invoiceDate);
          setDueDate(inv.dueDate || "");
          setSource(inv.source);
          setLinkedOrder(inv.orderId ?? null);
          setCustomer({
            customerName: inv.customerName, customerPhone: inv.customerPhone || "", customerEmail: inv.customerEmail || "",
            customerAddress: inv.customerAddress || "", customerGstin: inv.customerGstin || "",
          });
          setItems(inv.items.length ? inv.items.map(it => ({
            description: it.description, hsn: it.hsn || "", unit: it.unit || "pcs",
            qty: Number(it.qty) || 0, rate: Number(it.rate) || 0, discountPct: Number(it.discountPct) || 0,
          })) : [blankItem()]);
          setDiscountType(inv.discountType);
          setDiscountValue(Number(inv.discountValue) || 0);
          setTaxPercent(Number(inv.taxPercent) || 0);
          setTaxMode(inv.taxMode);
          setShipping(Number(inv.shipping) || 0);
          setRoundOff(inv.roundOff);
          setAmountPaid(Number(inv.amountPaid) || 0);
          setStatus(inv.status);
          setNotes(inv.notes || "");
          setTerms(inv.terms || "");
        } else {
          setInvoiceNumber(await fetchNextInvoiceNumber().catch(() => ""));
          setTerms((settings as { invoiceTerms?: string }).invoiceTerms || "");
          if (orderId) {
            const o = await fetchOrder(orderId);
            setSource("website");
            setLinkedOrder(o.id);
            setCustomer({
              customerName: o.customerName, customerPhone: o.phone, customerEmail: o.email,
              customerAddress: [o.address, [o.city, o.pincode].filter(Boolean).join(" - ")].filter(Boolean).join("\n"), customerGstin: "",
            });
            setItems([{
              description: `Custom ${o.garmentName} – ${o.colorName}, Size ${o.size} (${o.prints.map(p => p.label).join(", ")})`,
              hsn: "", unit: "pcs", qty: o.quantity, rate: Number(o.unitPrice) || 0, discountPct: 0,
            }]);
            setNotes(`Website order ${o.orderNumber}`);
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, orderId]);

  const totals = useMemo(
    () => computeTotals(items, { discountType, discountValue, taxPercent, shipping, roundOff }),
    [items, discountType, discountValue, taxPercent, shipping, roundOff],
  );
  const balance = Math.max(0, totals.grandTotal - amountPaid);

  const setItem = (i: number, patch: Partial<InvoiceItem>) => setItems(list => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const onDescription = (i: number, value: string) => {
    const match = suggestions.find(s => s.label === value);
    setItem(i, match && !items[i].rate ? { description: value, rate: match.rate } : { description: value });
  };

  const applyTarget = () => {
    const t = Number(target);
    if (!t) return;
    setDiscountType("amount");
    setDiscountValue(discountForTarget(totals.subtotal, t, taxPercent, shipping));
    setRoundOff(true);
  };

  const save = async (thenPrint: boolean) => {
    if (!customer.customerName.trim()) { setError("Enter the customer name."); return; }
    if (!items.some(it => it.description.trim())) { setError("Add at least one item."); return; }
    setError("");
    setSaving(true);
    try {
      const saved = await saveInvoice(id ? Number(id) : null, {
        invoiceNumber, invoiceDate, dueDate: dueDate || null, source, orderId: linkedOrder,
        ...customer, items, discountType, discountValue, taxPercent, taxMode, shipping, roundOff, amountPaid, status, notes, terms,
      });
      navigate(thenPrint ? `/invoices/${saved.id}/print` : "/invoices");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const num = (v: string) => Math.max(0, Number(v) || 0);

  if (loading) {
    return <AdminLayout title="Invoice"><PageLoader /></AdminLayout>;
  }

  return (
    <AdminLayout title={id ? `Edit ${invoiceNumber}` : "New invoice"}>
      <Link to="/invoices" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> All invoices</Link>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Header */}
          <section className="a-card grid gap-4 p-5 sm:grid-cols-2 sm:p-6 2xl:grid-cols-4">
            <div><label className="a-label">Invoice no.</label><input className="a-input font-semibold" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} /></div>
            <div><label className="a-label">Invoice date</label><input type="date" className="a-input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
            <div><label className="a-label">Due date</label><input type="date" className="a-input" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
            <div>
              <label className="a-label">Order source</label>
              <select className="a-select" value={source} onChange={e => setSource(e.target.value as "website" | "manual")}>
                <option value="manual">Offline / direct</option>
                <option value="website">Website order</option>
              </select>
            </div>
          </section>

          {/* Customer */}
          <section className="a-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Bill to</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="a-label">Customer / business name</label><input className="a-input" value={customer.customerName} onChange={e => setCustomer(c => ({ ...c, customerName: e.target.value }))} /></div>
              <div><label className="a-label">Phone</label><input className="a-input" value={customer.customerPhone} onChange={e => setCustomer(c => ({ ...c, customerPhone: e.target.value }))} /></div>
              <div><label className="a-label">Email</label><input className="a-input" value={customer.customerEmail} onChange={e => setCustomer(c => ({ ...c, customerEmail: e.target.value }))} /></div>
              <div><label className="a-label">GSTIN (optional)</label><input className="a-input uppercase" value={customer.customerGstin} onChange={e => setCustomer(c => ({ ...c, customerGstin: e.target.value.toUpperCase() }))} /></div>
              <div className="sm:col-span-2"><label className="a-label">Address</label><textarea rows={2} className="a-input resize-none" value={customer.customerAddress} onChange={e => setCustomer(c => ({ ...c, customerAddress: e.target.value }))} /></div>
            </div>
          </section>

          {/* Items */}
          <section className="a-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Items</h2>
            <datalist id="invoice-products">
              {suggestions.map(s => <option key={s.label} value={s.label}>{inr(s.rate)}</option>)}
            </datalist>
            <div className="mt-4 hidden grid-cols-[1fr_80px_70px_100px_70px_100px_32px] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted lg:grid">
              <span>Product / description</span><span>HSN</span><span>Qty</span><span>Rate ₹</span><span>Disc %</span><span className="text-right">Amount</span><span />
            </div>
            <div className="mt-2 space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-6 gap-2 rounded-xl bg-paper/60 p-3 lg:grid-cols-[1fr_80px_70px_100px_70px_100px_32px] lg:items-center lg:bg-transparent lg:p-0">
                  <input list="invoice-products" className="a-input col-span-6 lg:col-span-1" placeholder="e.g. Custom Hoodie – Black, L" value={it.description} onChange={e => onDescription(i, e.target.value)} />
                  <input className="a-input col-span-2 lg:col-span-1" placeholder="HSN" value={it.hsn} onChange={e => setItem(i, { hsn: e.target.value })} />
                  <input className="a-input col-span-2 lg:col-span-1" type="number" inputMode="decimal" min={0} placeholder="Qty" value={it.qty} onChange={e => setItem(i, { qty: num(e.target.value) })} aria-label="Quantity" />
                  <input className="a-input col-span-2 lg:col-span-1" type="number" inputMode="decimal" min={0} placeholder="Rate ₹" value={it.rate} onChange={e => setItem(i, { rate: num(e.target.value) })} aria-label="Rate" />
                  <input className="a-input col-span-2 lg:col-span-1" type="number" inputMode="decimal" min={0} max={100} placeholder="Disc %" value={it.discountPct} onChange={e => setItem(i, { discountPct: Math.min(100, num(e.target.value)) })} aria-label="Discount percent" />
                  <p className="col-span-3 self-center text-right font-semibold lg:col-span-1">{inr(lineAmount(it), true)}</p>
                  <button onClick={() => setItems(list => (list.length > 1 ? list.filter((_, j) => j !== i) : [blankItem()]))}
                    className="col-span-1 grid place-items-center rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Remove item">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setItems(list => [...list, blankItem()])} className="a-btn-outline mt-4"><Plus className="h-4 w-4" /> Add item</button>
          </section>

          {/* Adjustments */}
          <section className="a-card grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <label className="a-label">Extra discount</label>
              <div className="flex gap-2">
                <div className="flex rounded-xl border border-line bg-paper p-0.5">
                  {(["amount", "percent"] as const).map(t => (
                    <button key={t} onClick={() => setDiscountType(t)} className={`rounded-lg px-3 text-sm font-semibold ${discountType === t ? "bg-white shadow-sm" : "text-muted"}`}>
                      {t === "amount" ? "₹" : "%"}
                    </button>
                  ))}
                </div>
                <input className="a-input" type="number" min={0} value={discountValue} onChange={e => setDiscountValue(num(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="a-label">GST</label>
              <div className="flex flex-wrap gap-2">
                {GST_PRESETS.map(g => (
                  <button key={g} onClick={() => setTaxPercent(g)} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${taxPercent === g ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{g}%</button>
                ))}
                <input className="a-input w-20" type="number" min={0} value={taxPercent} onChange={e => setTaxPercent(num(e.target.value))} aria-label="Custom GST percent" />
              </div>
              {taxPercent > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <label className="flex items-center gap-1.5"><input type="radio" checked={taxMode === "cgst_sgst"} onChange={() => setTaxMode("cgst_sgst")} /> CGST + SGST (same state)</label>
                  <label className="flex items-center gap-1.5"><input type="radio" checked={taxMode === "igst"} onChange={() => setTaxMode("igst")} /> IGST</label>
                </div>
              )}
            </div>
            <div><label className="a-label">Shipping / other charges (₹)</label><input className="a-input" type="number" min={0} value={shipping} onChange={e => setShipping(num(e.target.value))} /></div>
            <div><label className="a-label">Amount received (₹)</label><input className="a-input" type="number" min={0} value={amountPaid} onChange={e => setAmountPaid(num(e.target.value))} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={roundOff} onChange={e => setRoundOff(e.target.checked)} className="h-4 w-4 accent-ink" /> Round off to nearest rupee</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={status === "draft"} onChange={e => setStatus(e.target.checked ? "draft" : "unpaid")} className="h-4 w-4 accent-ink" /> Save as draft</label>
            <div className="sm:col-span-2"><label className="a-label">Notes (printed on invoice)</label><textarea rows={2} className="a-input resize-none" value={notes} onChange={e => setNotes(e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="a-label">Terms & conditions</label><textarea rows={3} className="a-input resize-none" value={terms} onChange={e => setTerms(e.target.value)} /></div>
          </section>
        </div>

        {/* Live summary */}
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="overflow-hidden rounded-2xl bg-ink text-white">
            <div className="space-y-2.5 p-5 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Live total · {totals.totalQty} pcs</p>
              <Row label="Items total" value={inr(totals.gross, true)} />
              {totals.lineDiscounts > 0 && <Row label="Item discounts" value={`− ${inr(totals.lineDiscounts, true)}`} accent />}
              {totals.discountTotal > 0 && <Row label={`Extra discount${discountType === "percent" ? ` (${discountValue}%)` : ""}`} value={`− ${inr(totals.discountTotal, true)}`} accent />}
              <Row label="Taxable value" value={inr(totals.taxable, true)} />
              {taxPercent > 0 && (taxMode === "igst"
                ? <Row label={`IGST ${taxPercent}%`} value={inr(totals.taxTotal, true)} />
                : <>
                  <Row label={`CGST ${taxPercent / 2}%`} value={inr(totals.taxTotal / 2, true)} />
                  <Row label={`SGST ${taxPercent / 2}%`} value={inr(totals.taxTotal / 2, true)} />
                </>)}
              {totals.shipping > 0 && <Row label="Shipping" value={inr(totals.shipping, true)} />}
              {roundOff && totals.roundOffAmount !== 0 && <Row label="Round off" value={`${totals.roundOffAmount > 0 ? "+" : "−"} ${inr(Math.abs(totals.roundOffAmount), true)}`} />}
            </div>
            <div className="border-t border-white/10 bg-white/5 p-5">
              <p className="text-xs text-white/50">Grand total</p>
              <p className="font-display text-4xl font-bold">{inr(totals.grandTotal, !roundOff)}</p>
              <p className="mt-1 text-xs leading-snug text-white/50">{amountInWords(totals.grandTotal)}</p>
              {amountPaid > 0 && (
                <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-sm">
                  <span className="text-white/60">Balance due</span><span className="font-semibold">{inr(balance, true)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="a-card p-4">
            <label className="a-label flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Agreed a final price?</label>
            <div className="flex gap-2">
              <input className="a-input" type="number" min={0} placeholder={String(totals.grandTotal)} value={target} onChange={e => setTarget(e.target.value)} />
              <button onClick={applyTarget} className="a-btn-outline shrink-0">Apply</button>
            </div>
            <p className="mt-1.5 text-xs text-muted">Sets the extra discount so the grand total matches this amount.</p>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <div className="hidden grid-cols-2 gap-2 xl:grid">
            <button onClick={() => save(false)} disabled={saving} className="a-btn-outline">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
            <button onClick={() => save(true)} disabled={saving} className="a-btn-accent">
              <Printer className="h-4 w-4" /> Save & print
            </button>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 flex items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 xl:hidden">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted">Grand total</p>
          <p className="truncate font-display text-xl font-bold">{inr(totals.grandTotal, !roundOff)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => save(false)} disabled={saving} className="a-btn-outline px-3">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          <button onClick={() => save(true)} disabled={saving} className="a-btn-accent px-3"><Printer className="h-4 w-4" /> <span className="hidden min-[400px]:inline">Save &</span> print</button>
        </div>
      </div>
    </AdminLayout>
  );
};

const Row = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex justify-between gap-4">
    <span className="text-white/60">{label}</span>
    <span className={accent ? "text-accent" : ""}>{value}</span>
  </div>
);

export default InvoiceEditor;
