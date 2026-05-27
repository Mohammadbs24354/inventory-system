import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAuth(roles?: string[]) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (roles && !roles.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
export const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"];
