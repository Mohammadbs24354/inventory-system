import { NextRequest, NextResponse } from "next/server";
import { getStore, uid } from "@/lib/store";
import { requireAuth, ADMIN_ROLES } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

export async function GET() {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const store = getStore();
  const users = [...store.users].reverse().map(({ password: _, ...u }) => u);
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(ADMIN_ROLES);
  if (auth.error) return auth.error;

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password || !role)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  if (role === "SUPER_ADMIN")
    return NextResponse.json({ error: "Cannot create Super Admin" }, { status: 403 });
  if (role === "ADMIN" && auth.session!.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Only Super Admin can create Admins" }, { status: 403 });

  const store = getStore();
  if (store.users.find((u) => u.email === email))
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const now = new Date().toISOString();
  const user = { id: uid(), name, email, password: await bcrypt.hash(password, 10), role, createdAt: now, updatedAt: now };
  store.users.push(user);

  const { password: _, ...safe } = user;
  return NextResponse.json(safe, { status: 201 });
}
