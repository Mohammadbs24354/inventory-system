import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const [
    totalProducts,
    totalStock,
    totalOrders,
    activeOrders,
    recentMovements,
    lowStockProducts,
    ordersByStatus,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.aggregate({ _sum: { quantity: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "PAID"] } } }),
    prisma.inventoryMovement.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      where: { quantity: { lt: 10 } },
      orderBy: { quantity: "asc" },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    totalProducts,
    totalStock: totalStock._sum.quantity || 0,
    totalOrders,
    activeOrders,
    recentMovements,
    lowStockProducts,
    ordersByStatus,
    recentOrders,
  });
}
