import { fetchWithAuth } from "../utils/apiUtils";
import type { InvoiceItem } from "../utils/invoiceMath";

export type InvoiceStatus = "draft" | "unpaid" | "partial" | "paid" | "cancelled";

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  source: "website" | "manual";
  orderId?: number | null;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  items: (InvoiceItem & { amount?: number })[];
  discountType: "amount" | "percent";
  discountValue: number | string;
  taxPercent: number | string;
  taxMode: "cgst_sgst" | "igst";
  shipping: number | string;
  roundOff: boolean;
  subtotal: number | string;
  discountTotal: number | string;
  taxTotal: number | string;
  roundOffAmount: number | string;
  grandTotal: number | string;
  amountPaid: number | string;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  createdAt: string;
}

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string; tone: string }[] = [
  { value: "draft", label: "Draft", tone: "bg-gray-100 text-gray-600" },
  { value: "unpaid", label: "Unpaid", tone: "bg-red-50 text-red-700" },
  { value: "partial", label: "Partly paid", tone: "bg-amber-50 text-amber-700" },
  { value: "paid", label: "Paid", tone: "bg-emerald-50 text-emerald-700" },
  { value: "cancelled", label: "Cancelled", tone: "bg-gray-100 text-gray-400" },
];

async function json(res: Response, fallback: string) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fallback);
  }
  return res.json();
}

export async function fetchInvoices(params: { page?: number; status?: string; q?: string } = {}): Promise<{
  total: number; pages: number; page: number; invoices: Invoice[];
  summary: { billed: number; received: number; outstanding: number };
}> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  return json(await fetchWithAuth(`/invoices?${qs.toString()}`), "Failed to load invoices");
}

export async function fetchInvoice(id: number | string): Promise<Invoice> {
  return json(await fetchWithAuth(`/invoices/${id}`), "Failed to load invoice");
}

export async function fetchNextInvoiceNumber(): Promise<string> {
  const data = await json(await fetchWithAuth("/invoices/next-number"), "Failed to get invoice number");
  return data.invoiceNumber;
}

export async function saveInvoice(id: number | null, data: Record<string, unknown>): Promise<Invoice> {
  const res = await fetchWithAuth(id ? `/invoices/${id}` : "/invoices", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(data),
  });
  return json(res, "Failed to save invoice");
}

export async function deleteInvoice(id: number) {
  return json(await fetchWithAuth(`/invoices/${id}`, { method: "DELETE" }), "Failed to delete invoice");
}
