import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const hash = (pw: string) => bcrypt.hashSync(pw, 12);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const wh1 = await prisma.warehouse.upsert({
      where: { id: "wh-main" },
      update: {},
      create: { id: "wh-main", name: "Main Warehouse", location: "Building A, Floor 1" },
    });

    await prisma.warehouse.upsert({
      where: { id: "wh-secondary" },
      update: {},
      create: { id: "wh-secondary", name: "Secondary Warehouse", location: "Building B, Floor 2" },
    });

    const superAdmin = await prisma.user.upsert({
      where: { email: "superadmin@inventory.com" },
      update: { password: hash("superadmin123"), role: "SUPER_ADMIN" },
      create: {
        id: "user-superadmin",
        name: "Super Admin",
        email: "superadmin@inventory.com",
        password: hash("superadmin123"),
        role: "SUPER_ADMIN",
      },
    });

    await prisma.user.upsert({
      where: { email: "admin@inventory.com" },
      update: { password: hash("admin123"), role: "ADMIN" },
      create: {
        id: "user-admin",
        name: "Admin User",
        email: "admin@inventory.com",
        password: hash("admin123"),
        role: "ADMIN",
      },
    });

    await prisma.user.upsert({
      where: { email: "employee@inventory.com" },
      update: { password: hash("employee123"), role: "EMPLOYEE" },
      create: {
        id: "user-employee",
        name: "Employee User",
        email: "employee@inventory.com",
        password: hash("employee123"),
        role: "EMPLOYEE",
      },
    });

    await prisma.user.upsert({
      where: { email: "customer@inventory.com" },
      update: { password: hash("customer123"), role: "CUSTOMER" },
      create: {
        id: "user-customer",
        name: "Customer User",
        email: "customer@inventory.com",
        password: hash("customer123"),
        role: "CUSTOMER",
      },
    });

    await prisma.product.upsert({
      where: { sku: "DELL-123" },
      update: {},
      create: {
        name: "Dell Laptop",
        sku: "DELL-123",
        price: 999.99,
        quantity: 50,
        description: "Dell Inspiron 15 Laptop - Intel Core i7",
        warehouseId: wh1.id,
        createdById: superAdmin.id,
      },
    });

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
