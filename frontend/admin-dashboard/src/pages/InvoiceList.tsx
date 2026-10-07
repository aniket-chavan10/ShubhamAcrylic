import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Loader2, Pencil, Plus, Printer, Search, Settings2, Trash2, X } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { PageLoader } from "../components/ui";
import { deleteInvoice, fetchInvoices, Invoice, INVOICE_STATUSES, InvoiceStatus } from "../services/invoiceService";
import { getSiteSettings, updateSiteSettings } from "../services/siteSettingsService";
import { formatDate, inr } from "../utils/format";

function InvoiceSettingsModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ gstin: "", bankDetails: "", upiId: "", invoiceTerms: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSiteSettings()
      .then(s => setForm({ gstin: s.gstin || "", bankDetails: s.bankDetails || "", upiId: s.upiId || "", invoiceTerms: s.invoiceTerms || "" }))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await updateSiteSettings(fd);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Invoice settings</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-paper" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-1 text-sm text-muted">Printed on every invoice. Company name, logo, address and phone come from Site Settings.</p>
        {loading ? <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
          <div className="mt-5 space-y-4">
            <div><label className="a-label">Your GSTIN</label><input className="a-input uppercase" value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} placeholder="27ABCDE1234F1Z5" /></div>
            <div><label className="a-label">UPI ID</label><input className="a-input" value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} placeholder="business@upi" /></div>
            <div><label className="a-label">Bank details</label><textarea rows={3} className="a-input resize-none" value={form.bankDetails} onChange={e => setForm(f => ({ ...f, bankDetails: e.target.value }))} placeholder={"Bank: HDFC Bank\nA/C: 50100XXXXXXX\nIFSC: HDFC0000XXX"} /></div>
            <div><label className="a-label">Default terms</label><textarea rows={3} className="a-input resize-none" value={form.invoiceTerms} onChange={e => setForm(f => ({ ...f, invoiceTerms: e.target.value }))} /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={save} disabled={saving} className="a-btn-primary w-full">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save settings</button>
          </div>
        )}
      </div>
    </div>
  );
}

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState({ billed: 0, received: 0, outstanding: 0 });
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices({ page, status, q: query.trim() });
      setInvoices(data.invoices);
      setSummary(data.summary);
      setPages(data.pages || 1);
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

  const remove = async (inv: Invoice) => {
    if (!confirm(`Delete invoice ${inv.invoiceNumber}? This cannot be undone.`)) return;
    try {
      await deleteInvoice(inv.id);
      load();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <AdminLayout
      title="Invoices"
      actions={<Link to="/invoices/new" className="a-btn-accent"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">New invoice</span></Link>}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="a-card col-span-2 p-4 sm:col-span-1 sm:p-5"><p className="a-label">Total billed</p><p className="font-display text-3xl font-bold">{inr(summary.billed)}</p></div>
        <div className="a-card p-4 sm:p-5"><p className="a-label">Received</p><p className="font-display text-3xl font-bold text-emerald-700">{inr(summary.received)}</p></div>
        <div className="a-card p-4 sm:p-5"><p className="a-label">Outstanding</p><p className="font-display text-3xl font-bold text-accent-dark">{inr(summary.outstanding)}</p></div>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ value: "" as const, label: "All" }, ...INVOICE_STATUSES].map(s => (
            <button key={s.value} onClick={() => { setStatus(s.value); setPage(1); }}
              className={`shrink-0 ${status === s.value ? "a-chip-active" : "a-chip"}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="relative flex-1 lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="a-input pl-10" placeholder="Invoice no, customer, phone…" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
          </label>
          <button onClick={() => setShowSettings(true)} className="a-btn-outline" title="Invoice settings"><Settings2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="a-card mt-4 overflow-hidden">
        {loading && invoices.length === 0 ? (
          <PageLoader className="h-48" />
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted" strokeWidth={1.25} />
            <p className="mt-3 font-semibold">No invoices yet</p>
            <p className="text-sm text-muted">Create one for a walk-in order, or from a website order.</p>
            <Link to="/invoices/new" className="a-btn-primary mt-4"><Plus className="h-4 w-4" /> New invoice</Link>
          </div>
        ) : (
          <>
          {/* Phones: cards */}
          <ul className="divide-y divide-line md:hidden">
            {invoices.map(inv => {
              const s = INVOICE_STATUSES.find(x => x.value === inv.status) ?? INVOICE_STATUSES[1];
              return (
                <li key={inv.id} className="flex items-start gap-2 p-4">
                  <Link to={`/invoices/${inv.id}/print`} className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold">{inv.customerName}</p>
                      <p className="shrink-0 font-semibold">{inr(inv.grandTotal)}</p>
                    </div>
                    <p className="truncate text-xs text-muted">{inv.invoiceNumber} · {formatDate(inv.invoiceDate)}{inv.source === "website" ? " · Website" : ""}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`a-badge ${s.tone}`}>{s.label}</span>
                      {Number(inv.amountPaid) > 0 && inv.status !== "paid" && <span className="text-xs text-muted">paid {inr(inv.amountPaid)}</span>}
                    </div>
                  </Link>
                  <div className="-mr-2 flex flex-col">
                    <Link to={`/invoices/${inv.id}/edit`} className="a-icon-btn" title="Edit"><Pencil className="h-4 w-4" /></Link>
                    <button onClick={() => remove(inv)} className="a-icon-btn-danger" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line bg-paper/60 text-left text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map(inv => {
                  const s = INVOICE_STATUSES.find(x => x.value === inv.status) ?? INVOICE_STATUSES[1];
                  return (
                    <tr key={inv.id} className="transition hover:bg-paper/60">
                      <td className="cursor-pointer px-4 py-3" onClick={() => navigate(`/invoices/${inv.id}/print`)}>
                        <p className="font-semibold">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted">{formatDate(inv.invoiceDate)}</p>
                      </td>
                      <td className="px-4 py-3"><p className="font-medium">{inv.customerName}</p><p className="text-xs text-muted">{inv.customerPhone}</p></td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.source === "website" ? "bg-accent-soft text-accent-dark" : "bg-paper text-muted"}`}>
                          {inv.source === "website" ? "Website" : "Offline"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold">{inr(inv.grandTotal)}</p>
                        {Number(inv.amountPaid) > 0 && inv.status !== "paid" && <p className="text-xs text-muted">paid {inr(inv.amountPaid)}</p>}
                      </td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.tone}`}>{s.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/invoices/${inv.id}/print`} className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink" title="View / print"><Printer className="h-4 w-4" /></Link>
                          <Link to={`/invoices/${inv.id}/edit`} className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink" title="Edit"><Pencil className="h-4 w-4" /></Link>
                          <button onClick={() => remove(inv)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {showSettings && <InvoiceSettingsModal onClose={() => setShowSettings(false)} />}
    </AdminLayout>
  );
};

export default InvoiceList;
