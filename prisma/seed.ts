import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  // Warehouses
  const wh1 = await prisma.warehouse.upsert({
    where: { id: "wh-main" },
    update: {},
    create: { id: "wh-main", name: "Main Warehouse", location: "Building A, Floor 1" },
  });
  const wh2 = await prisma.warehouse.upsert({
    where: { id: "wh-secondary" },
    update: {},
    create: { id: "wh-secondary", name: "Secondary Warehouse", location: "Building B, Floor 2" },
  });

  // Users
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@inventory.com" },
    update: {},
    create: {
      id: "user-superadmin",
      name: "Super Admin",
      email: "superadmin@inventory.com",
      password: hash("superadmin123"),
      role: "SUPER_ADMIN",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@inventory.com" },
    update: {},
    create: {
      id: "user-admin",
      name: "Admin User",
      email: "admin@inventory.com",
      password: hash("admin123"),
      role: "ADMIN",
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@inventory.com" },
    update: {},
    create: {
      id: "user-employee",
      name: "Employee User",
      email: "employee@inventory.com",
      password: hash("employee123"),
      role: "EMPLOYEE",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@inventory.com" },
    update: {},
    create: {
      id: "user-customer",
      name: "Customer User",
      email: "customer@inventory.com",
      password: hash("customer123"),
      role: "CUSTOMER",
    },
  });

  // Products
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

  await prisma.product.upsert({
    where: { sku: "LOGI-55" },
    update: {},
    create: {
      name: "Logitech Mouse",
      sku: "LOGI-55",
      price: 29.99,
      quantity: 200,
      description: "Logitech MX Master 3 Wireless Mouse",
      warehouseId: wh1.id,
      createdById: superAdmin.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: "KEY-88" },
    update: {},
    create: {
      name: "RGB Keyboard",
      sku: "KEY-88",
      price: 79.99,
      quantity: 150,
      description: "Mechanical RGB Gaming Keyboard",
      warehouseId: wh2.id,
      createdById: admin.id,
    },
  });

  console.log("✅ Seed complete");
  console.log("Super Admin: superadmin@inventory.com / superadmin123");
  console.log("Admin:       admin@inventory.com / admin123");
  console.log("Employee:    employee@inventory.com / employee123");
  console.log("Customer:    customer@inventory.com / customer123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
