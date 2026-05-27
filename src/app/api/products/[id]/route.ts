import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth, STAFF_ROLES, ADMIN_ROLES } from "@/lib/api-helpers";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const store = getStore();
  const product = store.products.find((p) => p.id === params.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...product,
    warehouse: store.warehouses.find((w) => w.id === product.warehouseId),
    createdBy: (() => { const u = store.users.find((u) => u.id === product.createdById); return u ? { id: u.id, name: u.name } : null; })(),
    inventoryMovements: store.movements
      .filter((m) => m.productId === product.id)
      .slice(-20)
      .reverse()
      .map((m) => ({
        ...m,
        createdBy: (() => { const u = store.users.find((u) => u.id === m.createdById); return u ? { name: u.name } : null; })(),
      })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const store = getStore();
  const idx = store.products.findIndex((p) => p.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, price, description, warehouseId } = await req.json();
  const p = store.products[idx];
  store.products[idx] = {
    ...p,
    name: name ?? p.name,
    price: price ? Number(price) : p.price,
    description: description ?? p.description,
    warehouseId: warehouseId ?? p.warehouseId,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ ...store.products[idx], warehouse: store.warehouses.find((w) => w.id === store.products[idx].warehouseId) });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const store = getStore();
  const idx = store.products.findIndex((p) => p.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  store.products.splice(idx, 1);
  return NextResponse.json({ success: true });
}
