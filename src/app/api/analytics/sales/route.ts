import { NextResponse } from "next/server";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";
import { getStore } from "@/lib/store";

function getDateRange(period: string, from?: string | null, to?: string | null) {
  const now = new Date();
  const end = to ? new Date(to + "T23:59:59Z") : now;
  let start: Date;
  switch (period) {
    case "7d": start = new Date(now.getTime() - 7 * 86400000); break;
    case "30d": start = new Date(now.getTime() - 30 * 86400000); break;
    case "12m": start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
    case "custom": start = from ? new Date(from + "T00:00:00Z") : new Date(now.getTime() - 30 * 86400000); break;
    default: start = new Date(now.getTime() - 30 * 86400000);
  }
  return { start, end };
}

export async function GET(req: Request) {
  const { error } = await requireAuth(STAFF_ROLES);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30d";
  const { start, end } = getDateRange(period, searchParams.get("from"), searchParams.get("to"));

  const store = getStore();
  const validOrders = new Set(
    store.orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end && o.status !== "CANCELLED";
    }).map((o) => o.id)
  );

  const orderItems = store.orderItems.filter((i) => validOrders.has(i.orderId));

  const productMap = new Map<string, { name: string; sku: string; totalQuantity: number; totalRevenue: number }>();
  for (const item of orderItems) {
    const product = store.products.find((p) => p.id === item.productId);
    const existing = productMap.get(item.productId);
    if (existing) {
      existing.totalQuantity += item.quantity;
      existing.totalRevenue += item.price * item.quantity;
    } else {
      productMap.set(item.productId, { name: product?.name || "Unknown", sku: product?.sku || "", totalQuantity: item.quantity, totalRevenue: item.price * item.quantity });
    }
  }

  const products = Array.from(productMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
  return NextResponse.json({ products, summary: { totalOrders: validOrders.size, totalRevenue, from: start.toISOString(), to: end.toISOString() } });
}
