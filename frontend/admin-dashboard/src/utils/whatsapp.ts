// Store-style WhatsApp messages (like the order / invoice updates Amazon and
// Flipkart send). WhatsApp formatting: *bold*, _italic_, ~strike~.
import type { Invoice } from "../services/invoiceService";
import type { Order, OrderStatus } from "../services/orderService";
import { formatDate, inr, waNumber } from "./format";
import { lineAmount } from "./invoiceMath";

export interface StoreDetails {
  companyName?: string;
  phone?: string;
  whatsappNumber?: string;
  upiId?: string;
}

const RULE = "━━━━━━━━━━━━━━━━";
const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
/** ₹1,234 or ₹1,234.50 – paise only when there are any */
const money = (n: number | string) => inr(n, r2(Number(n)) % 1 !== 0);
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

export const waLink = (phone: string | undefined | null, text: string) =>
  `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;

function signOff(store: StoreDetails): string[] {
  const brand = store.companyName || "Astitva Creations";
  const contact = store.phone || store.whatsappNumber;
  return [
    "Questions about your order? Just reply to this message.",
    "",
    `— Team *${brand}*`,
    ...(contact ? [`📞 ${contact}`] : []),
  ];
}

// ── Invoice ─────────────────────────────────────────────────────────────────
export function invoiceMessage(invoice: Invoice, store: StoreDetails): string {
  const brand = store.companyName || "Astitva Creations";
  const items = invoice.items.filter(it => String(it.description || "").trim());
  const grand = Number(invoice.grandTotal) || 0;
  const paid = Number(invoice.amountPaid) || 0;
  const balance = Math.max(0, r2(grand - paid));
  const subtotal = Number(invoice.subtotal) || 0;
  const discount = Number(invoice.discountTotal) || 0;
  const tax = Number(invoice.taxTotal) || 0;
  const taxPct = Number(invoice.taxPercent) || 0;
  const shipping = Number(invoice.shipping) || 0;
  const roundOff = Number(invoice.roundOffAmount) || 0;
  const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  const itemLines = items.flatMap((it, i) => {
    const qty = Number(it.qty) || 0;
    const rate = Number(it.rate) || 0;
    const disc = Number(it.discountPct) || 0;
    const amount = lineAmount({ ...it, qty, rate, discountPct: disc });
    const unit = it.unit && it.unit.toLowerCase() !== "pcs" ? ` ${it.unit}` : "";
    return [
      `*${i + 1}. ${String(it.description).trim()}*`,
      `    Qty: ${qty}${unit} × ${money(rate)}${disc ? ` _(${disc}% off)_` : ""} = *${money(amount)}*`,
    ];
  });

  const summary = [
    `Item total (${totalQty} ${totalQty === 1 ? "item" : "items"}): ${money(subtotal)}`,
    ...(discount > 0 ? [`Discount: −${money(discount)}`] : []),
    ...(tax > 0
      ? invoice.taxMode === "igst"
        ? [`IGST @ ${taxPct}%: ${money(tax)}`]
        : [`CGST @ ${taxPct / 2}%: ${money(r2(tax / 2))}`, `SGST @ ${taxPct / 2}%: ${money(r2(tax - r2(tax / 2)))}`]
      : []),
    ...(shipping > 0 ? [`Delivery charges: ${money(shipping)}`] : []),
    ...(roundOff ? [`Round off: ${roundOff > 0 ? "+" : "−"}${money(Math.abs(roundOff))}`] : []),
    `*Order total: ${money(grand)}*`,
  ];

  const payment =
    invoice.status === "paid" || (grand > 0 && balance === 0)
      ? ["✅ *Payment received* – thank you!"]
      : [
        ...(paid > 0 ? [`Paid so far: ${money(paid)}`] : []),
        `💰 *Amount to pay: ${money(balance)}*`,
        ...(invoice.dueDate ? [`Due by: ${formatDate(invoice.dueDate)}`] : []),
        ...(store.upiId ? ["", `💳 *Pay via UPI:* ${store.upiId}`, "_Please share the payment screenshot here once done._"] : []),
      ];

  return [
    `🧾 *${brand}* – Invoice`,
    "",
    `Hi ${firstName(invoice.customerName)},`,
    "Thank you for shopping with us! Here are your invoice details:",
    "",
    `*Invoice no:* ${invoice.invoiceNumber}`,
    `*Date:* ${formatDate(invoice.invoiceDate)}`,
    "",
    RULE,
    "🛍️ *Items*",
    RULE,
    ...itemLines,
    "",
    RULE,
    "📋 *Price details*",
    RULE,
    ...summary,
    "",
    ...payment,
    ...(invoice.customerAddress ? ["", "📍 *Deliver to*", invoice.customerName, invoice.customerAddress.trim()] : []),
    "",
    ...signOff(store),
  ].join("\n");
}

// ── Website order ───────────────────────────────────────────────────────────
const ORDER_HEADLINE: Record<OrderStatus, string> = {
  new: "📦 We've received your order!",
  confirmed: "✅ Your order is confirmed!",
  in_production: "🖨️ Your order is being printed!",
  shipped: "🚚 Your order has been shipped!",
  delivered: "🎉 Your order has been delivered!",
  cancelled: "❌ Your order has been cancelled",
};

const ORDER_NEXT: Record<OrderStatus, string> = {
  new: "Our team will check your design and confirm the order shortly.",
  confirmed: "We'll start printing soon and update you at every step.",
  in_production: "Your design is on the press. We'll let you know as soon as it ships.",
  shipped: "It's on the way to you. We'll share the tracking details here.",
  delivered: "We hope you love it! Do share a photo wearing it 😊",
  cancelled: "If this was a mistake or you'd like to re-order, just reply here.",
};

export function orderMessage(order: Order, store: StoreDetails): string {
  const brand = store.companyName || "Astitva Creations";
  const variant = [order.colorName, order.size && `Size ${order.size}`].filter(Boolean).join(" · ");
  const sizeExtra = Number(order.sizeExtra) || 0;
  const address = [order.address, [order.city, order.pincode].filter(Boolean).join(" - ")].filter(Boolean).join("\n").trim();

  return [
    `*${brand}*`,
    "",
    ORDER_HEADLINE[order.status],
    "",
    `Hi ${firstName(order.customerName)},`,
    ORDER_NEXT[order.status],
    "",
    `*Order ID:* ${order.orderNumber}`,
    `*Order date:* ${formatDate(order.createdAt)}`,
    "",
    RULE,
    "🛍️ *Item*",
    RULE,
    `*Custom ${order.garmentName}*`,
    ...(variant ? [variant] : []),
    `Qty: ${order.quantity}`,
    "",
    "🎨 *Prints*",
    ...order.prints.map(p => `• ${p.label}${p.kind === "text" && p.text ? ` – “${p.text}”` : ""}: +${money(p.price)}`),
    "",
    RULE,
    "📋 *Price details*",
    RULE,
    `Garment: ${money(order.basePrice)}`,
    `Prints: +${money(order.printsPrice)}`,
    ...(sizeExtra > 0 ? [`Size ${order.size} extra: +${money(sizeExtra)}`] : []),
    `Price per piece: ${money(order.unitPrice)}`,
    ...(order.quantity > 1 ? [`× ${order.quantity} pieces`] : []),
    `*Order total: ${money(order.total)}*`,
    ...(order.status !== "cancelled" && store.upiId && (order.status === "new" || order.status === "confirmed")
      ? ["", `💳 *Pay via UPI:* ${store.upiId}`]
      : []),
    ...(address ? ["", "📍 *Deliver to*", order.customerName, address] : []),
    "",
    ...signOff(store),
  ].join("\n");
}
