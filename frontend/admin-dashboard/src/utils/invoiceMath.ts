// Mirrors computeTotals() in backend/controllers/invoiceController.js so the
// totals the admin sees while typing are exactly what gets saved.

export interface InvoiceItem {
  description: string;
  hsn: string;
  unit: string;
  qty: number;
  rate: number;
  discountPct: number;
}

export interface InvoiceAdjustments {
  discountType: 'amount' | 'percent';
  discountValue: number;
  taxPercent: number;
  shipping: number;
  roundOff: boolean;
}

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const nonNeg = (n: number) => Math.max(0, Number(n) || 0);

export const lineAmount = (it: InvoiceItem) =>
  r2(nonNeg(it.qty) * nonNeg(it.rate) * (1 - Math.min(100, nonNeg(it.discountPct)) / 100));

export function computeTotals(items: InvoiceItem[], adj: InvoiceAdjustments) {
  const valid = items.filter(it => it.description.trim());
  const subtotal = r2(valid.reduce((s, it) => s + lineAmount(it), 0));
  const gross = r2(valid.reduce((s, it) => s + nonNeg(it.qty) * nonNeg(it.rate), 0));
  const lineDiscounts = r2(gross - subtotal);
  const discountTotal = r2(adj.discountType === 'percent'
    ? subtotal * Math.min(100, nonNeg(adj.discountValue)) / 100
    : Math.min(nonNeg(adj.discountValue), subtotal));
  const taxable = r2(subtotal - discountTotal);
  const taxTotal = r2(taxable * nonNeg(adj.taxPercent) / 100);
  const beforeRound = r2(taxable + taxTotal + nonNeg(adj.shipping));
  const grandTotal = adj.roundOff ? Math.round(beforeRound) : beforeRound;
  const totalQty = valid.reduce((s, it) => s + nonNeg(it.qty), 0);
  return {
    gross,
    subtotal,
    lineDiscounts,
    discountTotal,
    taxable,
    taxTotal,
    shipping: nonNeg(adj.shipping),
    roundOffAmount: r2(grandTotal - beforeRound),
    grandTotal,
    totalQty,
  };
}

/**
 * Flat discount (₹) needed so the invoice lands on `target` — handy when the
 * admin has agreed a final price with the customer.
 */
export function discountForTarget(subtotal: number, target: number, taxPercent: number, shipping: number): number {
  const taxable = (nonNeg(target) - nonNeg(shipping)) / (1 + nonNeg(taxPercent) / 100);
  return r2(Math.min(subtotal, Math.max(0, subtotal - taxable)));
}
