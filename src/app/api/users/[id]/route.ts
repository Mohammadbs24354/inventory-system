import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot modify Super Admin" }, { status: 403 });
  }

  const { name, role } = await req.json();
  if (role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot assign Super Admin role" }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { name, role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Super Admin cannot be deleted" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
