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
  const minCount = Math.max(1, parseInt(searchParams.get("minCount") || "2"));
  const { start, end } = getDateRange(period, searchParams.get("from"), searchParams.get("to"));

  const store = getStore();
  const validOrders = store.orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= start && d <= end && o.status !== "CANCELLED";
  });

  const pairCounts = new Map<string, { count: number; products: { name: string; sku: string }[] }>();

  for (const order of validOrders) {
    const items = store.orderItems.filter((i) => i.orderId === order.id);
    if (items.length < 2) continue;

    const products = items
      .map((i) => { const p = store.products.find((p) => p.id === i.productId); return { id: i.productId, name: p?.name || "Unknown", sku: p?.sku || "" }; })
      .sort((a, b) => a.id.localeCompare(b.id));

    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const key = `${products[i].id}|${products[j].id}`;
        const existing = pairCounts.get(key);
        if (existing) existing.count++;
        else pairCounts.set(key, { count: 1, products: [{ name: products[i].name, sku: products[i].sku }, { name: products[j].name, sku: products[j].sku }] });
      }
    }
  }

  const associations = Array.from(pairCounts.values())
    .filter((a) => a.count >= minCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)
    .map((a) => ({ ...a, percentage: validOrders.length > 0 ? ((a.count / validOrders.length) * 100).toFixed(1) : "0.0" }));

  return NextResponse.json({ associations, summary: { totalOrders: validOrders.length, from: start.toISOString(), to: end.toISOString() } });
}
