import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      orderItems: {
        include: { product: { select: { id: true, name: true, sku: true, price: true } } },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isStaff = ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"].includes(auth.session!.user.role);
  if (!isStaff && order.customerId !== auth.session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const { status } = await req.json();
  const validStatuses = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { orderItems: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reduce stock when order is PAID
  if (status === "PAID" && order.status === "PENDING") {
    for (const item of order.orderItems) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.quantity < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for product ${item.productId}` }, { status: 400 });
      }
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
      await prisma.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: "OUT",
          quantity: item.quantity,
          reason: `Order ${order.id} confirmed`,
          createdById: auth.session!.user.id,
        },
      });
    }
  }

  // Restore stock when order is CANCELLED (if was PAID)
  if (status === "CANCELLED" && order.status === "PAID") {
    for (const item of order.orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
      await prisma.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: "IN",
          quantity: item.quantity,
          reason: `Order ${order.id} cancelled - stock restored`,
          createdById: auth.session!.user.id,
        },
      });
    }
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      orderItems: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });

  return NextResponse.json(updated);
}
