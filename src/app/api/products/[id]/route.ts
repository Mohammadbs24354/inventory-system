import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, STAFF_ROLES, ADMIN_ROLES } from "@/lib/api-helpers";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      warehouse: true,
      createdBy: { select: { id: true, name: true } },
      inventoryMovements: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { createdBy: { select: { name: true } } },
      },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { name, price, description, warehouseId } = body;

  const product = await prisma.product.update({
    where: { id: params.id },
    data: { name, price: price ? Number(price) : undefined, description, warehouseId },
    include: { warehouse: true },
  });

  return NextResponse.json(product);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
