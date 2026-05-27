import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const { name, location } = await req.json();
  const warehouse = await prisma.warehouse.update({
    where: { id: params.id },
    data: { name, location },
  });
  return NextResponse.json(warehouse);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const count = await prisma.product.count({ where: { warehouseId: params.id } });
  if (count > 0) {
    return NextResponse.json({ error: "Cannot delete warehouse with products" }, { status: 400 });
  }

  await prisma.warehouse.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
