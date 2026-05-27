import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const warehouseId = searchParams.get("warehouseId") || undefined;

  const products = await prisma.product.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } },
          ],
        } : {},
        warehouseId ? { warehouseId } : {},
      ],
    },
    include: { warehouse: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { name, sku, price, quantity, description, warehouseId } = body;

  if (!name || !sku || !price || !warehouseId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      sku,
      price: Number(price),
      quantity: Number(quantity) || 0,
      description,
      warehouseId,
      createdById: auth.session!.user.id,
    },
    include: { warehouse: true },
  });

  if (quantity && Number(quantity) > 0) {
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: "IN",
        quantity: Number(quantity),
        reason: "Initial stock",
        createdById: auth.session!.user.id,
      },
    });
  }

  return NextResponse.json(product, { status: 201 });
}
