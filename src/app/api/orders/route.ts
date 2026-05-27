import { NextRequest, NextResponse } from "next/server";
import { getStore, uid } from "@/lib/store";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { session } = auth;
  const isStaff = ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"].includes(session!.user.role);
  const store = getStore();

  const orders = isStaff ? store.orders : store.orders.filter((o) => o.customerId === session!.user.id);

  const result = [...orders].reverse().map((o) => {
    const customer = store.users.find((u) => u.id === o.customerId);
    const orderItems = store.orderItems.filter((i) => i.orderId === o.id).map((i) => {
      const product = store.products.find((p) => p.id === i.productId);
      return { ...i, product: product ? { id: product.id, name: product.name, sku: product.sku } : null };
    });
    return { ...o, customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null, orderItems };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { items } = await req.json() as { items: { productId: string; quantity: number }[] };
  if (!items || items.length === 0)
    return NextResponse.json({ error: "No items in order" }, { status: 400 });

  const store = getStore();
  const products = items.map((i) => store.products.find((p) => p.id === i.productId));

  for (let i = 0; i < items.length; i++) {
    const product = products[i];
    if (!product) return NextResponse.json({ error: `Product ${items[i].productId} not found` }, { status: 404 });
    if (product.quantity < items[i].quantity)
      return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
  }

  const totalPrice = items.reduce((sum, item) => {
    const p = products.find((p) => p?.id === item.productId)!;
    return sum + p.price * item.quantity;
  }, 0);

  const now = new Date().toISOString();
  const order = { id: uid(), customerId: auth.session!.user.id, status: "PENDING", totalPrice, createdAt: now, updatedAt: now };
  store.orders.push(order);

  const orderItems = items.map((item) => {
    const p = products.find((p) => p?.id === item.productId)!;
    const oi = { id: uid(), orderId: order.id, productId: item.productId, quantity: item.quantity, price: p.price };
    store.orderItems.push(oi);
    return { ...oi, product: { id: p.id, name: p.name, sku: p.sku } };
  });

  const customer = store.users.find((u) => u.id === order.customerId);
  return NextResponse.json({ ...order, orderItems, customer: customer ? { id: customer.id, name: customer.name } : null }, { status: 201 });
}
