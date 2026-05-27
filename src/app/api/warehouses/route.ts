import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";

export async function GET() {
  const warehouses = await prisma.warehouse.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(warehouses);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const { name, location } = await req.json();
  if (!name || !location) {
    return NextResponse.json({ error: "Name and location are required" }, { status: 400 });
  }

  const warehouse = await prisma.warehouse.create({ data: { name, location } });
  return NextResponse.json(warehouse, { status: 201 });
}
