import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";

// SKU-based inventory update (Employee workflow)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { sku, quantity, type, reason, name, price, warehouseId } = body;

  if (!sku || !quantity || !type) {
    return NextResponse.json({ error: "SKU, quantity, and type are required" }, { status: 400 });
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
  }

  let product = await prisma.product.findUnique({ where: { sku } });

  if (!product) {
    // Create new product
    if (!name || !price || !warehouseId) {
      return NextResponse.json(
        { error: "Product not found. Provide name, price, and warehouseId to create it.", action: "create_required" },
        { status: 404 }
      );
    }

    product = await prisma.product.create({
      data: {
        sku,
        name,
        price: Number(price),
        quantity: type === "IN" ? qty : 0,
        warehouseId,
        createdById: auth.session!.user.id,
      },
    });
  } else {
    // Update stock
    let newQty = product.quantity;
    if (type === "IN") newQty += qty;
    else if (type === "OUT") newQty -= qty;
    else if (type === "ADJUST") newQty = qty;

    if (newQty < 0) {
      return NextResponse.json({ error: "Insufficient stock. Cannot go below 0." }, { status: 400 });
    }

    product = await prisma.product.update({
      where: { id: product.id },
      data: { quantity: newQty },
    });
  }

  const movement = await prisma.inventoryMovement.create({
    data: {
      productId: product.id,
      type,
      quantity: qty,
      reason: reason || `Stock ${type.toLowerCase()}`,
      createdById: auth.session!.user.id,
    },
    include: {
      product: true,
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ product, movement }, { status: 201 });
}
