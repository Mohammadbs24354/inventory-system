import { NextResponse } from "next/server";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

function getDateRange(period: string, from?: string | null, to?: string | null) {
  const now = new Date();
  const end = to ? new Date(to + "T23:59:59Z") : now;
  let start: Date;
  switch (period) {
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "12m":
      start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case "custom":
      start = from ? new Date(from + "T00:00:00Z") : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { start, end };
}

export async function GET(req: Request) {
  const { error } = await requireAuth(STAFF_ROLES);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30d";
  const { start, end } = getDateRange(period, searchParams.get("from"), searchParams.get("to"));

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
    },
    include: {
      product: { select: { name: true, sku: true } },
    },
  });

  const productMap = new Map<string, { name: string; sku: string; totalQuantity: number; totalRevenue: number }>();
  const orderIds = new Set<string>();

  for (const item of orderItems) {
    orderIds.add(item.orderId);
    const existing = productMap.get(item.productId);
    if (existing) {
      existing.totalQuantity += item.quantity;
      existing.totalRevenue += item.price * item.quantity;
    } else {
      productMap.set(item.productId, {
        name: item.product.name,
        sku: item.product.sku,
        totalQuantity: item.quantity,
        totalRevenue: item.price * item.quantity,
      });
    }
  }

  const products = Array.from(productMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);

  return NextResponse.json({
    products,
    summary: {
      totalOrders: orderIds.size,
      totalRevenue,
      from: start.toISOString(),
      to: end.toISOString(),
    },
  });
}
