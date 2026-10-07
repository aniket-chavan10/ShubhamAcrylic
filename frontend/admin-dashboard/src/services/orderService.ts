import { fetchWithAuth } from "../utils/apiUtils";

export type OrderStatus = "new" | "confirmed" | "in_production" | "shipped" | "delivered" | "cancelled";

export interface OrderPrint {
  key: string;
  label: string;
  view: "front" | "back";
  price: number;
  kind: "image" | "text";
  text?: string;
  font?: string;
  color?: string;
  artworkUrl: string;
  transform: { cx: number; cy: number; scale: number; angle: number };
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  pincode?: string;
  notes?: string;
  emailVerified: boolean;
  garmentId?: number;
  garmentName: string;
  colorName?: string;
  colorHex?: string;
  size?: string;
  quantity: number;
  prints: OrderPrint[];
  previews: { front?: string; back?: string };
  basePrice: number | string;
  printsPrice: number | string;
  sizeExtra: number | string;
  unitPrice: number | string;
  total: number | string;
  status: OrderStatus;
  adminNotes?: string;
  createdAt: string;
}

export const ORDER_STATUSES: { value: OrderStatus; label: string; tone: string }[] = [
  { value: "new", label: "New", tone: "bg-accent-soft text-accent-dark" },
  { value: "confirmed", label: "Confirmed", tone: "bg-blue-50 text-blue-700" },
  { value: "in_production", label: "In production", tone: "bg-amber-50 text-amber-700" },
  { value: "shipped", label: "Shipped", tone: "bg-violet-50 text-violet-700" },
  { value: "delivered", label: "Delivered", tone: "bg-emerald-50 text-emerald-700" },
  { value: "cancelled", label: "Cancelled", tone: "bg-gray-100 text-gray-500" },
];

async function json(res: Response, fallback: string) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fallback);
  }
  return res.json();
}

export async function fetchOrders(params: { page?: number; status?: string; q?: string } = {}): Promise<{
  total: number; pages: number; page: number; orders: Order[];
}> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  return json(await fetchWithAuth(`/orders?${qs.toString()}`), "Failed to load orders");
}

export async function fetchOrderStats(): Promise<{ total: number; revenue: number; byStatus: Partial<Record<OrderStatus, number>> }> {
  return json(await fetchWithAuth("/orders/stats"), "Failed to load order stats");
}

export async function fetchOrder(id: number | string): Promise<Order> {
  return json(await fetchWithAuth(`/orders/${id}`), "Failed to load order");
}

/** Raw-material stock changes caused by a status update */
export interface OrderStockChange { material: string; change: number; balance: number; unit: string }

export async function updateOrder(id: number, data: { status?: OrderStatus; adminNotes?: string }): Promise<Order & { stock?: OrderStockChange[] }> {
  return json(await fetchWithAuth(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }), "Failed to update order");
}

export async function deleteOrder(id: number) {
  return json(await fetchWithAuth(`/orders/${id}`, { method: "DELETE" }), "Failed to delete order");
}
