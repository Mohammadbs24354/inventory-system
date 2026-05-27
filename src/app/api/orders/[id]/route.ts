import { NextRequest, NextResponse } from "next/server";
import { getStore, uid } from "@/lib/store";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const store = getStore();
  const order = store.orders.find((o) => o.id === params.id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isStaff = ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"].includes(auth.session!.user.role);
  if (!isStaff && order.customerId !== auth.session!.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const customer = store.users.find((u) => u.id === order.customerId);
  const orderItems = store.orderItems.filter((i) => i.orderId === order.id).map((i) => {
    const p = store.products.find((p) => p.id === i.productId);
    return { ...i, product: p ? { id: p.id, name: p.name, sku: p.sku, price: p.price } : null };
  });

  return NextResponse.json({ ...order, customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null, orderItems });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const { status } = await req.json();
  const validStatuses = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];
  if (!validStatuses.includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const store = getStore();
  const idx = store.orders.findIndex((o) => o.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = store.orders[idx];
  const items = store.orderItems.filter((i) => i.orderId === order.id);
  const now = new Date().toISOString();

  if (status === "PAID" && order.status === "PENDING") {
    for (const item of items) {
      const pidx = store.products.findIndex((p) => p.id === item.productId);
      if (pidx === -1 || store.products[pidx].quantity < item.quantity)
        return NextResponse.json({ error: `Insufficient stock for product ${item.productId}` }, { status: 400 });
      store.products[pidx] = { ...store.products[pidx], quantity: store.products[pidx].quantity - item.quantity, updatedAt: now };
      store.movements.push({ id: uid(), productId: item.productId, type: "OUT", quantity: item.quantity, reason: `Order ${order.id} confirmed`, createdById: auth.session!.user.id, createdAt: now });
    }
  }

  if (status === "CANCELLED" && order.status === "PAID") {
    for (const item of items) {
      const pidx = store.products.findIndex((p) => p.id === item.productId);
      if (pidx !== -1) {
        store.products[pidx] = { ...store.products[pidx], quantity: store.products[pidx].quantity + item.quantity, updatedAt: now };
        store.movements.push({ id: uid(), productId: item.productId, type: "IN", quantity: item.quantity, reason: `Order ${order.id} cancelled - stock restored`, createdById: auth.session!.user.id, createdAt: now });
      }
    }
  }

  store.orders[idx] = { ...order, status, updatedAt: now };
  const customer = store.users.find((u) => u.id === order.customerId);
  const orderItems = items.map((i) => {
    const p = store.products.find((p) => p.id === i.productId);
    return { ...i, product: p ? { id: p.id, name: p.name, sku: p.sku } : null };
  });

  return NextResponse.json({ ...store.orders[idx], customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null, orderItems });
}
