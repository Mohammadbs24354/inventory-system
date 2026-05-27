import { NextRequest, NextResponse } from "next/server";
import { getStore, uid } from "@/lib/store";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").toLowerCase();
  const warehouseId = searchParams.get("warehouseId") || "";

  const store = getStore();
  let products = store.products;

  if (search) products = products.filter((p) =>
    p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)
  );
  if (warehouseId) products = products.filter((p) => p.warehouseId === warehouseId);

  const result = [...products].reverse().map((p) => ({
    ...p,
    warehouse: store.warehouses.find((w) => w.id === p.warehouseId),
    createdBy: (() => { const u = store.users.find((u) => u.id === p.createdById); return u ? { id: u.id, name: u.name } : null; })(),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const { name, sku, price, quantity, description, warehouseId } = await req.json();
  if (!name || !sku || !price || !warehouseId)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const store = getStore();
  if (store.products.find((p) => p.sku === sku))
    return NextResponse.json({ error: "SKU already exists" }, { status: 409 });

  const now = new Date().toISOString();
  const product = {
    id: uid(), name, sku, price: Number(price),
    quantity: Number(quantity) || 0,
    description, warehouseId,
    createdById: auth.session!.user.id,
    createdAt: now, updatedAt: now,
  };
  store.products.push(product);

  if (product.quantity > 0) {
    store.movements.push({
      id: uid(), productId: product.id, type: "IN",
      quantity: product.quantity, reason: "Initial stock",
      createdById: auth.session!.user.id, createdAt: now,
    });
  }

  return NextResponse.json({ ...product, warehouse: store.warehouses.find((w) => w.id === warehouseId) }, { status: 201 });
}
