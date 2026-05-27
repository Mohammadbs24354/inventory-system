import { NextRequest, NextResponse } from "next/server";
import { getStore, uid } from "@/lib/store";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const store = getStore();
  if (store.users.find((u) => u.email === email))
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const now = new Date().toISOString();
  const user = { id: uid(), name, email, password: await bcrypt.hash(password, 10), role: "CUSTOMER", createdAt: now, updatedAt: now };
  store.users.push(user);

  const { password: _, ...safe } = user;
  return NextResponse.json(safe, { status: 201 });
}
