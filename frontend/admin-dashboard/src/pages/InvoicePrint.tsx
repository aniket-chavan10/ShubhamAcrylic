import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MessageCircle, Pencil, Printer } from "lucide-react";
import { fetchInvoice, Invoice } from "../services/invoiceService";
import { getSiteSettings } from "../services/siteSettingsService";
import { getImageUrl } from "../utils/imageUtils";
import { formatDate, inr, waNumber } from "../utils/format";
import { amountInWords } from "../utils/numberToWords";

interface Settings {
  companyName?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  bankDetails?: string;
  upiId?: string;
}

/** A4 printable invoice. Use the browser's "Save as PDF" to share a PDF. */
const InvoicePrint = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchInvoice(id!), getSiteSettings().catch(() => ({}))])
      .then(([inv, s]) => { setInvoice(inv); setSettings(s); })
      .catch(err => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (invoice) document.title = `${invoice.invoiceNumber} – ${invoice.customerName}`;
    return () => { document.title = "Admin"; };
  }, [invoice]);

  if (error) return <div className="grid min-h-screen place-items-center text-red-600">{error}</div>;
  if (!invoice) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>;

  const brand = settings.companyName || "Astitva Creations";
  const tax = Number(invoice.taxPercent) || 0;
  const taxTotal = Number(invoice.taxTotal) || 0;
  const grand = Number(invoice.grandTotal) || 0;
  const paid = Number(invoice.amountPaid) || 0;
  const balance = Math.max(0, grand - paid);
  const gross = invoice.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  const subtotal = Number(invoice.subtotal) || 0;
  const title = tax > 0 && settings.gstin ? "Tax Invoice" : "Invoice";
  const hasHsn = invoice.items.some(it => it.hsn);
  const hasLineDiscount = invoice.items.some(it => Number(it.discountPct) > 0);

  const share = invoice.customerPhone
    ? `https://wa.me/${waNumber(invoice.customerPhone)}?text=${encodeURIComponent(
      `Hi ${invoice.customerName}, here are your invoice details from ${brand}:\n\nInvoice: ${invoice.invoiceNumber}\nDate: ${formatDate(invoice.invoiceDate)}\nAmount: ${inr(grand, true)}${balance > 0 && balance < grand ? `\nBalance due: ${inr(balance, true)}` : ""}${settings.upiId ? `\n\nPay via UPI: ${settings.upiId}` : ""}\n\nThank you for your business!`,
    )}`
    : "";

  return (
    <div className="min-h-screen bg-paper-deep py-6 print:bg-white print:py-0">
      {/* Toolbar */}
      <div className="no-print mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4">
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Invoices</Link>
        <div className="flex gap-2">
          <Link to={`/invoices/${invoice.id}/edit`} className="a-btn-outline"><Pencil className="h-4 w-4" /> Edit</Link>
          {share && <a href={share} target="_blank" rel="noreferrer" className="a-btn bg-[#25D366] text-white hover:bg-[#1ebe5a]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
          <button onClick={() => window.print()} className="a-btn-primary"><Printer className="h-4 w-4" /> Print / PDF</button>
        </div>
      </div>

      {/* A4 sheet */}
      <article className="print-page relative mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col overflow-hidden bg-white text-[12.5px] leading-relaxed text-ink shadow-xl">
        {invoice.status === "paid" && (
          <div className="pointer-events-none absolute right-10 top-44 rotate-[-14deg] rounded-xl border-4 border-emerald-600/70 px-5 py-1.5 font-display text-4xl font-extrabold uppercase tracking-widest text-emerald-600/70">Paid</div>
        )}
        {invoice.status === "cancelled" && (
          <div className="pointer-events-none absolute right-10 top-44 rotate-[-14deg] rounded-xl border-4 border-red-600/60 px-5 py-1.5 font-display text-4xl font-extrabold uppercase tracking-widest text-red-600/60">Cancelled</div>
        )}

        {/* Brand header */}
        <header className="flex items-start justify-between gap-6 bg-ink px-10 py-8 text-white">
          <div className="flex items-center gap-4">
            {settings.logoUrl ? (
              <img src={getImageUrl(settings.logoUrl)} alt="" className="h-16 w-16 rounded-xl bg-white object-contain p-1" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-xl bg-accent font-display text-3xl font-extrabold">{brand.charAt(0)}</div>
            )}
            <div>
              <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">{brand}</h1>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Custom Printed Apparel</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold uppercase tracking-wide text-accent">{title}</p>
            <p className="mt-1 font-semibold">{invoice.invoiceNumber}</p>
          </div>
        </header>

        <div className="flex-1 px-10 py-8">
          {/* Parties */}
          <section className="grid grid-cols-3 gap-6 border-b border-line pb-6">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">From</p>
              <p className="font-semibold">{brand}</p>
              {settings.address && <p className="whitespace-pre-line text-muted">{settings.address}</p>}
              {settings.phone && <p className="text-muted">Ph: {settings.phone}</p>}
              {settings.email && <p className="text-muted">{settings.email}</p>}
              {settings.gstin && <p className="mt-1 font-semibold">GSTIN: {settings.gstin}</p>}
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Bill to</p>
              <p className="font-semibold">{invoice.customerName}</p>
              {invoice.customerAddress && <p className="whitespace-pre-line text-muted">{invoice.customerAddress}</p>}
              {invoice.customerPhone && <p className="text-muted">Ph: {invoice.customerPhone}</p>}
              {invoice.customerEmail && <p className="text-muted">{invoice.customerEmail}</p>}
              {invoice.customerGstin && <p className="mt-1 font-semibold">GSTIN: {invoice.customerGstin}</p>}
            </div>
            <div className="space-y-1 text-right">
              <p><span className="text-muted">Invoice date:</span> <b>{formatDate(invoice.invoiceDate)}</b></p>
              {invoice.dueDate && <p><span className="text-muted">Due date:</span> <b>{formatDate(invoice.dueDate)}</b></p>}
              <p><span className="text-muted">Order type:</span> <b>{invoice.source === "website" ? "Website" : "Direct"}</b></p>
            </div>
          </section>

          {/* Items */}
          <table className="mt-6 w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-ink text-left text-[10px] font-bold uppercase tracking-[0.14em]">
                <th className="w-8 py-2.5">#</th>
                <th className="py-2.5">Description</th>
                {hasHsn && <th className="py-2.5">HSN</th>}
                <th className="py-2.5 text-right">Qty</th>
                <th className="py-2.5 text-right">Rate</th>
                {hasLineDiscount && <th className="py-2.5 text-right">Disc.</th>}
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => {
                const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0) * (1 - (Number(it.discountPct) || 0) / 100);
                return (
                  <tr key={i} className="border-b border-line align-top">
                    <td className="py-3 text-muted">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium">{it.description}</td>
                    {hasHsn && <td className="py-3 text-muted">{it.hsn}</td>}
                    <td className="py-3 text-right">{Number(it.qty)} {it.unit}</td>
                    <td className="py-3 text-right">{inr(it.rate, true)}</td>
                    {hasLineDiscount && <td className="py-3 text-right">{Number(it.discountPct) ? `${Number(it.discountPct)}%` : "—"}</td>}
                    <td className="py-3 text-right font-semibold">{inr(amount, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <section className="mt-6 grid grid-cols-2 gap-10">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Amount in words</p>
                <p className="mt-1 font-medium">{amountInWords(grand)}</p>
              </div>
              {(settings.bankDetails || settings.upiId) && (
                <div className="rounded-xl bg-paper p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Payment details</p>
                  {settings.bankDetails && <p className="mt-1 whitespace-pre-line">{settings.bankDetails}</p>}
                  {settings.upiId && <p className="mt-1">UPI: <b>{settings.upiId}</b></p>}
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Notes</p>
                  <p className="mt-1 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Line label="Sub total" value={inr(hasLineDiscount ? gross : subtotal, true)} />
              {hasLineDiscount && <Line label="Item discounts" value={`− ${inr(gross - subtotal, true)}`} />}
              {Number(invoice.discountTotal) > 0 && (
                <Line label={`Discount${invoice.discountType === "percent" ? ` (${Number(invoice.discountValue)}%)` : ""}`} value={`− ${inr(invoice.discountTotal, true)}`} />
              )}
              {tax > 0 && (invoice.taxMode === "igst"
                ? <Line label={`IGST @ ${tax}%`} value={inr(taxTotal, true)} />
                : <>
                  <Line label={`CGST @ ${tax / 2}%`} value={inr(taxTotal / 2, true)} />
                  <Line label={`SGST @ ${tax / 2}%`} value={inr(taxTotal / 2, true)} />
                </>)}
              {Number(invoice.shipping) > 0 && <Line label="Shipping & handling" value={inr(invoice.shipping, true)} />}
              {Number(invoice.roundOffAmount) !== 0 && <Line label="Round off" value={inr(invoice.roundOffAmount, true)} />}
              <div className="mt-2 flex items-baseline justify-between rounded-xl bg-ink px-4 py-3 text-white">
                <span className="text-xs font-bold uppercase tracking-[0.18em]">Total</span>
                <span className="font-display text-2xl font-bold">{inr(grand, true)}</span>
              </div>
              {paid > 0 && (
                <>
                  <Line label="Amount received" value={inr(paid, true)} />
                  <Line label="Balance due" value={inr(balance, true)} bold />
                </>
              )}
            </div>
          </section>

          {/* Terms & signature */}
          <section className="mt-10 grid grid-cols-2 items-end gap-10">
            <div>
              {invoice.terms && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Terms & conditions</p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[11px] text-muted">
                    {invoice.terms.split("\n").filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}
                  </ol>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted">For <b className="text-ink">{brand}</b></p>
              <div className="mt-14 inline-block border-t border-ink px-6 pt-1.5 text-[11px] font-semibold">Authorised Signatory</div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t-4 border-accent bg-paper px-10 py-4 text-[11px] text-muted">
          <span>Thank you for your business!</span>
          <span>{[settings.phone, settings.email].filter(Boolean).join("  ·  ")}</span>
        </footer>
      </article>
    </div>
  );
};

const Line = ({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex justify-between px-1 ${bold ? "font-bold" : ""}`}>
    <span className="text-muted">{label}</span>
    <span>{value}</span>
  </div>
);

export default InvoicePrint;
