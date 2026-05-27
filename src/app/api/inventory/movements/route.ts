import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") || undefined;
  const type = searchParams.get("type") || undefined;
  const limit = Number(searchParams.get("limit") || "50");

  const movements = await prisma.inventoryMovement.findMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(type ? { type } : {}),
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(movements);
}
