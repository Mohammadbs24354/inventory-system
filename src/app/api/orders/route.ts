import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { session } = auth;
  const isStaff = ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"].includes(session!.user.role);

  const orders = await prisma.order.findMany({
    where: isStaff ? {} : { customerId: session!.user.id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      orderItems: {
        include: { product: { select: { id: true, name: true, sku: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { items } = body as { items: { productId: string; quantity: number }[] };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items in order" }, { status: 400 });
  }

  // Fetch products and validate stock
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 });
    if (product.quantity < item.quantity) {
      return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
    }
  }

  const totalPrice = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      customerId: auth.session!.user.id,
      totalPrice,
      status: "PENDING",
      orderItems: {
        create: items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return { productId: item.productId, quantity: item.quantity, price: product.price };
        }),
      },
    },
    include: {
      orderItems: { include: { product: true } },
      customer: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
