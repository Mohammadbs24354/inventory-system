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

function formatBucket(date: Date, period: string): string {
  if (period === "12m") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  return date.toISOString().split("T")[0];
}

export async function GET(req: Request) {
  const { error } = await requireAuth(STAFF_ROLES);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30d";
  const { start, end } = getDateRange(period, searchParams.get("from"), searchParams.get("to"));

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: { not: "CANCELLED" },
    },
    select: { createdAt: true, totalPrice: true },
    orderBy: { createdAt: "asc" },
  });

  const bucketMap = new Map<string, { label: string; orders: number; revenue: number }>();

  for (const order of orders) {
    const key = formatBucket(order.createdAt, period);
    const existing = bucketMap.get(key);
    if (existing) {
      existing.orders++;
      existing.revenue += order.totalPrice;
    } else {
      bucketMap.set(key, { label: key, orders: 1, revenue: order.totalPrice });
    }
  }

  const trends = Array.from(bucketMap.values()).sort((a, b) => a.label.localeCompare(b.label));

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  return NextResponse.json({
    trends,
    summary: { totalOrders, totalRevenue, from: start.toISOString(), to: end.toISOString() },
  });
}
