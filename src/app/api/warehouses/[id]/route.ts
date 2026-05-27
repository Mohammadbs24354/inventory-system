import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const store = getStore();
  const idx = store.warehouses.findIndex((w) => w.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, location } = await req.json();
  store.warehouses[idx] = { ...store.warehouses[idx], name: name ?? store.warehouses[idx].name, location: location ?? store.warehouses[idx].location, updatedAt: new Date().toISOString() };
  return NextResponse.json(store.warehouses[idx]);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const store = getStore();
  if (store.products.some((p) => p.warehouseId === params.id))
    return NextResponse.json({ error: "Cannot delete warehouse with products" }, { status: 400 });

  const idx = store.warehouses.findIndex((w) => w.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  store.warehouses.splice(idx, 1);
  return NextResponse.json({ success: true });
}
