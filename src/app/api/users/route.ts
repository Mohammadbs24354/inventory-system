import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

export async function GET() {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  // Only Super Admin can create Admins
  if (role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot create Super Admin" }, { status: 403 });
  }
  if (role === "ADMIN" && auth.session!.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admin can create Admins" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const user = await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 12), role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
