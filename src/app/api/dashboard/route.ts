import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const store = getStore();
  const totalProducts = store.products.length;
  const totalStock = store.products.reduce((sum, p) => sum + p.quantity, 0);
  const totalOrders = store.orders.length;
  const activeOrders = store.orders.filter((o) => ["PENDING", "PAID"].includes(o.status)).length;

  const recentMovements = [...store.movements].reverse().slice(0, 10).map((m) => {
    const product = store.products.find((p) => p.id === m.productId);
    const createdBy = store.users.find((u) => u.id === m.createdById);
    return { ...m, product: product ? { name: product.name, sku: product.sku } : { name: "Deleted product", sku: "" }, createdBy: createdBy ? { name: createdBy.name } : { name: "Unknown" } };
  });

  const lowStockProducts = [...store.products].filter((p) => p.quantity < 10).sort((a, b) => a.quantity - b.quantity).slice(0, 5);

  const statusCounts = new Map<string, number>();
  for (const o of store.orders) statusCounts.set(o.status, (statusCounts.get(o.status) || 0) + 1);
  const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, _count: { id: count } }));

  const recentOrders = [...store.orders].reverse().slice(0, 5).map((o) => {
    const customer = store.users.find((u) => u.id === o.customerId);
    return { ...o, customer: customer ? { name: customer.name } : null };
  });

  return NextResponse.json({ totalProducts, totalStock, totalOrders, activeOrders, recentMovements, lowStockProducts, ordersByStatus, recentOrders });
}
