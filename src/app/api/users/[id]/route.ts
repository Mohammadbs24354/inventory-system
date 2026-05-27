import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (store.users[idx].role === "SUPER_ADMIN")
    return NextResponse.json({ error: "Cannot modify Super Admin" }, { status: 403 });

  const { name, role } = await req.json();
  if (role === "SUPER_ADMIN")
    return NextResponse.json({ error: "Cannot assign Super Admin role" }, { status: 403 });

  store.users[idx] = { ...store.users[idx], name: name ?? store.users[idx].name, role: role ?? store.users[idx].role, updatedAt: new Date().toISOString() };
  const { password: _, ...safe } = store.users[idx];
  return NextResponse.json(safe);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (store.users[idx].role === "SUPER_ADMIN")
    return NextResponse.json({ error: "Super Admin cannot be deleted" }, { status: 403 });

  store.users.splice(idx, 1);
  return NextResponse.json({ success: true });
}
