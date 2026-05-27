import { NextRequest, NextResponse } from "next/server";
import { getStore, uid } from "@/lib/store";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";

export async function GET() {
  const store = getStore();
  const result = [...store.warehouses].sort((a, b) => a.name.localeCompare(b.name)).map((w) => ({
    ...w,
    _count: { products: store.products.filter((p) => p.warehouseId === w.id).length },
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const { name, location } = await req.json();
  if (!name || !location)
    return NextResponse.json({ error: "Name and location are required" }, { status: 400 });

  const now = new Date().toISOString();
  const warehouse = { id: uid(), name, location, createdAt: now, updatedAt: now };
  getStore().warehouses.push(warehouse);
  return NextResponse.json(warehouse, { status: 201 });
}
