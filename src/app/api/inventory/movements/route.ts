import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth, STAFF_ROLES } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(STAFF_ROLES);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") || "";
  const type = searchParams.get("type") || "";
  const limit = Number(searchParams.get("limit") || "50");

  const store = getStore();
  let movements = store.movements;
  if (productId) movements = movements.filter((m) => m.productId === productId);
  if (type) movements = movements.filter((m) => m.type === type);

  const result = [...movements].reverse().slice(0, limit).map((m) => {
    const product = store.products.find((p) => p.id === m.productId);
    const createdBy = store.users.find((u) => u.id === m.createdById);
    return {
      ...m,
      product: product ? { id: product.id, name: product.name, sku: product.sku } : null,
      createdBy: createdBy ? { id: createdBy.id, name: createdBy.name } : null,
    };
  });

  return NextResponse.json(result);
}
