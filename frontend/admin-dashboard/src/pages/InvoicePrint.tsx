import { Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Pencil, Printer } from "lucide-react";
import { fetchInvoice, Invoice, INVOICE_STATUSES } from "../services/invoiceService";
import { getSiteSettings } from "../services/siteSettingsService";
import { getImageUrl } from "../utils/imageUtils";
import BrandLogo from "../components/BrandLogo";
import { PageLoader } from "../components/ui";
import { formatDate, inr, waNumber } from "../utils/format";
import { lineAmount } from "../utils/invoiceMath";
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

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
/** 1234.5 → "1,234.50" (the ₹ sign is in the column header) */
const num = (n: number | string) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Spread `total` over `weights` in proportion, rounded to paise, with any
 * rounding difference put on the last non-zero line so the column adds up.
 */
function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  if (!sum) return weights.map(() => 0);
  const parts = weights.map(w => r2((total * w) / sum));
  const diff = r2(total - parts.reduce((s, p) => s + p, 0));
  const last = weights.map(w => w !== 0).lastIndexOf(true);
  if (last >= 0) parts[last] = r2(parts[last] + diff);
  return parts;
}

// Table cell styles
const cell = "border border-neutral-300 px-1.5 py-1.5 align-top";
const head = "border border-neutral-300 bg-neutral-100 px-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-700";

/** A4 printable GST invoice. Use the browser's "Save as PDF" to share a PDF. */
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
  if (!invoice) return <PageLoader className="min-h-screen" />;

  const brand = settings.companyName || "Astitva Creations";
  const tax = Number(invoice.taxPercent) || 0;
  const igst = invoice.taxMode === "igst";
  const taxTotal = Number(invoice.taxTotal) || 0;
  const grand = Number(invoice.grandTotal) || 0;
  const paid = Number(invoice.amountPaid) || 0;
  const balance = Math.max(0, r2(grand - paid));
  const shipping = Number(invoice.shipping) || 0;
  const roundOff = Number(invoice.roundOffAmount) || 0;
  const title = tax > 0 && settings.gstin ? "Tax Invoice" : "Invoice";
  const statusLabel = INVOICE_STATUSES.find(s => s.value === invoice.status)?.label ?? invoice.status;

  // ── Line-wise breakdown: the invoice-level discount and tax are spread over
  //    the items in proportion, matching the totals saved on the invoice.
  const items = invoice.items.filter(it => String(it.description || "").trim());
  const net = items.map(it => lineAmount({ ...it, qty: Number(it.qty), rate: Number(it.rate), discountPct: Number(it.discountPct) }));
  const extraDiscount = allocate(Number(invoice.discountTotal) || 0, net);
  const taxable = net.map((n, i) => r2(n - extraDiscount[i]));
  const taxes = allocate(taxTotal, taxable);
  const rows = items.map((it, i) => {
    const gross = r2((Number(it.qty) || 0) * (Number(it.rate) || 0));
    const half = r2(taxes[i] / 2);
    return {
      it,
      gross,
      discount: r2(gross - taxable[i]),
      taxable: taxable[i],
      cgst: half,
      sgst: r2(taxes[i] - half),
      tax: taxes[i],
      total: r2(taxable[i] + taxes[i]),
    };
  });
  const sum = (key: "gross" | "discount" | "taxable" | "cgst" | "sgst" | "tax" | "total") =>
    r2(rows.reduce((s, r) => s + r[key], 0));
  const units = new Set(items.map(it => (it.unit || "").trim().toLowerCase()));
  const totalQty = units.size === 1 ? items.reduce((s, it) => s + (Number(it.qty) || 0), 0) : null;

  const hasHsn = items.some(it => it.hsn);
  const hasDiscount = sum("discount") > 0;
  const hasTax = tax > 0;
  // Description column gets whatever is left; numeric columns are fixed width
  const colCount = 5 + (hasHsn ? 1 : 0) + (hasDiscount ? 1 : 0) + (hasTax ? (igst ? 2 : 4) + 1 : 0);

  const share = invoice.customerPhone
    ? `https://wa.me/${waNumber(invoice.customerPhone)}?text=${encodeURIComponent(
      `Hi ${invoice.customerName}, here are your invoice details from ${brand}:\n\nInvoice: ${invoice.invoiceNumber}\nDate: ${formatDate(invoice.invoiceDate)}\nAmount: ${inr(grand, true)}${balance > 0 && balance < grand ? `\nBalance due: ${inr(balance, true)}` : ""}${settings.upiId ? `\n\nPay via UPI: ${settings.upiId}` : ""}\n\nThank you for your business!`,
    )}`
    : "";

  return (
    <div className="min-h-screen bg-paper-deep py-4 sm:py-6 print:bg-white print:py-0">
      {/* Toolbar */}
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-3 sm:mb-5 sm:px-4">
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Invoices</Link>
        <div className="flex flex-wrap gap-2">
          <Link to={`/invoices/${invoice.id}/edit`} className="a-btn-outline"><Pencil className="h-4 w-4" /> Edit</Link>
          {share && <a href={share} target="_blank" rel="noreferrer" className="a-btn bg-[#25D366] text-white hover:bg-[#1ebe5a]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
          <button onClick={() => window.print()} className="a-btn-primary"><Printer className="h-4 w-4" /> Print / PDF</button>
        </div>
      </div>

      {/* A4 sheet (scrolls sideways on phones so the table never squashes) */}
      <p className="no-print mb-2 px-3 text-center text-xs text-muted sm:hidden">Swipe sideways to see the full invoice</p>
      <div className="overflow-x-auto px-3 pb-2 sm:px-4 print:overflow-visible print:p-0">
      <article className="print-page relative mx-auto flex min-h-[297mm] w-[210mm] min-w-[210mm] flex-col bg-white px-[12mm] py-[11mm] font-sans text-[10.5px] leading-snug text-neutral-900 shadow-xl">
        {(invoice.status === "paid" || invoice.status === "cancelled") && (
          <div className={`pointer-events-none absolute right-[16mm] top-[52mm] rotate-[-12deg] rounded border-[3px] px-4 py-1 text-2xl font-extrabold uppercase tracking-[0.2em] ${invoice.status === "paid" ? "border-emerald-700/50 text-emerald-700/50" : "border-red-700/50 text-red-700/50"}`}>
            {invoice.status}
          </div>
        )}

        {/* ── Seller & title ──────────────────────────────────────────── */}
        <header className="flex items-start justify-between gap-8 border-b-2 border-neutral-900 pb-4">
          <div className="flex min-w-0 gap-4">
            <BrandLogo src={getImageUrl(settings.logoUrl)} className="h-16 w-16" />
            <div className="min-w-0">
              <h1 className="text-[18px] font-extrabold uppercase leading-tight tracking-tight">{brand}</h1>
              {settings.address && <p className="mt-1 whitespace-pre-line text-neutral-600">{settings.address}</p>}
              <p className="mt-0.5 text-neutral-600">
                {[settings.phone && `Ph: ${settings.phone}`, settings.email].filter(Boolean).join("  |  ")}
              </p>
              {settings.gstin && <p className="mt-0.5"><span className="text-neutral-600">GSTIN:</span> <b>{settings.gstin}</b></p>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[20px] font-extrabold uppercase tracking-[0.08em]">{title}</p>
            <p className="mt-0.5 text-[9.5px] uppercase tracking-wider text-neutral-500">Original for recipient</p>
          </div>
        </header>

        {/* ── Buyer & invoice details ─────────────────────────────────── */}
        <section className="mt-4 grid grid-cols-2 border border-neutral-300">
          <div className="border-r border-neutral-300 p-3">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">Bill to / Ship to</p>
            <p className="text-[12px] font-bold">{invoice.customerName}</p>
            {invoice.customerAddress && <p className="mt-0.5 whitespace-pre-line text-neutral-700">{invoice.customerAddress}</p>}
            {invoice.customerPhone && <p className="mt-0.5 text-neutral-700">Ph: {invoice.customerPhone}</p>}
            {invoice.customerEmail && <p className="text-neutral-700">{invoice.customerEmail}</p>}
            {invoice.customerGstin && <p className="mt-0.5"><span className="text-neutral-600">GSTIN:</span> <b>{invoice.customerGstin}</b></p>}
          </div>
          <table className="w-full self-start">
            <tbody>
              <Detail label="Invoice No." value={invoice.invoiceNumber} bold />
              <Detail label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
              {invoice.dueDate && <Detail label="Due Date" value={formatDate(invoice.dueDate)} />}
              {invoice.orderId && <Detail label="Order Ref." value={`#${invoice.orderId}`} />}
              <Detail label="Order Type" value={invoice.source === "website" ? "Website order" : "Direct sale"} />
              <Detail label="Payment Status" value={statusLabel} last />
            </tbody>
          </table>
        </section>

        {/* ── Items ───────────────────────────────────────────────────── */}
        <table className="mt-4 w-full table-fixed border-collapse text-[10px]">
          {/* Fixed numeric columns; the description takes the remaining width */}
          <colgroup>
            <col className="w-6" />
            <col />
            {hasHsn && <col className="w-[50px]" />}
            <col className="w-[44px]" />
            <col className="w-[56px]" />
            {hasDiscount && <col className="w-[50px]" />}
            {hasTax && <col className="w-[60px]" />}
            {hasTax && (igst ? [0] : [0, 1]).map(i => <Fragment key={i}><col className="w-[36px]" /><col className="w-[50px]" /></Fragment>)}
            <col className="w-[64px]" />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={hasTax ? 2 : 1} className={`${head} text-center`}>Sl.</th>
              <th rowSpan={hasTax ? 2 : 1} className={`${head} text-left`}>Description</th>
              {hasHsn && <th rowSpan={hasTax ? 2 : 1} className={`${head} text-center`}>HSN/SAC</th>}
              <th rowSpan={hasTax ? 2 : 1} className={`${head} text-right`}>Qty</th>
              <th rowSpan={hasTax ? 2 : 1} className={`${head} text-right`}>Rate (₹)</th>
              {hasDiscount && <th rowSpan={hasTax ? 2 : 1} className={`${head} text-right`}>Disc. (₹)</th>}
              {hasTax && <th rowSpan={2} className={`${head} text-right`}>Taxable Value (₹)</th>}
              {hasTax && (igst
                ? <th colSpan={2} className={`${head} text-center`}>IGST</th>
                : <>
                  <th colSpan={2} className={`${head} text-center`}>CGST</th>
                  <th colSpan={2} className={`${head} text-center`}>SGST</th>
                </>)}
              <th rowSpan={hasTax ? 2 : 1} className={`${head} text-right`}>Amount (₹)</th>
            </tr>
            {hasTax && (
              <tr>
                {(igst ? [0] : [0, 1]).map(i => (
                  <Subhead key={i} />
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="break-inside-avoid">
                <td className={`${cell} text-center text-neutral-600`}>{i + 1}</td>
                <td className={`${cell} font-medium`}>{r.it.description}</td>
                {hasHsn && <td className={`${cell} text-center`}>{r.it.hsn || "—"}</td>}
                <td className={`${cell} whitespace-nowrap text-right`}>{Number(r.it.qty)} {r.it.unit}</td>
                <td className={`${cell} text-right`}>{num(r.it.rate)}</td>
                {hasDiscount && <td className={`${cell} text-right`}>{r.discount ? num(r.discount) : "—"}</td>}
                {hasTax && <td className={`${cell} text-right`}>{num(r.taxable)}</td>}
                {hasTax && (igst
                  ? <><td className={`${cell} text-right text-neutral-600`}>{tax}%</td><td className={`${cell} text-right`}>{num(r.tax)}</td></>
                  : <>
                    <td className={`${cell} text-right text-neutral-600`}>{tax / 2}%</td><td className={`${cell} text-right`}>{num(r.cgst)}</td>
                    <td className={`${cell} text-right text-neutral-600`}>{tax / 2}%</td><td className={`${cell} text-right`}>{num(r.sgst)}</td>
                  </>)}
                <td className={`${cell} text-right font-semibold`}>{num(r.total)}</td>
              </tr>
            ))}
            <tr className="bg-neutral-100 font-bold">
              <td className={cell} />
              <td className={`${cell} text-right uppercase tracking-wide`}>Total</td>
              {hasHsn && <td className={cell} />}
              <td className={`${cell} whitespace-nowrap text-right`}>{totalQty !== null ? `${totalQty} ${items[0]?.unit || ""}` : ""}</td>
              <td className={cell} />
              {hasDiscount && <td className={`${cell} text-right`}>{num(sum("discount"))}</td>}
              {hasTax && <td className={`${cell} text-right`}>{num(sum("taxable"))}</td>}
              {hasTax && (igst
                ? <><td className={cell} /><td className={`${cell} text-right`}>{num(sum("tax"))}</td></>
                : <>
                  <td className={cell} /><td className={`${cell} text-right`}>{num(sum("cgst"))}</td>
                  <td className={cell} /><td className={`${cell} text-right`}>{num(sum("sgst"))}</td>
                </>)}
              <td className={`${cell} text-right`}>{num(sum("total"))}</td>
            </tr>
            <tr>
              <td colSpan={colCount} className={cell}>
                <span className="text-neutral-600">Amount chargeable (in words): </span>
                <b>{amountInWords(grand)}</b>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Payment details & totals ────────────────────────────────── */}
        <section className="mt-4 grid grid-cols-[1fr_250px] gap-4">
          <div className="space-y-3">
            {(settings.bankDetails || settings.upiId) && (
              <div className="border border-neutral-300 p-3">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">Bank / payment details</p>
                {settings.bankDetails && <p className="whitespace-pre-line">{settings.bankDetails}</p>}
                {settings.upiId && <p className="mt-0.5">UPI ID: <b>{settings.upiId}</b></p>}
              </div>
            )}
            {invoice.notes && (
              <div>
                <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">Notes</p>
                <p className="whitespace-pre-line text-neutral-700">{invoice.notes}</p>
              </div>
            )}
          </div>
          <table className="w-full self-start border-collapse">
            <tbody>
              <Total label="Gross Amount" value={num(sum("gross"))} />
              {hasDiscount && <Total label="Less: Discount" value={`− ${num(sum("discount"))}`} />}
              {hasTax && <Total label="Taxable Value" value={num(sum("taxable"))} />}
              {hasTax && (igst
                ? <Total label={`IGST @ ${tax}%`} value={num(sum("tax"))} />
                : <>
                  <Total label={`CGST @ ${tax / 2}%`} value={num(sum("cgst"))} />
                  <Total label={`SGST @ ${tax / 2}%`} value={num(sum("sgst"))} />
                </>)}
              {shipping > 0 && <Total label="Shipping & Handling" value={num(shipping)} />}
              {roundOff !== 0 && <Total label="Round Off" value={`${roundOff > 0 ? "+" : "−"} ${num(Math.abs(roundOff))}`} />}
              <tr className="border-x border-neutral-300 border-y-2 border-y-neutral-900">
                <td className="px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider">Grand Total</td>
                <td className="px-2.5 py-2 text-right text-[14px] font-extrabold">{inr(grand, true)}</td>
              </tr>
              {paid > 0 && (
                <>
                  <Total label="Amount Received" value={num(paid)} />
                  <Total label="Balance Due" value={inr(balance, true)} bold />
                </>
              )}
            </tbody>
          </table>
        </section>

        {/* ── Terms & signature ───────────────────────────────────────── */}
        <section className="mt-4 grid grid-cols-[1fr_250px] border border-neutral-300">
          <div className="border-r border-neutral-300 p-3">
            {invoice.terms && (
              <>
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">Terms & conditions</p>
                <ol className="list-decimal space-y-0.5 pl-4 text-[9.5px] text-neutral-700">
                  {invoice.terms.split("\n").filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}
                </ol>
              </>
            )}
          </div>
          <div className="flex flex-col justify-between p-3 text-right">
            <p className="text-[10px]">For <b>{brand}</b></p>
            <p className="mt-12 border-t border-neutral-400 pt-1 text-center text-[9.5px] font-semibold">Authorised Signatory</p>
          </div>
        </section>

        <footer className="mt-auto pt-6 text-center text-[9px] text-neutral-500">
          <p>This is a computer-generated invoice.</p>
          <p className="mt-0.5">Thank you for your business!{settings.phone || settings.email ? ` For any queries, contact ${[settings.phone, settings.email].filter(Boolean).join(" / ")}.` : ""}</p>
        </footer>
      </article>
      </div>
    </div>
  );
};

const Detail = ({ label, value, bold = false, last = false }: { label: string; value: string; bold?: boolean; last?: boolean }) => (
  <tr className={last ? "" : "border-b border-neutral-200"}>
    <td className="w-[42%] px-3 py-1.5 text-neutral-600">{label}</td>
    <td className={`px-3 py-1.5 ${bold ? "font-bold" : "font-medium"}`}>{value}</td>
  </tr>
);

const Subhead = () => (
  <>
    <th className={`${head} text-right`}>Rate</th>
    <th className={`${head} text-right`}>Amt (₹)</th>
  </>
);

const Total = ({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) => (
  <tr className={`border border-neutral-300 ${bold ? "font-bold" : ""}`}>
    <td className="px-2.5 py-1.5 text-neutral-700">{label}</td>
    <td className="px-2.5 py-1.5 text-right">{value}</td>
  </tr>
);

export default InvoicePrint;
