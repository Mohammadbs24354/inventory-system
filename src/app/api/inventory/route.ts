import { NextRequest, NextResponse } from "next/server";
import { getStore, uid } from "@/lib/store";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const { sku, quantity, type, reason, name, price, warehouseId } = await req.json();
  if (!sku || !quantity || !type)
    return NextResponse.json({ error: "SKU, quantity, and type are required" }, { status: 400 });

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0)
    return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });

  const store = getStore();
  let product = store.products.find((p) => p.sku === sku);
  const now = new Date().toISOString();

  if (!product) {
    if (!name || !price || !warehouseId)
      return NextResponse.json(
        { error: "Product not found. Provide name, price, and warehouseId to create it.", action: "create_required" },
        { status: 404 }
      );

    product = {
      id: uid(), sku, name, price: Number(price),
      quantity: type === "IN" ? qty : 0,
      warehouseId, createdById: auth.session!.user.id,
      createdAt: now, updatedAt: now,
    };
    store.products.push(product);
  } else {
    let newQty = product.quantity;
    if (type === "IN") newQty += qty;
    else if (type === "OUT") newQty -= qty;
    else if (type === "ADJUST") newQty = qty;

    if (newQty < 0)
      return NextResponse.json({ error: "Insufficient stock. Cannot go below 0." }, { status: 400 });

    const idx = store.products.indexOf(product);
    store.products[idx] = { ...product, quantity: newQty, updatedAt: now };
    product = store.products[idx];
  }

  const movement = {
    id: uid(), productId: product.id, type, quantity: qty,
    reason: reason || `Stock ${type.toLowerCase()}`,
    createdById: auth.session!.user.id, createdAt: now,
  };
  store.movements.push(movement);

  const createdBy = store.users.find((u) => u.id === movement.createdById);
  return NextResponse.json({ product, movement: { ...movement, product, createdBy: createdBy ? { name: createdBy.name } : null } }, { status: 201 });
}
